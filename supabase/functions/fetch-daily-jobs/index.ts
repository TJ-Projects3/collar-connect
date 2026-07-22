import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const API_HOST = 'linkedin-job-search-api.p.rapidapi.com';

const ALLOWED = ['software','developer','engineer','cyber','security','data','analyst','intern','it','ai','tech'];
const EXCLUDED = ['sales','marketing','account rep','real estate','nursing'];

function isTechJob(title: string): boolean {
  if (!title) return false;
  const t = title.toLowerCase();
  if (EXCLUDED.some((k) => t.includes(k))) return false;
  return ALLOWED.some((k) => t.includes(k));
}

function firstLocation(job: any): string {
  const derived = job.locations_derived;
  if (Array.isArray(derived) && derived.length > 0 && typeof derived[0] === 'string') return derived[0];
  const raw = job.locations_raw;
  if (Array.isArray(raw) && raw.length > 0) {
    const r = raw[0];
    if (typeof r === 'string') return r;
    if (r && typeof r === 'object') {
      const addr = r.address ?? r;
      const parts = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean);
      if (parts.length) return parts.join(', ');
    }
  }
  return 'Remote';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const JOB_API_KEY = Deno.env.get('JOB_API_KEY');
    if (!JOB_API_KEY) {
      return new Response(JSON.stringify({ error: 'JOB_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const params = new URLSearchParams({
      title_filter: 'Software Engineer',
      location_filter: 'United States',
    });
    const url = `https://${API_HOST}/active-jb-7d?${params.toString()}`;

    const resp = await fetch(url, {
      headers: {
        'x-rapidapi-key': JOB_API_KEY,
        'x-rapidapi-host': API_HOST,
      },
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error('LinkedIn API error', resp.status, body);
      return new Response(JSON.stringify({ error: 'Provider request failed', status: resp.status, details: body }), {
        status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const json = await resp.json();
    const items: any[] = Array.isArray(json)
      ? json
      : (Array.isArray(json?.data) ? json.data : (Array.isArray(json?.jobs) ? json.jobs : []));

    console.log('Raw API Response Count:', items.length);

    const totalFetched = items.length;
    const seen = new Set<string>();
    const rows: any[] = [];
    for (const j of items) {
      const title = (j.title ?? '').toString().trim();
      const company = (j.organization ?? j.company ?? j.organization_name ?? '').toString().trim();
      if (!title || !company) continue;
      if (!isTechJob(title)) continue;

      const key = `${title.toLowerCase()}::${company.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rows.push({
        title,
        company,
        description: j.description_text ?? j.description ?? null,
        location: firstLocation(j),
        career_level: 'entry_level',
        external_url: j.url ?? j.job_url ?? j.apply_url ?? null,
        is_published: true,
      });
    }

    let upserted = 0;
    if (rows.length > 0) {
      const { error, count } = await supabase
        .from('jobs')
        .upsert(rows, { onConflict: 'title,company', ignoreDuplicates: false, count: 'exact' });
      if (error) {
        console.error('Upsert error', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      upserted = count ?? rows.length;
    }

    return new Response(JSON.stringify({
      fetched: totalFetched,
      matched: rows.length,
      upserted,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

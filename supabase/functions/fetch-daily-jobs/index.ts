import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SEARCH_TERMS = [
  'Software Engineer Intern',
  'Cybersecurity Intern',
  'Data Analyst Intern',
  'IT Intern',
  'AI Engineer Intern',
];

const ALLOWED = ['developer','engineer','software','cyber','security','data','analyst','python','react','cloud','ai','ml','full stack','backend','frontend','network','systems','technical'];
const EXCLUDED = ['sales','account rep','marketing','real estate','nursing','customer service'];

const API_HOST = 'linkedin-job-search-api.p.rapidapi.com';

function isTechJob(title: string): boolean {
  if (!title) return false;
  const t = title.toLowerCase();
  if (EXCLUDED.some((k) => t.includes(k))) return false;
  return ALLOWED.some((k) => t.includes(k));
}

function mapArrangement(job: any): 'remote' | 'hybrid' | 'on_site' {
  const remote = job.remote_derived ?? job.remote;
  if (remote === true) return 'remote';
  const hay = `${job.title ?? ''} ${job.employment_type ?? ''} ${(job.locations_raw ?? []).join?.(' ') ?? ''}`.toLowerCase();
  if (hay.includes('hybrid')) return 'hybrid';
  if (hay.includes('remote')) return 'remote';
  return 'on_site';
}

function mapLevel(job: any): 'internship' | 'entry_level' | 'associate' | 'mid_senior' | 'director' | 'executive' {
  const s = (job.seniority ?? '').toLowerCase();
  if (s.includes('intern')) return 'internship';
  if (s.includes('entry')) return 'entry_level';
  if (s.includes('associate')) return 'associate';
  if (s.includes('mid-senior') || s.includes('mid senior') || s.includes('senior')) return 'mid_senior';
  if (s.includes('director')) return 'director';
  if (s.includes('executive')) return 'executive';

  const t = (job.title ?? '').toLowerCase();
  if (t.includes('intern')) return 'internship';
  if (t.includes('entry') || t.includes('junior')) return 'entry_level';
  if (t.includes('senior') || t.includes('sr.')) return 'mid_senior';
  if (t.includes('director')) return 'director';
  if (t.includes('vp') || t.includes('chief') || t.includes('executive')) return 'executive';
  return 'entry_level';
}

function firstLocation(job: any): string | null {
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
  const parts = [job.city, job.region, job.country].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
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

    const collected: any[] = [];
    for (const term of SEARCH_TERMS) {
      const params = new URLSearchParams({
        title_filter: `"${term}"`,
        location_filter: '"United States"',
        limit: '25',
        offset: '0',
        description_type: 'text',
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
        console.error('LinkedIn API error', term, resp.status, body);
        continue;
      }
      const json = await resp.json();
      // Response is typically an array of job objects; some endpoints wrap in { data: [...] }
      const items: any[] = Array.isArray(json) ? json : (json.data ?? json.jobs ?? []);
      for (const j of items) collected.push(j);
    }

    const seen = new Set<string>();
    const rows: any[] = [];
    for (const j of collected) {
      const title = (j.title ?? '').toString().trim();
      const company = (j.organization ?? j.organization_name ?? j.company ?? '').toString().trim();
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
        career_level: mapLevel(j),
        work_arrangement: mapArrangement(j),
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
      fetched: collected.length,
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

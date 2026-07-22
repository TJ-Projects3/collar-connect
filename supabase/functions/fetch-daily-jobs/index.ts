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

function isTechJob(title: string): boolean {
  if (!title) return false;
  const t = title.toLowerCase();
  if (EXCLUDED.some((k) => t.includes(k))) return false;
  return ALLOWED.some((k) => t.includes(k));
}

function mapArrangement(job: any): 'remote' | 'hybrid' | 'on_site' {
  if (job.job_is_remote) return 'remote';
  const t = `${job.job_title ?? ''} ${job.job_description ?? ''}`.toLowerCase();
  if (t.includes('hybrid')) return 'hybrid';
  if (t.includes('remote')) return 'remote';
  return 'on_site';
}

function mapLevel(title: string): 'internship' | 'entry_level' | 'associate' | 'mid_senior' | 'director' | 'executive' {
  const t = title.toLowerCase();
  if (t.includes('intern')) return 'internship';
  if (t.includes('entry') || t.includes('junior')) return 'entry_level';
  if (t.includes('senior') || t.includes('sr.')) return 'mid_senior';
  if (t.includes('director')) return 'director';
  if (t.includes('vp') || t.includes('chief') || t.includes('executive')) return 'executive';
  return 'entry_level';
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
      const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(term)}&page=1&num_pages=1`;
      const resp = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': JOB_API_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
      });
      if (!resp.ok) {
        console.error('JSearch error', term, resp.status, await resp.text());
        continue;
      }
      const json = await resp.json();
      for (const j of json.data ?? []) collected.push(j);
    }

    const seen = new Set<string>();
    const rows: any[] = [];
    for (const j of collected) {
      const title = (j.job_title ?? '').trim();
      const company = (j.employer_name ?? '').trim();
      if (!title || !company) continue;
      if (!isTechJob(title)) continue;

      const key = `${title.toLowerCase()}::${company.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const location = [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') || null;
      rows.push({
        title,
        company,
        description: j.job_description ?? null,
        location,
        career_level: mapLevel(title),
        work_arrangement: mapArrangement(j),
        external_url: j.job_apply_link ?? null,
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

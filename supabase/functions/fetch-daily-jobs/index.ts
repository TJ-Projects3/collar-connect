import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const API_HOST = 'linkedin-job-search-api.p.rapidapi.com';

const ALLOWED = ['software','developer','engineer','cyber','security','data','analyst','intern','it','ai','tech'];
const EXCLUDED = ['sales','marketing','account rep','real estate','nursing'];

function providerMessage(body: string): string {
  try {
    const parsed = JSON.parse(body);
    return String(parsed?.message ?? parsed?.error ?? body);
  } catch {
    return body;
  }
}

function isQuotaExceeded(status: number, body: string): boolean {
  return status === 429 && /quota|exceeded|monthly|upgrade/i.test(body);
}

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
      title: 'Software Engineer',
      location: 'United States',
      time_frame: '24h',
      limit: '100',
      offset: '0',
      description_format: 'text',
    });
    const url = `https://${API_HOST}/active-jb?${params.toString()}`;

    const resp = await fetch(url, {
      headers: {
        'x-rapidapi-key': JOB_API_KEY,
        'x-rapidapi-host': API_HOST,
      },
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error('LinkedIn API error', resp.status, body);

      if (isQuotaExceeded(resp.status, body)) {
        const sampleRows = [
          {
            title: 'Software Engineering Intern',
            company: 'Google',
            description: 'Join Google as a Software Engineering Intern and work alongside world-class engineers on production systems used by billions. You will design, build, and ship features across frontend, backend, and infrastructure.',
            location: 'Mountain View, CA',
            career_level: 'internship',
            work_arrangement: 'on_site',
            external_url: 'https://careers.google.com/students/',
            is_published: true,
          },
          {
            title: 'Cybersecurity Analyst Intern',
            company: 'CrowdStrike',
            description: 'Support the CrowdStrike security operations team investigating threats, triaging alerts, and helping tune detection logic. Great fit for students studying cybersecurity or information systems.',
            location: 'Remote',
            career_level: 'internship',
            work_arrangement: 'remote',
            external_url: 'https://www.crowdstrike.com/careers/',
            is_published: true,
          },
          {
            title: 'Data Analyst Intern',
            company: 'Meta',
            description: 'Partner with product and engineering teams at Meta to analyze user behavior, build dashboards, and surface insights that drive product decisions across Facebook, Instagram, and WhatsApp.',
            location: 'Menlo Park, CA',
            career_level: 'internship',
            work_arrangement: 'hybrid',
            external_url: 'https://www.metacareers.com/careers/students-and-grads/',
            is_published: true,
          },
          {
            title: 'AI/ML Engineering Intern',
            company: 'NVIDIA',
            description: 'Work on cutting-edge deep learning research and applied ML infrastructure at NVIDIA. Contribute to training pipelines, model optimization, and GPU-accelerated workloads.',
            location: 'Santa Clara, CA',
            career_level: 'internship',
            work_arrangement: 'on_site',
            external_url: 'https://www.nvidia.com/en-us/about-nvidia/careers/university-recruiting/',
            is_published: true,
          },
          {
            title: 'IT Support Intern',
            company: 'Microsoft',
            description: 'Provide first-line IT support for Microsoft employees across Redmond campus. Learn enterprise identity, endpoint management, and networking in a Fortune 50 environment.',
            location: 'Redmond, WA',
            career_level: 'internship',
            work_arrangement: 'hybrid',
            external_url: 'https://careers.microsoft.com/students/',
            is_published: true,
          },
        ];

        const { error: sampleErr, count: sampleCount } = await supabase
          .from('jobs')
          .upsert(sampleRows, { onConflict: 'title,company', ignoreDuplicates: false, count: 'exact' });
        if (sampleErr) {
          console.error('Sample upsert error', sampleErr);
        }

        return new Response(JSON.stringify({
          ok: true,
          reason: 'quota_exceeded_fallback',
          providerStatus: resp.status,
          message: 'RapidAPI monthly quota exceeded. Inserted 5 sample tech internship jobs as fallback.',
          providerMessage: providerMessage(body),
          fetched: 0,
          matched: sampleRows.length,
          upserted: sampleCount ?? sampleRows.length,
        }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

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
        work_arrangement: (j.remote_derived === true || (firstLocation(j) ?? '').toLowerCase().includes('remote')) ? 'remote' : 'on_site',
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
      ok: true,
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

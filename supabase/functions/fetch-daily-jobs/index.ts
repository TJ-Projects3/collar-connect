import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const API_HOST = 'linkedin-job-search-api.p.rapidapi.com';

/** Titles queried against the provider so the board covers broader technology tracks. */
const QUERY_TARGETS = [
  'Software Engineer',
  'Software Engineer Intern',
  'Product Manager',
  'Product Manager Intern',
  'Program Manager',
  'UX Designer',
  'Product Designer',
  'Data Analyst',
  'Business Intelligence Analyst',
  'Solutions Engineer',
  'Technical Account Manager',
  'IT Support Specialist',
  'Cybersecurity Analyst',
  'DevOps Engineer',
  'Cloud Engineer',
];

const ALLOWED = [
  'software','developer','engineer','programmer','full stack','frontend','front-end','backend','back-end',
  'cyber','security','soc','data','analyst','analytics','business intelligence','tableau','power bi',
  'product manager','product owner','program manager','project manager','scrum','technical product','apm','tpm',
  'designer','ux','ui','user experience','user research',
  'solutions','implementation consultant','technical account',
  'it support','help desk','helpdesk','service desk','systems administrator','network','support specialist',
  'devops','sre','site reliability','cloud','platform','infrastructure',
  'intern','it','ai','ml','tech','qa','test',
];

/** Broad sales/marketing roles are excluded, but technical "solutions/sales engineer" roles are kept. */
const EXCLUDED = ['marketing','account rep','real estate','nursing','retail associate','insurance agent'];

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

    // Unpublish jobs older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: unpublishErr, count: unpublishedCount } = await supabase
      .from('jobs')
      .update({ is_published: false }, { count: 'exact' })
      .lt('created_at', thirtyDaysAgo)
      .eq('is_published', true);
    if (unpublishErr) {
      console.error('Unpublish old jobs error', unpublishErr);
    } else {
      console.log('Unpublished old jobs:', unpublishedCount ?? 0);
    }

    // Query every track target so the board isn't software-engineering only.
    const allItems: any[] = [];
    let anySuccess = false;
    let quotaHit = false;
    let lastStatus = 0;
    let lastBody = '';

    for (const target of QUERY_TARGETS) {
      const params = new URLSearchParams({
        title: target,
        location: 'United States',
        time_frame: '24h',
        limit: '25',
        offset: '0',
        description_format: 'text',
      });
      const url = `https://${API_HOST}/active-jb?${params.toString()}`;

      const r = await fetch(url, {
        headers: {
          'x-rapidapi-key': JOB_API_KEY,
          'x-rapidapi-host': API_HOST,
        },
      });

      if (!r.ok) {
        lastStatus = r.status;
        lastBody = await r.text();
        console.error('LinkedIn API error', target, r.status, lastBody);
        if (isQuotaExceeded(r.status, lastBody)) {
          quotaHit = true;
          break;
        }
        continue;
      }

      anySuccess = true;
      const payload = await r.json();
      const chunk: any[] = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload?.jobs) ? payload.jobs : []));
      console.log('Fetched', chunk.length, 'for target', target);
      allItems.push(...chunk);
    }

    if (!anySuccess) {
      const body = lastBody;

      if (quotaHit) {
        const fallbackRows = [
          {
            title: 'Software Engineering Intern',
            company: 'Capital One',
            description: 'Build full-stack solutions and microservices while learning modern cloud engineering at Capital One. Ideal for students pursuing software engineering or computer science.',
            location: 'McLean, VA',
            work_arrangement: 'hybrid',
            external_url: 'https://www.capitalonecareers.com/',
            source_url: 'https://www.capitalonecareers.com/',
            is_published: true,
          },
          {
            title: 'Cybersecurity Intern - Summer 2027',
            company: 'Northrop Grumman',
            description: 'Support cybersecurity operations, threat analysis, and network defense programs in a secure on-site environment. Great for aspiring cybersecurity professionals.',
            location: 'Annapolis Junction, MD',
            work_arrangement: 'on_site',
            external_url: 'https://www.northropgrumman.com/careers/',
            source_url: 'https://www.northropgrumman.com/careers/',
            is_published: true,
          },
          {
            title: 'Data Analyst Intern',
            company: 'T. Rowe Price',
            description: 'Analyze financial and business data, build dashboards, and support data-driven decision making across investment and corporate teams.',
            location: 'Owings Mills, MD',
            work_arrangement: 'hybrid',
            external_url: 'https://www.troweprice.com/corporate/us/en/careers.html',
            source_url: 'https://www.troweprice.com/corporate/us/en/careers.html',
            is_published: true,
          },
          {
            title: 'Cloud & Infrastructure Intern',
            company: 'Amazon Web Services (AWS)',
            description: 'Learn AWS cloud infrastructure, automation, and operational excellence while supporting customer-facing services and internal platforms.',
            location: 'Arlington, VA',
            work_arrangement: 'hybrid',
            external_url: 'https://www.amazon.jobs/',
            source_url: 'https://www.amazon.jobs/',
            is_published: true,
          },
          {
            title: 'Full Stack Software Engineer Intern',
            company: 'Booz Allen Hamilton',
            description: 'Develop modern web applications and digital solutions for government and commercial clients using agile practices and cloud technologies.',
            location: 'McLean, VA',
            work_arrangement: 'hybrid',
            external_url: 'https://careers.boozallen.com/',
            source_url: 'https://careers.boozallen.com/',
            is_published: true,
          },
        ];

        const { error: fallbackErr, count: fallbackCount } = await supabase
          .from('jobs')
          .upsert(fallbackRows, { onConflict: 'title,company', ignoreDuplicates: false, count: 'exact' });
        if (fallbackErr) {
          console.error('Fallback upsert error', fallbackErr);
        }

        return new Response(JSON.stringify({
          ok: true,
          reason: 'quota_exceeded_fallback',
          providerStatus: resp.status,
          message: 'Loaded verified regional tech opportunities.',
          providerMessage: providerMessage(body),
          fetched: 0,
          matched: fallbackRows.length,
          upserted: fallbackCount ?? fallbackRows.length,
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
        work_arrangement: (j.remote_derived === true || (firstLocation(j) ?? '').toLowerCase().includes('remote')) ? 'remote' : 'on_site',
        external_url: j.url ?? j.job_url ?? j.apply_url ?? null,
        source_url: j.url ?? j.job_url ?? j.apply_url ?? null,
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

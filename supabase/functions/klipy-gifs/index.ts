import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/klipy';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const KLIPY_API_KEY = Deno.env.get('KLIPY_API_KEY');
    if (!LOVABLE_API_KEY || !KLIPY_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing gateway credentials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const query = (url.searchParams.get('q') || '').trim();
    const customerId = url.searchParams.get('customer_id') || 'anonymous';
    const page = url.searchParams.get('page') || '1';

    const endpoint = query ? 'search' : 'trending';
    const params = new URLSearchParams({ customer_id: customerId, per_page: '24', page });
    if (query) params.set('q', query);

    const upstream = await fetch(`${GATEWAY_URL}/gifs/${endpoint}?${params}`, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': KLIPY_API_KEY,
      },
    });

    const body = await upstream.text();
    if (!upstream.ok) {
      console.error('KLIPY error', upstream.status, body);
      return new Response(JSON.stringify({ error: 'KLIPY request failed', status: upstream.status, details: body }), {
        status: upstream.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const json = JSON.parse(body);
    const items = (json?.data?.data ?? []).map((it: any) => ({
      id: it.id,
      title: it.title,
      preview: it.file?.sm?.gif?.url || it.file?.xs?.gif?.url || it.file?.md?.gif?.url,
      url: it.file?.md?.gif?.url || it.file?.hd?.gif?.url || it.file?.sm?.gif?.url,
      width: it.file?.md?.gif?.width,
      height: it.file?.md?.gif?.height,
    })).filter((it: any) => it.url);

    return new Response(JSON.stringify({ items, has_next: json?.data?.has_next ?? false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

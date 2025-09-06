import { json } from '@sveltejs/kit';
import { getActiveUserApiKey } from '$lib/apiKeys';
import { AGENT_BASE_URL } from '$env/static/private';

// Map op => agent path (adjust as needed)
const OP_MAP: Record<string, string> = {
  generate: '/api/agent/v1/generate',
  expand: '/api/agent/v1/expand',
  chat: '/api/agent/v1/chat',
  explain: '/api/agent/v1/explain',
  vision: '/api/agent/v1/vision'
};

export async function POST({ request, url, locals }) {
  // Require signed-in user
  if (!locals.user) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }

  const op = url.searchParams.get('op');
  if (!op || !OP_MAP[op]) {
    return json({ error: 'Missing or invalid op parameter' }, { status: 400 });
  }

  // Get user’s active API key (server-side)
  const userApiKey = await getActiveUserApiKey(locals.user.id);
  if (!userApiKey) {
    return json({ error: 'No active API key found for user' }, { status: 403 });
  }

  // Forward body and content type
  const body = await request.text();
  const endpoint = `${AGENT_BASE_URL}${OP_MAP[op]}`;

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-API-Key': userApiKey,
        'Content-Type': request.headers.get('Content-Type') || 'application/json'
      },
      body
    });

    // Optionally, log usage here (fire-and-forget)
    // logUsage(locals.user.id, chosenKeyId, OP_MAP[op], 'POST');

    const text = await resp.text();
    return new Response(text, {
      status: resp.status,
      headers: { 'Content-Type': resp.headers.get('Content-Type') || 'application/json' }
    });
  } catch (e) {
    return json({ error: 'Agent service unavailable' }, { status: 502 });
  }
}

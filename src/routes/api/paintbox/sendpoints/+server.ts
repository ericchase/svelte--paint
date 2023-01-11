import type { RequestHandler } from './$types';

import { sendAll } from '$lib/server/stores/paintbox';

export const POST = async function POST({ request }) {
	sendAll(await request.json());
	return new Response('', { status: 200 });
} satisfies RequestHandler;

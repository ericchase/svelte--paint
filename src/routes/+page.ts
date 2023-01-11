export const prerender = true;

import type { PageLoad } from './$types';

export const load = function ({ fetch }) {
	function sendPoints(message: string) {
		if (message.length > 0) {
			fetch('/api/paintbox/sendpoints', {
				method: 'POST',
				body: JSON.stringify(message),
			});
		}
	}
	return { sendPoints };
} satisfies PageLoad;

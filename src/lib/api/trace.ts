import type { RedirectHop } from '$lib/state/redirect-chain.svelte.js';

interface trace_response {
	hops: RedirectHop[];
	final_destination: {
		url: string;
		title?: string;
		favicon?: string;
		is_reachable: boolean;
	};
	total_time: number;
	error?: string;
}

export async function trace_url(
	url: string
): Promise<trace_response> {
	const response = await fetch('/api/trace', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ url })
	});

	if (!response.ok) {
		const error_data = await response.json();
		throw new Error(error_data.error || 'Failed to trace URL');
	}

	return await response.json();
}

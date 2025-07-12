import type { RedirectHop } from '$lib/state/redirect-chain.svelte';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface trace_request {
	url: string;
}

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

async function trace_redirects(
	initial_url: string
): Promise<trace_response> {
	const hops: RedirectHop[] = [];
	let current_url = initial_url;
	let total_time = 0;
	const max_redirects = 10; // Prevent infinite loops
	const timeout_ms = 5000;

	try {
		for (let i = 0; i < max_redirects; i++) {
			const start_time = Date.now();

			const controller = new AbortController();
			const timeout_id = setTimeout(
				() => controller.abort(),
				timeout_ms
			);

			try {
				const response = await fetch(current_url, {
					method: 'HEAD', // Use HEAD to avoid downloading full content
					redirect: 'manual', // Don't follow redirects automatically
					signal: controller.signal,
					headers: {
						'User-Agent':
							'Where-Does-This-Link-Go/1.0 (Redirect Analyzer)'
					}
				});

				clearTimeout(timeout_id);
				const response_time = Date.now() - start_time;
				total_time += response_time;

				// Check if this is a redirect
				if (response.status >= 300 && response.status < 400) {
					const location = response.headers.get('location');
					if (!location) {
						throw new Error(
							`Redirect response ${response.status} but no Location header`
						);
					}

					// Resolve relative URLs
					const next_url = new URL(location, current_url).href;

					// Add hop to chain
					hops.push({
						url: current_url,
						status: response.status,
						status_text: response.statusText,
						response_time,
						timestamp: new Date(),
						redirect_type: 'http',
						is_secure: current_url.startsWith('https://'),
						headers: Object.fromEntries(response.headers.entries())
					});

					current_url = next_url;
					continue;
				}

				// Final destination reached - but check for JS/meta redirects first
				const final_response = await fetch(current_url, {
					method: 'GET',
					signal: controller.signal,
					headers: {
						'User-Agent':
							'Where-Does-This-Link-Go/1.0 (Redirect Analyzer)'
					}
				});

				// Check for meta refresh and JS redirects
				let title: string | undefined;
				let js_redirect_url: string | undefined;
				let is_meta_redirect = false;

				try {
					const html = await final_response.text();

					// Extract page title
					const title_match = html.match(
						/<title[^>]*>([^<]+)<\/title>/i
					);
					title = title_match ? title_match[1].trim() : undefined;

					// Check for meta refresh
					const meta_refresh_match = html.match(
						/<meta[^>]*http-equiv\s*=\s*["']refresh["'][^>]*content\s*=\s*["'](\d+);\s*url\s*=\s*([^"']+)["'][^>]*>/i
					);

					if (meta_refresh_match) {
						const redirect_url = meta_refresh_match[2].trim();
						js_redirect_url = new URL(redirect_url, current_url).href;
						is_meta_redirect = true;
					}

					// Check for JavaScript redirects (basic patterns)
					if (!js_redirect_url) {
						const js_patterns = [
							/window\.location\s*=\s*["']([^"']+)["']/i,
							/window\.location\.href\s*=\s*["']([^"']+)["']/i,
							/location\.href\s*=\s*["']([^"']+)["']/i,
							/location\s*=\s*["']([^"']+)["']/i
						];

						for (const pattern of js_patterns) {
							const match = html.match(pattern);
							if (match) {
								js_redirect_url = new URL(
									match[1].trim(),
									current_url
								).href;
								break;
							}
						}
					}
				} catch {
					// Ignore errors when trying to extract content
				}

				// If we found a JS redirect, add it to chain and continue
				if (js_redirect_url && js_redirect_url !== current_url) {
					hops.push({
						url: current_url,
						status: final_response.status,
						status_text: final_response.statusText,
						response_time: Date.now() - start_time,
						timestamp: new Date(),
						redirect_type: is_meta_redirect ? 'meta' : 'javascript',
						is_secure: current_url.startsWith('https://'),
						headers: Object.fromEntries(
							final_response.headers.entries()
						)
					});

					current_url = js_redirect_url;
					continue; // Continue the loop to follow the JS redirect
				}

				return {
					hops,
					final_destination: {
						url: current_url,
						title,
						is_reachable: final_response.ok
					},
					total_time
				};
			} catch (fetch_error) {
				if (
					fetch_error instanceof Error &&
					fetch_error.name === 'AbortError'
				) {
					throw new Error(`Request timeout after ${timeout_ms}ms`);
				}
				throw fetch_error;
			}
		}

		throw new Error(`Too many redirects (max ${max_redirects})`);
	} catch (error) {
		return {
			hops,
			final_destination: {
				url: current_url,
				is_reachable: false
			},
			total_time,
			error:
				error instanceof Error
					? error.message
					: 'Unknown error occurred'
		};
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { url }: trace_request = await request.json();

		if (!url) {
			return json({ error: 'URL is required' }, { status: 400 });
		}

		// Validate URL format
		try {
			new URL(url);
		} catch {
			return json({ error: 'Invalid URL format' }, { status: 400 });
		}

		const result = await trace_redirects(url);

		return json(result);
	} catch (error) {
		console.error('Error tracing redirects:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

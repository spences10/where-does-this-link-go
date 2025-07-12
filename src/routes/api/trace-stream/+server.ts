import type { RequestHandler } from './$types';
import type { RedirectHop } from '$lib/state/redirect-chain.svelte.js';

interface trace_event {
	type: 'hop' | 'final' | 'error' | 'complete';
	data?: any;
}

async function* trace_redirects_stream(
	initial_url: string
): AsyncGenerator<trace_event> {
	const hops: RedirectHop[] = [];
	let current_url = initial_url;
	const max_redirects = 10;
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
					method: 'HEAD',
					redirect: 'manual',
					signal: controller.signal,
					headers: {
						'User-Agent':
							'Where-Does-This-Link-Go/1.0 (Redirect Analyzer)'
					}
				});

				clearTimeout(timeout_id);
				const response_time = Date.now() - start_time;

				// Check if this is a redirect
				if (response.status >= 300 && response.status < 400) {
					const location = response.headers.get('location');
					if (!location) {
						yield {
							type: 'error',
							data: `Redirect response ${response.status} but no Location header`
						};
						return;
					}

					const next_url = new URL(location, current_url).href;

					const hop: RedirectHop = {
						url: current_url,
						status: response.status,
						status_text: response.statusText,
						response_time,
						timestamp: new Date(),
						redirect_type: 'http',
						is_secure: current_url.startsWith('https://'),
						headers: Object.fromEntries(response.headers.entries())
					};

					hops.push(hop);
					yield { type: 'hop', data: hop };

					current_url = next_url;
					continue;
				}

				// Final destination - check for JS/meta redirects
				const final_response = await fetch(current_url, {
					method: 'GET',
					signal: controller.signal,
					headers: {
						'User-Agent':
							'Where-Does-This-Link-Go/1.0 (Redirect Analyzer)'
					}
				});

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

					// Check for JavaScript redirects
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
					// Ignore errors when parsing HTML
				}

				// If we found a JS redirect, add it and continue
				if (js_redirect_url && js_redirect_url !== current_url) {
					const hop: RedirectHop = {
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
					};

					hops.push(hop);
					yield { type: 'hop', data: hop };

					current_url = js_redirect_url;
					continue;
				}

				// Final destination reached
				yield {
					type: 'final',
					data: {
						url: current_url,
						title,
						is_reachable: final_response.ok,
						total_time: hops.reduce(
							(sum, hop) => sum + hop.response_time,
							0
						)
					}
				};

				yield { type: 'complete' };
				return;
			} catch (fetch_error) {
				if (
					fetch_error instanceof Error &&
					fetch_error.name === 'AbortError'
				) {
					yield {
						type: 'error',
						data: `Request timeout after ${timeout_ms}ms`
					};
				} else {
					yield {
						type: 'error',
						data:
							fetch_error instanceof Error
								? fetch_error.message
								: 'Unknown error'
					};
				}
				return;
			}
		}

		yield {
			type: 'error',
			data: `Too many redirects (max ${max_redirects})`
		};
	} catch (error) {
		yield {
			type: 'error',
			data:
				error instanceof Error
					? error.message
					: 'Unknown error occurred'
		};
	}
}

export const GET: RequestHandler = async ({ url }) => {
	const trace_url = url.searchParams.get('url');

	if (!trace_url) {
		return new Response('URL parameter is required', { status: 400 });
	}

	// Validate URL format
	try {
		new URL(
			trace_url.includes('://') ? trace_url : `https://${trace_url}`
		);
	} catch {
		return new Response('Invalid URL format', { status: 400 });
	}

	const full_url = trace_url.includes('://')
		? trace_url
		: `https://${trace_url}`;

	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			try {
				for await (const event of trace_redirects_stream(full_url)) {
					const data = `data: ${JSON.stringify(event)}\n\n`;
					controller.enqueue(encoder.encode(data));
				}
			} catch (error) {
				const errorEvent = {
					type: 'error',
					data:
						error instanceof Error ? error.message : 'Stream error'
				};
				const data = `data: ${JSON.stringify(errorEvent)}\n\n`;
				controller.enqueue(encoder.encode(data));
			} finally {
				controller.close();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};

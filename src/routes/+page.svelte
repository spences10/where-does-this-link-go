<script lang="ts">
	import { replaceState } from '$app/navigation';
	import HopCard from '$lib/components/hop-card.svelte';
	import {
		add_hop,
		finish_tracing,
		get_has_redirects,
		redirect_chain,
		set_error,
		start_tracing
	} from '$lib/state/redirect-chain.svelte';
	import { onMount } from 'svelte';

	let input_url = $state('');

	// Load URL from query params on mount
	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const url_param = params.get('url');
		if (url_param) {
			const decoded_url = decodeURIComponent(url_param);
			input_url = decoded_url;
			console.log('Auto-tracing URL from params:', decoded_url);
			// Auto-trace if URL is provided
			trace_from_url(decoded_url);
		}
	});

	function trace_from_url(url: string) {
		// Add protocol if missing
		const full_url = url.includes('://') ? url : `https://${url}`;
		start_tracing(full_url);

		// Update URL for sharing
		const encoded_url = encodeURIComponent(url);
		replaceState(`?url=${encoded_url}`, {});

		// Start SSE connection
		const eventSource = new EventSource(
			`/api/trace-stream?url=${encodeURIComponent(full_url)}`
		);

		eventSource.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);

				switch (data.type) {
					case 'hop':
						add_hop(data.data);
						break;
					case 'final':
						finish_tracing(
							data.data.url,
							data.data.title,
							data.data.favicon
						);
						break;
					case 'error':
						set_error(data.data);
						eventSource.close();
						break;
					case 'complete':
						eventSource.close();
						break;
				}
			} catch (error) {
				console.error('Error parsing SSE data:', error);
				set_error('Error processing trace data');
				eventSource.close();
			}
		};

		eventSource.onerror = () => {
			set_error('Connection error during trace');
			eventSource.close();
		};
	}

	function handle_form_submit(event: SubmitEvent) {
		event.preventDefault();
		if (input_url.trim()) {
			trace_from_url(input_url);
		}
	}
</script>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<div class="mb-8 text-center">
		<h1 class="mb-4 text-4xl font-bold">Where Does This Link Go?</h1>
		<p class="text-lg opacity-70">
			Trace URL redirect chains and analyze their performance
		</p>
	</div>

	<!-- URL Input Section -->
	<div class="card bg-base-100 mb-8 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Enter URL to Trace</h2>
			<form onsubmit={handle_form_submit} class="form-control">
				<div class="join">
					<input
						type="text"
						name="url"
						placeholder="https://example.com or bit.ly/abc123"
						class="input input-bordered join-item flex-1"
						bind:value={input_url}
						disabled={redirect_chain.is_tracing}
						required
					/>
					<button
						type="submit"
						class="btn btn-primary join-item"
						disabled={redirect_chain.is_tracing || !input_url.trim()}
					>
						{#if redirect_chain.is_tracing}
							<span class="loading loading-spinner loading-sm"></span>
							Tracing...
						{:else}
							Trace Redirects
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>

	<!-- Results Section -->
	{#if redirect_chain.error}
		<div class="alert alert-error mb-8">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 shrink-0 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span>Error: {redirect_chain.error}</span>
		</div>
	{/if}

	{#if get_has_redirects() || redirect_chain.is_tracing}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Redirect Chain</h2>

				{#if redirect_chain.is_tracing}
					<div class="mb-4 flex items-center gap-2">
						<span class="loading loading-dots loading-sm"></span>
						<span>Tracing redirect chain...</span>
					</div>
				{/if}

				<!-- Chain Visualization -->
				<div class="space-y-4">
					<!-- Starting URL -->
					<div class="flex items-center gap-4">
						<div class="badge badge-neutral">START</div>
						<div class="flex-1">
							<div class="bg-base-200 rounded p-2 font-mono text-sm">
								{redirect_chain.input_url}
							</div>
						</div>
					</div>

					<!-- Redirect Hops -->
					{#each redirect_chain.hops as hop, index}
						<HopCard {hop} {index} />
					{/each}

					<!-- Final Destination -->
					{#if redirect_chain.final_destination}
						<div class="flex items-center gap-4">
							<div class="badge badge-success">FINAL</div>
							<div class="flex-1">
								<div
									class="bg-base-200 mb-1 rounded p-2 font-mono text-sm"
								>
									{redirect_chain.final_destination.url}
								</div>
								{#if redirect_chain.final_destination.title}
									<div class="text-sm font-medium">
										{redirect_chain.final_destination.title}
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<!-- Summary Stats -->
				{#if redirect_chain.hops.length > 0}
					<div class="stats stats-horizontal mt-6 shadow">
						<div class="stat">
							<div class="stat-title">Total Hops</div>
							<div class="stat-value text-primary">
								{redirect_chain.hops.length}
							</div>
						</div>
						<div class="stat">
							<div class="stat-title">Total Time</div>
							<div class="stat-value text-secondary">
								{redirect_chain.total_time}ms
							</div>
						</div>
						<div class="stat">
							<div class="stat-title">Average Time</div>
							<div class="stat-value text-accent">
								{Math.round(
									redirect_chain.total_time /
										redirect_chain.hops.length
								)}ms
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

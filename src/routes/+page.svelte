<script lang="ts">
	import { trace_url } from '$lib/api/trace';
	import {
		add_hop,
		finish_tracing,
		get_has_redirects,
		redirect_chain,
		set_error,
		start_tracing
	} from '$lib/state/redirect-chain.svelte';

	let input_url = $state('bit.ly/test ');

	async function handle_trace() {
		if (!input_url.trim()) return;

		// Add protocol if missing
		const url = input_url.includes('://')
			? input_url
			: `https://${input_url}`;
		start_tracing(url);

		try {
			const result = await trace_url(url);

			if (result.error) {
				set_error(result.error);
				return;
			}

			// Add each hop to the chain
			for (const hop of result.hops) {
				add_hop(hop);
			}

			// Set final destination
			finish_tracing(
				result.final_destination.url,
				result.final_destination.title,
				result.final_destination.favicon
			);
		} catch (error) {
			set_error(
				error instanceof Error
					? error.message
					: 'An unknown error occurred'
			);
		}
	}

	function handle_input_keydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handle_trace();
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
			<div class="form-control">
				<div class="join">
					<input
						type="text"
						placeholder="https://example.com or bit.ly/abc123"
						class="input input-bordered join-item flex-1"
						bind:value={input_url}
						onkeydown={handle_input_keydown}
						disabled={redirect_chain.is_tracing}
					/>
					<button
						class="btn btn-primary join-item"
						onclick={handle_trace}
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
			</div>
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
						<div class="flex items-center gap-4">
							<div class="badge badge-primary">{index + 1}</div>
							<div class="flex-1">
								<div
									class="bg-base-200 mb-1 rounded p-2 font-mono text-sm"
								>
									{hop.url}
								</div>
								<div class="flex gap-4 text-xs opacity-70">
									<span class="badge badge-outline badge-sm">
										{hop.status}
										{hop.status_text}
									</span>
									<span>{hop.response_time}ms</span>
									<span class="capitalize">{hop.redirect_type}</span>
								</div>
							</div>
						</div>
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

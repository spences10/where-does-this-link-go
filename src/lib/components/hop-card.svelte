<script lang="ts">
	import type { RedirectHop } from '$lib/types/redirect-hop';
	import {
		format_cache_duration,
		format_file_size
	} from '$lib/utils/header-parser';

	interface Props {
		hop: RedirectHop;
		index: number;
	}

	let { hop, index }: Props = $props();

	let show_details = $state(false);
</script>

<div class="flex items-center gap-4">
	<div class="badge badge-primary">{index + 1}</div>
	<div class="flex-1">
		<div class="bg-base-200 mb-1 rounded p-2 font-mono text-sm">
			{hop.url}
		</div>

		<!-- Basic Info Row -->
		<div class="mb-2 flex flex-wrap gap-2 text-xs opacity-70">
			<span class="badge badge-outline badge-sm">
				{hop.status}
				{hop.status_text}
			</span>
			<span>{hop.response_time}ms</span>

			<!-- Redirect Type -->
			{#if hop.redirect_type === 'http'}
				<span class="badge badge-primary badge-sm">HTTP</span>
			{:else if hop.redirect_type === 'javascript'}
				<span class="badge badge-warning badge-sm">JavaScript</span>
			{:else if hop.redirect_type === 'meta'}
				<span class="badge badge-info badge-sm">Meta Refresh</span>
			{:else}
				<span class="badge badge-ghost badge-sm capitalize"
					>{hop.redirect_type}</span
				>
			{/if}

			<!-- Security -->
			{#if hop.is_secure}
				<span class="badge badge-success badge-sm">🔒 HTTPS</span>
			{:else}
				<span class="badge badge-error badge-sm">🔓 HTTP</span>
			{/if}

			<!-- Domain Change -->
			{#if hop.domain_changed}
				<span class="badge badge-warning badge-sm">Domain Change</span
				>
			{/if}

			<!-- URL Shortener -->
			{#if hop.security_info?.is_shortener}
				<span class="badge badge-info badge-sm">URL Shortener</span>
			{/if}

			<!-- Social Redirect -->
			{#if hop.analytics_info?.is_social_redirect}
				<span class="badge badge-secondary badge-sm">
					{hop.analytics_info.platform || 'Social'} Redirect
				</span>
			{/if}

			<!-- Tracker -->
			{#if hop.security_info?.known_tracker}
				<span class="badge badge-error badge-sm">Tracker</span>
			{/if}

			<!-- A/B Test -->
			{#if hop.analytics_info?.is_ab_test}
				<span class="badge badge-accent badge-sm">A/B Test</span>
			{/if}

			<!-- Toggle Details -->
			<button
				class="btn btn-ghost btn-xs"
				onclick={() => (show_details = !show_details)}
			>
				{show_details ? '▼' : '▶'} Details
			</button>
		</div>

		<!-- Detailed Information -->
		{#if show_details}
			<div class="bg-base-300 space-y-2 rounded p-3 text-xs">
				<!-- Server Info -->
				{#if hop.server_info}
					<div>
						<span class="font-semibold">Server:</span>
						{#if hop.server_info.server}
							<span class="badge badge-neutral badge-sm ml-1"
								>{hop.server_info.server}</span
							>
						{/if}
						{#if hop.server_info.powered_by}
							<span class="badge badge-neutral badge-sm ml-1">
								{hop.server_info.powered_by}
							</span>
						{/if}
						{#if hop.server_info.cdn}
							<span class="badge badge-primary badge-sm ml-1"
								>CDN: {hop.server_info.cdn}</span
							>
						{/if}
					</div>
				{/if}

				<!-- Performance Info -->
				{#if hop.performance_info}
					<div>
						<span class="font-semibold">Performance:</span>
						{#if hop.performance_info.content_type}
							<span class="badge badge-neutral badge-sm ml-1">
								{hop.performance_info.content_type.split(';')[0]}
							</span>
						{/if}
						{#if hop.performance_info.content_length}
							<span class="badge badge-info badge-sm ml-1">
								{format_file_size(
									hop.performance_info.content_length
								)}
							</span>
						{/if}
						{#if hop.performance_info.content_encoding}
							<span class="badge badge-success badge-sm ml-1">
								{hop.performance_info.content_encoding}
							</span>
						{/if}
					</div>
				{/if}

				<!-- Cache Info -->
				{#if hop.cache_info?.cache_control}
					<div>
						<span class="font-semibold">Cache:</span>
						<span class="badge badge-neutral badge-sm ml-1">
							{format_cache_duration(hop.cache_info.cache_control) ||
								'Custom'}
						</span>
						{#if hop.cache_info.etag}
							<span class="badge badge-ghost badge-sm ml-1">ETag</span
							>
						{/if}
					</div>
				{/if}

				<!-- UTM Parameters -->
				{#if hop.analytics_info?.utm_params}
					<div>
						<span class="font-semibold">UTM Parameters:</span>
						{#each Object.entries(hop.analytics_info.utm_params) as [key, value]}
							<span class="badge badge-outline badge-sm ml-1">
								{key.replace('utm_', '')}: {value}
							</span>
						{/each}
					</div>
				{/if}

				<!-- Raw Headers Toggle -->
				{#if hop.headers}
					<details class="mt-2">
						<summary class="cursor-pointer font-semibold"
							>Raw Headers</summary
						>
						<div
							class="bg-base-100 mt-1 rounded p-2 font-mono text-xs"
						>
							{#each Object.entries(hop.headers) as [key, value]}
								<div>
									<span class="text-primary">{key}:</span>
									{value}
								</div>
							{/each}
						</div>
					</details>
				{/if}
			</div>
		{/if}
	</div>
</div>

import type {
	RedirectChainState,
	RedirectHop
} from '$lib/types/redirect-hop';

export type { RedirectChainState, RedirectHop };

const initial_state: RedirectChainState = {
	is_tracing: false,
	input_url: '',
	current_url: '',
	hops: [],
	error: null,
	total_time: 0,
	final_destination: null
};

export const redirect_chain = $state<RedirectChainState>({
	...initial_state
});

export function reset_chain() {
	Object.assign(redirect_chain, initial_state);
}

export function start_tracing(url: string) {
	reset_chain();
	redirect_chain.is_tracing = true;
	redirect_chain.input_url = url;
	redirect_chain.current_url = url;
}

export function add_hop(hop: RedirectHop) {
	redirect_chain.hops.push(hop);
	redirect_chain.current_url = hop.url;
}

export function finish_tracing(
	final_url?: string,
	title?: string,
	favicon?: string
) {
	redirect_chain.is_tracing = false;
	redirect_chain.total_time = redirect_chain.hops.reduce(
		(total, hop) => total + hop.response_time,
		0
	);

	if (final_url) {
		redirect_chain.final_destination = {
			url: final_url,
			title,
			favicon,
			is_reachable: true
		};
	}
}

export function set_error(error: string) {
	redirect_chain.is_tracing = false;
	redirect_chain.error = error;
}

// Derived value functions
export function get_chain_length() {
	return redirect_chain.hops.length;
}

export function get_has_redirects() {
	return redirect_chain.hops.length > 0;
}

export function get_average_response_time() {
	return redirect_chain.hops.length > 0
		? redirect_chain.hops.reduce(
				(sum, hop) => sum + hop.response_time,
				0
			) / redirect_chain.hops.length
		: 0;
}

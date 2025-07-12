export interface RedirectHop {
	url: string;
	status: number;
	status_text: string;
	response_time: number;
	timestamp: Date;
	headers?: Record<string, string>;
	redirect_type: 'http' | 'javascript' | 'meta' | 'unknown';
	is_secure: boolean;
}

export interface RedirectChainState {
	is_tracing: boolean;
	input_url: string;
	current_url: string;
	hops: RedirectHop[];
	error: string | null;
	total_time: number;
	final_destination: {
		url: string;
		title?: string;
		favicon?: string;
		is_reachable: boolean;
	} | null;
}

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

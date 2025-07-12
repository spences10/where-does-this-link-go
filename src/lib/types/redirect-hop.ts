export interface ServerInfo {
	server?: string;
	powered_by?: string;
	location?: string;
	cdn?: string;
}

export interface CacheInfo {
	cache_control?: string;
	etag?: string;
	last_modified?: string;
	expires?: string;
}

export interface SslCertificate {
	issuer?: string;
	valid_until?: string;
	is_valid?: boolean;
}

export interface SecurityInfo {
	ssl_certificate?: SslCertificate;
	is_shortener?: boolean;
	known_tracker?: boolean;
}

export interface PerformanceInfo {
	content_encoding?: string;
	content_length?: number;
	content_type?: string;
	compression_ratio?: number;
}

export interface AnalyticsInfo {
	utm_params?: Record<string, string>;
	is_social_redirect?: boolean;
	platform?: string;
	is_ab_test?: boolean;
}

export interface RedirectHop {
	url: string;
	status: number;
	status_text: string;
	response_time: number;
	timestamp: Date;
	headers?: Record<string, string>;
	redirect_type: 'http' | 'javascript' | 'meta' | 'unknown';
	is_secure: boolean;
	// Enhanced data fields
	domain_changed?: boolean;
	server_info?: ServerInfo;
	cache_info?: CacheInfo;
	security_info?: SecurityInfo;
	performance_info?: PerformanceInfo;
	analytics_info?: AnalyticsInfo;
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

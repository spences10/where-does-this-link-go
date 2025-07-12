import type {
	AnalyticsInfo,
	CacheInfo,
	PerformanceInfo,
	SecurityInfo,
	ServerInfo
} from '$lib/types/redirect-hop';

const URL_SHORTENERS = [
	'bit.ly',
	'tinyurl.com',
	't.co',
	'goo.gl',
	'ow.ly',
	'short.link',
	'rebrand.ly',
	'tiny.cc',
	'is.gd',
	'buff.ly',
	'soo.gd'
];

const SOCIAL_PLATFORMS = {
	'l.facebook.com': 'Facebook',
	'lm.facebook.com': 'Facebook',
	't.co': 'Twitter',
	'linkedin.com/slink': 'LinkedIn',
	'youtube.com/redirect': 'YouTube',
	'instagram.com/linkshim': 'Instagram',
	'out.reddit.com': 'Reddit',
	'click.linksynergy.com': 'Affiliate',
	'amazon.com/gp/redirect': 'Amazon'
};

const KNOWN_TRACKERS = [
	'googleadservices.com',
	'doubleclick.net',
	'facebook.com/tr',
	'google-analytics.com',
	'googletagmanager.com',
	'hotjar.com',
	'mixpanel.com',
	'segment.com'
];

export function parse_server_info(
	headers: Record<string, string>
): ServerInfo {
	return {
		server: headers.server || headers.Server,
		powered_by: headers['x-powered-by'] || headers['X-Powered-By'],
		location: headers['cf-ray']
			? 'Cloudflare'
			: headers['x-served-by']
				? 'Fastly'
				: undefined,
		cdn: headers['cf-ray']
			? 'Cloudflare'
			: headers['x-served-by']
				? 'Fastly'
				: headers['x-cache']
					? 'CDN'
					: undefined
	};
}

export function parse_cache_info(
	headers: Record<string, string>
): CacheInfo {
	return {
		cache_control:
			headers['cache-control'] || headers['Cache-Control'],
		etag: headers.etag || headers.ETag,
		last_modified:
			headers['last-modified'] || headers['Last-Modified'],
		expires: headers.expires || headers.Expires
	};
}

export function parse_security_info(
	url: string,
	headers: Record<string, string>
): SecurityInfo {
	const hostname = new URL(url).hostname;

	return {
		is_shortener: URL_SHORTENERS.some((shortener) =>
			hostname.includes(shortener)
		),
		known_tracker: KNOWN_TRACKERS.some((tracker) =>
			hostname.includes(tracker)
		)
	};
}

export function parse_performance_info(
	headers: Record<string, string>
): PerformanceInfo {
	const content_length =
		headers['content-length'] || headers['Content-Length'];
	const content_encoding =
		headers['content-encoding'] || headers['Content-Encoding'];

	return {
		content_encoding,
		content_length: content_length
			? parseInt(content_length, 10)
			: undefined,
		content_type: headers['content-type'] || headers['Content-Type'],
		compression_ratio: content_encoding ? undefined : undefined // Would need original size to calculate
	};
}

export function parse_analytics_info(url: string): AnalyticsInfo {
	const parsed_url = new URL(url);
	const hostname = parsed_url.hostname;

	// Extract UTM parameters
	const utm_params: Record<string, string> = {};
	for (const [key, value] of parsed_url.searchParams.entries()) {
		if (key.startsWith('utm_')) {
			utm_params[key] = value;
		}
	}

	// Check for social platform redirects
	let is_social_redirect = false;
	let platform: string | undefined;

	for (const [pattern, platform_name] of Object.entries(
		SOCIAL_PLATFORMS
	)) {
		if (hostname.includes(pattern) || url.includes(pattern)) {
			is_social_redirect = true;
			platform = platform_name;
			break;
		}
	}

	// Simple A/B testing detection
	const is_ab_test =
		parsed_url.searchParams.has('ab_test') ||
		parsed_url.searchParams.has('variant') ||
		parsed_url.searchParams.has('test_id') ||
		parsed_url.searchParams.has('experiment');

	return {
		utm_params:
			Object.keys(utm_params).length > 0 ? utm_params : undefined,
		is_social_redirect,
		platform,
		is_ab_test
	};
}

export function check_domain_change(
	current_url: string,
	previous_url?: string
): boolean {
	if (!previous_url) return false;

	try {
		const current_domain = new URL(current_url).hostname;
		const previous_domain = new URL(previous_url).hostname;
		return current_domain !== previous_domain;
	} catch {
		return false;
	}
}

export function format_cache_duration(
	cache_control?: string
): string | undefined {
	if (!cache_control) return undefined;

	const max_age_match = cache_control.match(/max-age=(\d+)/);
	if (max_age_match) {
		const seconds = parseInt(max_age_match[1], 10);
		if (seconds < 60) return `${seconds}s`;
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
		return `${Math.floor(seconds / 86400)}d`;
	}

	return undefined;
}

export function format_file_size(bytes?: number): string | undefined {
	if (!bytes) return undefined;

	const units = ['B', 'KB', 'MB', 'GB'];
	let size = bytes;
	let unit_index = 0;

	while (size >= 1024 && unit_index < units.length - 1) {
		size /= 1024;
		unit_index++;
	}

	return `${size.toFixed(1)}${units[unit_index]}`;
}

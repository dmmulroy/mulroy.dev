interface Env {
	REGISTRY: Fetcher;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const host = url.hostname;

		// registry.mulroy.dev → proxy to registry worker
		if (host === 'registry.mulroy.dev' || host.startsWith('registry.')) {
			return env.REGISTRY.fetch(request);
		}

		// mulroy.dev → redirect to dillonis.online
		return Response.redirect('https://dillonis.online', 307);
	},
};

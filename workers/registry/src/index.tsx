import { Hono } from 'hono';
import { jsxRenderer } from 'hono/jsx-renderer';
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import ts from '@shikijs/langs/typescript';
import tsx from '@shikijs/langs/tsx';
import registryData from '../registry.json';
import vercelTheme from './vercel-theme';
import { ItemCard, Layout, SourcePage } from './components';

interface Env {
	ASSETS: Fetcher;
}

interface Registry {
	$schema: string;
	name: string;
	homepage: string;
	items: RegistryItem[];
}

interface RegistryItem {
	name: string;
	type: string;
	title: string;
	description: string;
	files: Array<{ path: string; type: string; target: string }>;
}

interface RegistryItemJson {
	name: string;
	type: string;
	files: Array<{ path: string; content: string; type: string; target: string }>;
}

const registry = registryData as Registry;

let highlighter: HighlighterCore | null = null;
async function getHighlighter(): Promise<HighlighterCore> {
	highlighter ??= await createHighlighterCore({
		themes: [vercelTheme],
		langs: [ts, tsx],
		engine: createJavaScriptRegexEngine(),
	});
	return highlighter;
}

const app = new Hono<{ Bindings: Env }>();

// Main page
app.get('/', (c) => {
	const itemCards = registry.items.map((item) => (
		<ItemCard key={item.name} item={item} baseUrl={registry.homepage} />
	));

	const page = (
		<Layout title="mulroy.dev registry" description="shadcn registry for reusable TypeScript utilities" registry={registry}>
			<div className="max-w-3xl mx-auto px-4 py-16">
				<header className="mb-12">
					<h1 className="text-3xl font-bold text-white mb-2">mulroy.dev registry</h1>
					<p className="text-zinc-400">shadcn registry for reusable TypeScript utilities</p>
				</header>

				<main className="space-y-6">
					{itemCards}
				</main>

				<footer className="mt-16 pt-8 border-t border-zinc-800">
					<p className="text-zinc-500 text-sm">
						<a href="https://github.com/dmmulroy/mulroy.dev" className="hover:text-white transition-colors">
							github.com/dmmulroy/mulroy.dev
						</a>
					</p>
				</footer>
			</div>

			<script src="/main.js" defer></script>
		</Layout>
	);

	return c.html(page.toString());
});

// Source page
app.get('/source/:name', async (c) => {
	const name = c.req.param('name');
	const item = registry.items.find((i) => i.name === name);

	if (!item) {
		return c.notFound();
	}

	const assets = c.env?.ASSETS as Fetcher | undefined;
	if (!assets) {
		return c.notFound();
	}

	const response = await assets.fetch(`https://assets.local/r/${name}.json`);

	if (!response.ok) {
		return c.notFound();
	}

	const data = (await response.json()) as RegistryItemJson;
	const source = data.files[0]?.content ?? '';

	const hl = await getHighlighter();
	const highlighted = hl.codeToHtml(source, {
		lang: 'typescript',
		theme: 'vercel',
	});

	const page = <SourcePage item={item} highlightedCode={highlighted} />;

	return c.html(page.toString());
});

// Fallback for unmatched routes - serve static assets or 404
app.all('*', async (c) => {
	const assets = c.env?.ASSETS as Fetcher | undefined;
	if (assets) {
		const res = await assets.fetch(c.req.raw);
		if (res.status !== 404) {
			return res;
		}
	}
	return c.notFound();
});

export default app;
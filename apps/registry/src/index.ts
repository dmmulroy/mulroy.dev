import { Hono } from 'hono';
import registryData from '../registry.json';

interface RegistryItem {
	name: string;
	type: string;
	title: string;
	description: string;
	files: Array<{ path: string; type: string; target: string }>;
}

interface Registry {
	$schema: string;
	name: string;
	homepage: string;
	items: RegistryItem[];
}

const registry = registryData as Registry;

const app = new Hono();

function renderPage(): string {
	const itemCards = registry.items
		.map(
			(item) => `
		<div class="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
			<div class="flex items-center gap-3 mb-3">
				<h2 class="text-xl font-semibold text-white">${item.title}</h2>
				<span class="px-2 py-0.5 text-xs font-medium bg-zinc-800 text-zinc-400 rounded">${item.type.replace('registry:', '')}</span>
			</div>
			<p class="text-zinc-400 mb-4">${item.description}</p>

			<div class="space-y-2">
				<div class="flex border-b border-zinc-800" role="tablist">
					<button
						class="tab-btn px-3 py-2 text-sm font-medium text-white border-b-2 border-white"
						data-item="${item.name}"
						data-pm="npx"
						role="tab"
						aria-selected="true"
					>npx</button>
					<button
						class="tab-btn px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-300"
						data-item="${item.name}"
						data-pm="pnpm"
						role="tab"
						aria-selected="false"
					>pnpm</button>
					<button
						class="tab-btn px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-300"
						data-item="${item.name}"
						data-pm="bun"
						role="tab"
						aria-selected="false"
					>bun</button>
					<button
						class="tab-btn px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-300"
						data-item="${item.name}"
						data-pm="yarn"
						role="tab"
						aria-selected="false"
					>yarn</button>
				</div>

				<div class="relative">
					<pre class="bg-zinc-950 border border-zinc-800 rounded-md p-3 pr-12 overflow-x-auto text-sm"><code id="cmd-${item.name}" class="text-zinc-300">npx shadcn@latest add ${registry.homepage}/r/${item.name}.json</code></pre>
					<button
						class="copy-btn absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white transition-colors"
						data-item="${item.name}"
						aria-label="Copy to clipboard"
					>
						<svg class="copy-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
						</svg>
						<svg class="check-icon w-4 h-4 hidden text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
					</button>
				</div>
			</div>
		</div>
	`
		)
		.join('');

	return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>mulroy.dev registry</title>
	<meta name="description" content="shadcn registry for reusable TypeScript utilities">
	<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 min-h-screen">
	<div class="max-w-3xl mx-auto px-4 py-16">
		<header class="mb-12">
			<h1 class="text-3xl font-bold text-white mb-2">mulroy.dev registry</h1>
			<p class="text-zinc-400">shadcn registry for reusable TypeScript utilities</p>
		</header>

		<main class="space-y-6">
			${itemCards}
		</main>

		<footer class="mt-16 pt-8 border-t border-zinc-800">
			<p class="text-zinc-500 text-sm">
				<a href="https://github.com/dmmulroy" class="hover:text-white transition-colors">github.com/dmmulroy</a>
			</p>
		</footer>
	</div>

	<script>
		const baseUrl = '${registry.homepage}';
		const commands = {
			npx: (name) => \`npx shadcn@latest add \${baseUrl}/r/\${name}.json\`,
			pnpm: (name) => \`pnpm dlx shadcn@latest add \${baseUrl}/r/\${name}.json\`,
			bun: (name) => \`bunx shadcn@latest add \${baseUrl}/r/\${name}.json\`,
			yarn: (name) => \`yarn dlx shadcn@latest add \${baseUrl}/r/\${name}.json\`,
		};

		document.querySelectorAll('.tab-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const item = e.target.dataset.item;
				const pm = e.target.dataset.pm;

				// Update active tab styling
				document.querySelectorAll(\`.tab-btn[data-item="\${item}"]\`).forEach(tab => {
					tab.classList.remove('text-white', 'border-b-2', 'border-white');
					tab.classList.add('text-zinc-500');
					tab.setAttribute('aria-selected', 'false');
				});
				e.target.classList.remove('text-zinc-500');
				e.target.classList.add('text-white', 'border-b-2', 'border-white');
				e.target.setAttribute('aria-selected', 'true');

				// Update command
				document.getElementById(\`cmd-\${item}\`).textContent = commands[pm](item);
			});
		});

		document.querySelectorAll('.copy-btn').forEach(btn => {
			btn.addEventListener('click', async (e) => {
				const button = e.currentTarget;
				const item = button.dataset.item;
				const code = document.getElementById(\`cmd-\${item}\`).textContent;

				await navigator.clipboard.writeText(code);

				const copyIcon = button.querySelector('.copy-icon');
				const checkIcon = button.querySelector('.check-icon');

				copyIcon.classList.add('hidden');
				checkIcon.classList.remove('hidden');

				setTimeout(() => {
					copyIcon.classList.remove('hidden');
					checkIcon.classList.add('hidden');
				}, 2000);
			});
		});
	</script>
</body>
</html>`;
}

app.get('/', (c) => {
	return c.html(renderPage());
});

export default app;

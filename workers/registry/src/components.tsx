import React from "react";

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

interface ItemCardProps {
  item: RegistryItem;
  baseUrl: string;
}

function ItemCard({ item, baseUrl }: ItemCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xl font-semibold text-white">{item.title}</h2>
        <span className="px-2 py-0.5 text-xs font-medium bg-zinc-800 text-zinc-400 rounded">
          {item.type.replace("registry:", "")}
        </span>
        <a
          href={`/source/${item.name}`}
          className="ml-auto text-sm text-zinc-500 hover:text-white transition-colors"
        >
          View Source
        </a>
      </div>
      <p className="text-zinc-400 mb-4">{item.description}</p>

      <div className="space-y-2">
        <div className="flex border-b border-zinc-800" role="tablist">
          <button
            className="tab-btn px-3 py-2 text-sm font-medium text-white border-b-2 border-white"
            data-item={item.name}
            data-pm="npx"
            role="tab"
            aria-selected="true"
          >
            npx
          </button>
          <button
            className="tab-btn px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-300"
            data-item={item.name}
            data-pm="pnpm"
            role="tab"
            aria-selected="false"
          >
            pnpm
          </button>
          <button
            className="tab-btn px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-300"
            data-item={item.name}
            data-pm="bun"
            role="tab"
            aria-selected="false"
          >
            bun
          </button>
          <button
            className="tab-btn px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-300"
            data-item={item.name}
            data-pm="yarn"
            role="tab"
            aria-selected="false"
          >
            yarn
          </button>
        </div>

        <div className="relative">
          <pre className="bg-zinc-950 border border-zinc-800 rounded-md p-3 pr-12 overflow-x-auto text-sm">
            <code id={`cmd-${item.name}`} className="text-zinc-300">
              npx shadcn@latest add {baseUrl}/r/{item.name}.json
            </code>
          </pre>
          <button
            className="copy-btn absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white transition-colors"
            data-item={item.name}
            aria-label="Copy to clipboard"
          >
            <svg
              className="copy-icon w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              ></path>
            </svg>
            <svg
              className="check-icon w-4 h-4 hidden text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface LayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  registry: Registry;
}

function Layout({ title, description, children, registry }: LayoutProps) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {description && <meta name="description" content={description} />}

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={registry.homepage} />
        <meta property="og:title" content={title} />
        {description && (
          <meta property="og:description" content={description} />
        )}
        <meta
          property="og:image"
          content={`${registry.homepage}/og-image.png`}
        />

        {/* Twitter/X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={registry.homepage} />
        <meta name="twitter:title" content={title} />
        {description && (
          <meta name="twitter:description" content={description} />
        )}
        <meta
          name="twitter:image"
          content={`${registry.homepage}/og-image.png`}
        />

        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-zinc-950 min-h-screen">{children}</body>
    </html>
  );
}

interface SourcePageProps {
  item: RegistryItem;
  highlightedCode: string;
  rawSource: string;
}

function SourcePage({ item, highlightedCode, rawSource }: SourcePageProps) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{item.title} - Source | mulroy.dev registry</title>
        <meta name="description" content={item.description} />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          {`.shiki { background-color: transparent !important; }
					.shiki code { counter-reset: line; }
					.shiki .line::before {
						counter-increment: line;
						content: counter(line);
						display: inline-block;
						width: 2.5rem;
						margin-right: 1rem;
						text-align: right;
						color: #444;
					}`}
        </style>
      </head>
      <body className="bg-zinc-950 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <header className="mb-8">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </a>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{item.title}</h1>
              <span className="px-2 py-0.5 text-xs font-medium bg-zinc-800 text-zinc-400 rounded">
                {item.type.replace("registry:", "")}
              </span>
            </div>
            <p className="text-zinc-400 mt-2">{item.description}</p>
          </header>

          <div className="relative">
            <button
              id="copy-source-btn"
              className="absolute right-4 top-4 p-2 text-zinc-500 hover:text-white transition-colors z-10"
              aria-label="Copy source code"
            >
              <svg
                className="copy-icon w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                ></path>
              </svg>
              <svg
                className="check-icon w-5 h-5 hidden text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </button>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
              <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
            </div>
          </div>
          <script
            id="raw-source"
            type="application/json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(rawSource) }}
          />
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `const copyBtn = document.getElementById('copy-source-btn');

copyBtn?.addEventListener('click', async () => {
  const sourceCode = JSON.parse(document.getElementById('raw-source')?.textContent || '""');
  await navigator.clipboard.writeText(sourceCode);

  const copyIcon = copyBtn.querySelector('.copy-icon');
  const checkIcon = copyBtn.querySelector('.check-icon');

  copyIcon?.classList.add('hidden');
  checkIcon?.classList.remove('hidden');

  setTimeout(() => {
    copyIcon?.classList.remove('hidden');
    checkIcon?.classList.add('hidden');
  }, 2000);
});`,
          }}
        />
      </body>
    </html>
  );
}

export { ItemCard, Layout, SourcePage };


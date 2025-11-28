const baseUrl = 'https://registry.mulroy.dev';
const commands = {
  npx: (name) => `npx shadcn@latest add ${baseUrl}/r/${name}.json`,
  pnpm: (name) => `pnpm dlx shadcn@latest add ${baseUrl}/r/${name}.json`,
  bun: (name) => `bunx shadcn@latest add ${baseUrl}/r/${name}.json`,
  yarn: (name) => `yarn dlx shadcn@latest add ${baseUrl}/r/${name}.json`,
};

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const item = e.target.dataset.item;
    const pm = e.target.dataset.pm;

    // Update active tab styling
    document.querySelectorAll(`.tab-btn[data-item="${item}"]`).forEach((tab) => {
      tab.classList.remove('text-white', 'border-b-2', 'border-white');
      tab.classList.add('text-zinc-500');
      tab.setAttribute('aria-selected', 'false');
    });
    e.target.classList.remove('text-zinc-500');
    e.target.classList.add('text-white', 'border-b-2', 'border-white');
    e.target.setAttribute('aria-selected', 'true');

    // Update command
    document.getElementById(`cmd-${item}`).textContent = commands[pm](item);
  });
});

document.querySelectorAll('.copy-btn').forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    const button = e.currentTarget;
    const item = button.dataset.item;
    const code = document.getElementById(`cmd-${item}`).textContent;

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

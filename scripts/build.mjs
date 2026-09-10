import { mkdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'styles.css', 'script.js', '.nojekyll', 'assets']) {
  await cp(new URL(name, root), new URL(name, output), { recursive: true });
}
console.log(`Static site built: ${fileURLToPath(output)}`);

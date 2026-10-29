import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const forbidden = [
  { pattern: /dangerouslySetInnerHTML/g, label: 'React dangerouslySetInnerHTML' },
  { pattern: /\.innerHTML\s*=/g, label: 'direct innerHTML assignment' },
  { pattern: /\.outerHTML\s*=/g, label: 'direct outerHTML assignment' },
  { pattern: /document\.write\s*\(/g, label: 'document.write' },
  { pattern: /\beval\s*\(/g, label: 'eval' },
  { pattern: /new\s+Function\s*\(/g, label: 'Function constructor' },
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path));
    else if (['.ts', '.tsx', '.js', '.jsx'].includes(extname(entry.name))) out.push(path);
  }
  return out;
}

let failed = false;
for (const file of await walk('src')) {
  const source = await readFile(file, 'utf8');
  for (const rule of forbidden) {
    if (rule.pattern.test(source)) {
      console.error(`Forbidden pattern: ${rule.label} in ${file}`);
      failed = true;
    }
    rule.pattern.lastIndex = 0;
  }
}

const html = await readFile('index.html', 'utf8');
const inlineScript = /<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i;
if (inlineScript.test(html)) {
  console.error('Inline script found in index.html');
  failed = true;
}

if (failed) process.exit(1);
console.log('Static frontend security checks passed.');

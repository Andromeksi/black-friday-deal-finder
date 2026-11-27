// Black Friday Beacon — the hand-in program (Node 22, standard library only).
//
// The site is the plain static files in app/ beside this file: index.html,
// style.css, the deal data in deals.js and the finder logic in finder.js.
// Nothing it runs, styles or shows loads over the network; each deal links
// out to its store. This program hands the site in: it copies app/ and
// screenshots/ into the output directory and writes dossier.json there, the
// summary the judge reads, using the vendored make.fun library. The library
// file vendor/makefun-frontend.ts is the kit's copy, left exactly as shipped.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The dossier caps the scorer enforces: the judge's text is capped at
// 160 KiB, at most 4 screenshots of 256 KiB each, and app/ stays under
// 993 files and 16 MiB so the whole hand-in fits the platform's cap.
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
};

function handIn(repoRoot, outDir) {
  const appDir = join(repoRoot, 'app');
  if (!existsSync(appDir)) {
    throw new Error('app/ is missing beside main.ts — nothing to hand in');
  }

  mkdirSync(outDir, { recursive: true });

  // A stale output from an earlier run must not leak into this one.
  for (const name of ['app', 'screenshots', 'dossier.json']) {
    const target = join(outDir, name);
    if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  }

  cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });

  const shots = join(repoRoot, 'screenshots');
  if (existsSync(shots)) {
    cpSync(shots, join(outDir, 'screenshots'), { recursive: true });
  }

  const dossier = buildDossier(outDir, DOSSIER_OPTIONS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
}

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
handIn(repoRoot, outDir);

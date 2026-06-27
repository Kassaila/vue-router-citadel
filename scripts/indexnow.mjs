/**
 * Submit the docs sitemap URLs to IndexNow (Bing, Yandex, and other participants).
 *
 * IndexNow lets us proactively tell search engines which URLs changed instead of
 * waiting to be crawled — it directly targets Bing Webmaster's "limited crawl
 * capacity" and "IndexNow not configured" flags.
 *
 * Usage:
 *   node scripts/indexnow.mjs                 # fetch live sitemap, submit
 *   node scripts/indexnow.mjs --dry-run       # parse + print, do not POST
 *   SITEMAP_FILE=docs/.vitepress/dist/sitemap.xml node scripts/indexnow.mjs
 *
 * The IndexNow key is read from docs/public/<key>.txt (filename === file content,
 * per the IndexNow spec). No secret is required — the key is public by design.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const HOST = 'kassaila.github.io';
const BASE = '/vue-router-citadel/';
const SITE_URL = `https://${HOST}${BASE}`;
const PUBLIC_DIR = 'docs/public';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const dryRun = process.argv.includes('--dry-run');

/**
 * Read the IndexNow key from docs/public/<key>.txt (filename must equal its content).
 */
const readKey = async () => {
  const entries = await readdir(PUBLIC_DIR);

  for (const name of entries) {
    if (!name.endsWith('.txt')) {
      continue;
    }

    const key = name.slice(0, -'.txt'.length);
    const content = (await readFile(join(PUBLIC_DIR, name), 'utf8')).trim();

    if (content === key) {
      return key;
    }
  }

  throw new Error(
    `No IndexNow key file found in ${PUBLIC_DIR}/ (expected <key>.txt with matching content)`,
  );
};

/**
 * Extract <loc> URLs from a sitemap XML string.
 */
const parseLocs = (xml) => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());

/**
 * Load sitemap from a local file (SITEMAP_FILE) or the live site.
 */
const loadSitemap = async () => {
  const file = process.env.SITEMAP_FILE;

  if (file) {
    return readFile(file, 'utf8');
  }

  const url = `${SITE_URL}sitemap.xml`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch sitemap ${url}: ${res.status} ${res.statusText}`);
  }

  return res.text();
};

const main = async () => {
  const key = await readKey();
  const urlList = parseLocs(await loadSitemap());

  if (urlList.length === 0) {
    throw new Error('Sitemap contained no <loc> URLs');
  }

  const payload = {
    host: HOST,
    key,
    keyLocation: `${SITE_URL}${key}.txt`,
    urlList,
  };

  console.log(`IndexNow: ${urlList.length} URLs, key ${key}`);

  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));

    return;
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  /**
   * 200 = accepted, 202 = received/validation pending. Both are success.
   */
  if (res.status === 200 || res.status === 202) {
    console.log(`IndexNow: submitted (${res.status})`);

    return;
  }

  const body = await res.text().catch(() => '');

  throw new Error(`IndexNow submission failed: ${res.status} ${res.statusText} ${body}`.trim());
};

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

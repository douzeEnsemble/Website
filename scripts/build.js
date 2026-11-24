import { appVersion } from '../.github/scripts/app-version.mjs';
import { PAGES, buildSite } from './build-site.js';
import { lastModified } from './lastmod.js';

const projects = await buildSite({
  root: process.cwd(),
  out: process.env.SITE_OUT ?? '_site',
  fetchFn: fetch,
  token: process.env.GITHUB_TOKEN,
  version: appVersion(),
  env: process.env,
  dates: Object.fromEntries(
    PAGES.map((file) => [file, lastModified(file)]),
  ),
});
console.log(`${projects.length} réalisations générées`);

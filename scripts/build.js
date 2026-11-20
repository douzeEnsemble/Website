import { appVersion } from '../.github/scripts/app-version.mjs';
import { buildSite } from './build-site.js';

const projects = await buildSite({
  root: process.cwd(),
  out: process.env.SITE_OUT ?? '_site',
  fetchFn: fetch,
  token: process.env.GITHUB_TOKEN,
  version: appVersion(),
  env: process.env,
});
console.log(`${projects.length} réalisations générées`);

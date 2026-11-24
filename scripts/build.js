import { appVersion } from '../.github/scripts/app-version.mjs';
import { PAGES, buildSite } from './build-site.js';
import { lastModified } from './lastmod.js';

await buildSite({
  root: process.cwd(),
  out: process.env.SITE_OUT ?? '_site',
  version: appVersion(),
  env: process.env,
  dates: Object.fromEntries(
    PAGES.map((file) => [file, lastModified(file)]),
  ),
});

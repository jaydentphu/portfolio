// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  site: 'https://jaydenphu.dev',
  integrations: [sitemap()],
  markdown: {
    // Any external (http/https) link written inline in a case study's
    // Markdown body opens in a new tab, same as every other outbound link
    // on the site. Internal links (/projects/..., #anchors) are relative,
    // so this plugin leaves them alone — the case-study overlay still
    // intercepts those normally.
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },
});

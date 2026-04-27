import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-mermaid-viewer';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json') as { version: string };

const HOSTNAME = 'https://kassaila.github.io';
const BASE = '/vue-router-citadel/';
const SITE_URL = `${HOSTNAME}${BASE}`;
const REPO_URL = 'https://github.com/Kassaila/vue-router-citadel';
const CHANGELOG_URL = `${REPO_URL}/blob/main/CHANGELOG.md`;
const OG_IMAGE_URL = `${SITE_URL}og_image.png`;
const OG_IMAGE_ALT = 'Vue Router Citadel — Structured navigation defense for Vue Router';
const MARKETING_DESCRIPTION =
  'Vue Router Citadel is a middleware-driven navigation control system for Vue Router that lets you build layered, predictable, and scalable route protection.';

const LLMS_INTRO =
  'Vue Router Citadel is a small (~4 KB brotli) layer on top of Vue Router 4 & 5 that turns navigation guards into prioritized, scoped, return-based middleware. Each link below has a clean Markdown version optimized for LLM consumption.';

const ROBOTS_TXT = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}sitemap.xml
`;

const LLMS_SECTION_ORDER = ['/guide/', '/api/', '/advanced/', '/examples/'] as const;
const LLMS_OPTIONAL_SECTION = '/contributing/';
const LLMS_OPTIONAL_EXTRAS: ReadonlyArray<LlmsExtraLink> = [
  {
    text: 'Changelog',
    link: CHANGELOG_URL,
    description: 'Version history.',
  },
];

interface SidebarItem {
  text: string;
  link: string;
}

interface SidebarGroup {
  text: string;
  items: ReadonlyArray<SidebarItem>;
}

interface LlmsExtraLink {
  text: string;
  link: string;
  description: string;
}

type SidebarConfig = Record<string, ReadonlyArray<SidebarGroup>>;

const pageDescriptionMap = new Map<string, string>();

const toRelativePath = (link: string): string => {
  const trimmed = link.replace(/^\//, '');

  return trimmed === '' || trimmed.endsWith('/') ? `${trimmed}index.md` : `${trimmed}.md`;
};

const toMarkdownUrl = (link: string): string => {
  if (/^https?:/.test(link)) {
    return link;
  }

  return `${SITE_URL}${toRelativePath(link)}`;
};

/**
 * Strip emojis from heading text before generating anchor slugs
 */
const slugify = (str: string): string =>
  str
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
    .normalize('NFKD')
    .trim()
    .toLowerCase()
    .replace(/[`()]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export default withMermaid(
  defineConfig({
    title: 'Vue Router Citadel',
    description: 'Structured navigation defense for Vue Router',
    base: BASE,
    cleanUrls: true,
    lastUpdated: true,

    sitemap: {
      hostname: SITE_URL,
    },

    srcExclude: ['plan.md', 'release.md', '_snippets/**'],

    markdown: {
      anchor: { slugify },
    },

    transformPageData(pageData) {
      const markdownUrl = `${SITE_URL}${pageData.relativePath}`;
      const canonicalUrl = markdownUrl.replace(/index\.md$/, '').replace(/\.md$/, '');

      const { description } = pageData.frontmatter;

      if (typeof description === 'string' && description.length > 0) {
        pageDescriptionMap.set(pageData.relativePath, description);
      }

      pageData.frontmatter.head ??= [];

      pageData.frontmatter.head.push(
        ['link', { rel: 'canonical', href: canonicalUrl }],
        ['meta', { property: 'og:url', content: canonicalUrl }],
        [
          'link',
          {
            rel: 'alternate',
            type: 'text/markdown',
            title: 'Markdown version',
            href: markdownUrl,
          },
        ],
      );
    },

    async buildEnd(siteConfig) {
      await Promise.all(
        siteConfig.pages.map(async (pagePath) => {
          const src = join(siteConfig.srcDir, pagePath);
          const dest = join(siteConfig.outDir, pagePath);

          await mkdir(dirname(dest), { recursive: true });
          await copyFile(src, dest);
        }),
      );

      const sidebar = siteConfig.site.themeConfig.sidebar as SidebarConfig;

      const renderItem = (item: SidebarItem, fallbackDescription?: string): string => {
        const description =
          pageDescriptionMap.get(toRelativePath(item.link)) ?? fallbackDescription ?? '';
        const suffix = description.length > 0 ? `: ${description}` : '';

        return `- [${item.text}](${toMarkdownUrl(item.link)})${suffix}`;
      };

      const lines: string[] = [
        `# ${siteConfig.site.title}`,
        '',
        `> ${siteConfig.site.description}`,
        '',
        LLMS_INTRO,
        '',
      ];

      for (const sectionPath of LLMS_SECTION_ORDER) {
        for (const group of sidebar[sectionPath] ?? []) {
          lines.push(`## ${group.text}`, '');

          for (const item of group.items) {
            lines.push(renderItem(item));
          }

          lines.push('');
        }
      }

      lines.push('## Optional', '');

      for (const group of sidebar[LLMS_OPTIONAL_SECTION] ?? []) {
        for (const item of group.items) {
          lines.push(renderItem(item));
        }
      }

      for (const extra of LLMS_OPTIONAL_EXTRAS) {
        lines.push(renderItem({ text: extra.text, link: extra.link }, extra.description));
      }

      lines.push('');

      await writeFile(join(siteConfig.outDir, 'llms.txt'), lines.join('\n'), 'utf8');
      await writeFile(join(siteConfig.outDir, 'robots.txt'), ROBOTS_TXT, 'utf8');
    },

    head: [
      [
        'link',
        { rel: 'icon', type: 'image/png', href: `${BASE}favicon-96x96.png`, sizes: '96x96' },
      ],
      ['link', { rel: 'icon', type: 'image/svg+xml', href: `${BASE}favicon.svg` }],
      ['link', { rel: 'shortcut icon', href: `${BASE}favicon.ico` }],
      ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: `${BASE}apple-touch-icon.png` }],
      ['meta', { name: 'apple-mobile-web-app-title', content: 'Vue Router Citadel' }],
      ['link', { rel: 'manifest', href: `${BASE}site.webmanifest` }],
      ['meta', { name: 'robots', content: 'index, follow' }],
      [
        'meta',
        {
          name: 'google-site-verification',
          content: 'jkEm04n1UJ6WDYKHuB-fx5U0vI9vLahOv3m7bi1zzF8',
        },
      ],
      ['meta', { name: 'author', content: 'Kassaila' }],
      [
        'meta',
        {
          name: 'keywords',
          content:
            'vue, vue-router, middleware, navigation guard, route guard, typescript, vue3, vue plugin, RBAC, authorization',
        },
      ],
      ['meta', { name: 'theme-color', content: '#10b981' }],
      ['link', { rel: 'dns-prefetch', href: 'https://github.com' }],
      ['link', { rel: 'dns-prefetch', href: 'https://gc.zgo.at' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:title', content: 'Vue Router Citadel' }],
      ['meta', { property: 'og:description', content: MARKETING_DESCRIPTION }],
      ['meta', { property: 'og:site_name', content: 'Vue Router Citadel' }],
      ['meta', { property: 'og:locale', content: 'en_US' }],
      ['meta', { property: 'og:image', content: OG_IMAGE_URL }],
      ['meta', { property: 'og:image:width', content: '1200' }],
      ['meta', { property: 'og:image:height', content: '630' }],
      ['meta', { property: 'og:image:type', content: 'image/png' }],
      ['meta', { property: 'og:image:alt', content: OG_IMAGE_ALT }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title', content: 'Vue Router Citadel' }],
      ['meta', { name: 'twitter:description', content: MARKETING_DESCRIPTION }],
      ['meta', { name: 'twitter:image', content: OG_IMAGE_URL }],
      ['meta', { name: 'twitter:image:alt', content: OG_IMAGE_ALT }],
      [
        'script',
        { type: 'application/ld+json' },
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareSourceCode',
          'name': 'vue-router-citadel',
          'description': 'Structured navigation defense for Vue Router',
          'codeRepository': REPO_URL,
          'programmingLanguage': 'TypeScript',
          'runtimePlatform': 'Node.js',
          'license': 'https://opensource.org/licenses/MIT',
          'downloadUrl': 'https://www.npmjs.com/package/vue-router-citadel',
          'softwareVersion': pkg.version,
          'author': {
            '@type': 'Person',
            'name': 'Kassaila',
          },
        }),
      ],
      [
        'script',
        {
          'data-goatcounter': 'https://kassaila.goatcounter.com/count',
          'src': '//gc.zgo.at/count.js',
          'async': '',
        },
      ],
    ],

    themeConfig: {
      siteUrl: SITE_URL,
      logo: { src: '/logo.svg', alt: 'Vue Router Citadel' },

      nav: [
        { text: 'Guide', link: '/guide/' },
        { text: 'API', link: '/api/' },
        { text: 'Advanced', link: '/advanced/architecture' },
        { text: 'Examples', link: '/examples/auth' },
        { text: 'Contributing', link: '/contributing/' },
        {
          text: 'Changelog',
          link: CHANGELOG_URL,
        },
      ],

      sidebar: {
        '/guide/': [
          {
            text: 'Introduction',
            items: [
              { text: 'What is Citadel?', link: '/guide/' },
              { text: 'Getting Started', link: '/guide/getting-started' },
              { text: 'Comparison', link: '/guide/comparison' },
            ],
          },
          {
            text: 'Core Concepts',
            items: [
              { text: 'Outpost Verdicts', link: '/guide/verdicts' },
              { text: 'Navigation Hooks', link: '/guide/hooks' },
              { text: 'Outpost Scopes', link: '/guide/scopes' },
              { text: 'Error Handling', link: '/guide/error-handling' },
            ],
          },
          {
            text: 'Features',
            items: [
              { text: 'Dynamic Management', link: '/guide/dynamic-management' },
              { text: 'Outpost Timeout', link: '/guide/timeout' },
              { text: 'Lazy Outposts', link: '/guide/lazy-outposts' },
              { text: 'Type-Safe Outpost Names', link: '/guide/type-safety' },
              { text: 'Vue DevTools', link: '/guide/devtools' },
            ],
          },
        ],
        '/api/': [
          {
            text: 'API Reference',
            items: [
              { text: 'Methods', link: '/api/' },
              { text: 'Types', link: '/api/types' },
              { text: 'Exports', link: '/api/exports' },
            ],
          },
        ],
        '/advanced/': [
          {
            text: 'Advanced',
            items: [
              { text: 'Architecture', link: '/advanced/architecture' },
              { text: 'Modular Apps', link: '/advanced/modular-apps' },
              { text: 'Logging & Debug', link: '/advanced/logging' },
              { text: 'DevTools Internals', link: '/advanced/devtools' },
            ],
          },
        ],
        '/examples/': [
          {
            text: 'Examples',
            items: [
              { text: 'Auth Guard', link: '/examples/auth' },
              { text: 'Nested Routes', link: '/examples/nested-routes' },
              { text: 'Multi-Hook Outpost', link: '/examples/multiple-hooks' },
              { text: 'Outposts Across Hooks', link: '/examples/different-hooks' },
              { text: 'Production Patterns', link: '/examples/production-patterns' },
            ],
          },
        ],
        '/contributing/': [
          {
            text: 'Contributing',
            items: [
              { text: 'Guide', link: '/contributing/' },
              { text: 'Testing', link: '/contributing/testing' },
              { text: 'Test Cases', link: '/contributing/test-cases' },
            ],
          },
        ],
      },

      socialLinks: [{ icon: 'github', link: REPO_URL }],

      search: {
        provider: 'local',
      },

      footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright © Kassaila',
      },
    },
  }),
);

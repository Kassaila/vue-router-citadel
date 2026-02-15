import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

/** Strip emojis from heading text before generating anchor slugs */
function slugify(str: string): string {
  return str
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
    .normalize('NFKD')
    .trim()
    .toLowerCase()
    .replace(/[`()]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default withMermaid(
  defineConfig({
    title: 'Vue Router Citadel',
    description: 'Structured navigation defense for Vue Router',
    base: '/vue-router-citadel/',

    srcExclude: ['plan.md', 'release.md', '_snippets/**'],

    markdown: {
      anchor: { slugify },
    },

    head: [
      ['link', { rel: 'icon', type: 'image/svg+xml', href: '/vue-router-citadel/logo.svg' }],
      ['meta', { name: 'author', content: 'Kassaila' }],
      [
        'meta',
        {
          name: 'keywords',
          content:
            'vue, vue-router, middleware, navigation guard, route guard, typescript, vue3, vue plugin, RBAC, authorization',
        },
      ],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:title', content: 'Vue Router Citadel' }],
      [
        'meta',
        {
          property: 'og:description',
          content:
            'Vue Router Citadel is a middleware-driven navigation control system for Vue Router that lets you build layered, predictable, and scalable route protection.',
        },
      ],
      ['meta', { property: 'og:url', content: 'https://kassaila.github.io/vue-router-citadel/' }],
      ['meta', { property: 'og:site_name', content: 'Vue Router Citadel' }],
      ['meta', { property: 'og:locale', content: 'en_US' }],
      ['meta', { name: 'twitter:card', content: 'summary' }],
      ['meta', { name: 'twitter:title', content: 'Vue Router Citadel' }],
      [
        'meta',
        {
          name: 'twitter:description',
          content:
            'Vue Router Citadel is a middleware-driven navigation control system for Vue Router that lets you build layered, predictable, and scalable route protection.',
        },
      ],
    ],

    themeConfig: {
      logo: '/logo.svg',

      nav: [
        { text: 'Guide', link: '/guide/' },
        { text: 'API', link: '/api/' },
        { text: 'Advanced', link: '/advanced/architecture' },
        { text: 'Examples', link: '/examples/auth' },
        { text: 'Contributing', link: '/contributing/' },
        {
          text: 'Changelog',
          link: 'https://github.com/Kassaila/vue-router-citadel/blob/main/CHANGELOG.md',
        },
      ],

      sidebar: {
        '/guide/': [
          {
            text: 'Introduction',
            items: [
              { text: 'What is Citadel?', link: '/guide/' },
              { text: 'Getting Started', link: '/guide/getting-started' },
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

      socialLinks: [{ icon: 'github', link: 'https://github.com/Kassaila/vue-router-citadel' }],

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

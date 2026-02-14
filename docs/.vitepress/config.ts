import { content } from 'happy-dom/lib/PropertySymbol';
import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

export default withMermaid(
  defineConfig({
    title: 'Vue Router Citadel',
    description: 'Structured navigation defense for Vue Router',
    base: '/vue-router-citadel/',

    srcExclude: [
      'plan.md',
      'internals.md',
      'testing.md',
      'type-safe-names-advanced.md',
      'release.md',
    ],

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
              { text: 'Outpost Scopes', link: '/guide/scopes' },
              { text: 'Navigation Hooks', link: '/guide/hooks' },
              { text: 'Outpost Verdicts', link: '/guide/verdicts' },
            ],
          },
          {
            text: 'Features',
            items: [
              { text: 'Outpost Timeout', link: '/guide/timeout' },
              { text: 'Lazy Outposts', link: '/guide/lazy-outposts' },
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
              { text: 'Type-Safe Outpost Names', link: '/advanced/type-safety' },
              { text: 'Modular Apps', link: '/advanced/modular-apps' },
              { text: 'Logging & Debug', link: '/advanced/logging' },
            ],
          },
        ],
        '/examples/': [
          {
            text: 'Examples',
            items: [
              { text: 'Auth Guard', link: '/examples/auth' },
              { text: 'Nested Routes', link: '/examples/nested-routes' },
              { text: 'Multiple Hooks', link: '/examples/multiple-hooks' },
              { text: 'Different Hooks', link: '/examples/different-hooks' },
            ],
          },
        ],
        '/contributing/': [
          {
            text: 'Contributing',
            items: [
              { text: 'Guide', link: '/contributing/' },
              { text: 'Testing', link: '/contributing/testing' },
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

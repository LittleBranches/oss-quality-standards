import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'OSS Quality Standards',
  tagline: 'Model-agnostic reviewer instructions for every LittleBranches repository',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://littlebranches.github.io',
  baseUrl: '/oss-quality-standards/',

  organizationName: 'LittleBranches',
  projectName: 'oss-quality-standards',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/LittleBranches/oss-quality-standards/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'OSS Quality Standards',
      logo: {
        alt: 'LittleBranches Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'standardsSidebar',
          position: 'left',
          label: 'Standards',
        },
        {
          href: 'https://github.com/LittleBranches/oss-quality-standards',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Standards',
          items: [
            { label: 'Overview', to: '/docs/intro' },
            { label: 'PR Review Workflow', to: '/docs/pr-review-workflow' },
            { label: 'Definition of Done', to: '/docs/definition-of-done' },
            { label: 'AI Collaboration Protocol', to: '/docs/ai-collaboration-protocol' },
          ],
        },
        {
          title: 'Repos',
          items: [
            {
              label: 'giselle-mui',
              href: 'https://github.com/LittleBranches/giselle-mui',
            },
            {
              label: 'oss-quality-standards',
              href: 'https://github.com/LittleBranches/oss-quality-standards',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Alex Rebula · LittleBranches · MIT License`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

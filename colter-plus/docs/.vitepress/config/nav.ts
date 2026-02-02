// docs/.vitepress/config/nav.ts
import { DefaultTheme } from 'vitepress';
import { REPO_URL } from './seo';

export const nav: DefaultTheme.NavItem[] = [
  { text: 'Blog', link: '/blog/' },
  { text: 'Projects', link: '/projects/' },
  {
    text: 'Guides',
    items: [
      { text: 'All Guides', link: '/guides/' },
      { text: 'Beginners', link: '/guides/?difficulty=beginner' },
      { text: 'Advanced', link: '/guides/?difficulty=advanced' }
    ]
  },
  { text: 'Status', link: '/status' },
  { text: 'Changelog', link: `${REPO_URL}/releases` },
];

export const sidebar: DefaultTheme.Sidebar = {
  '/projects/': [{ text: 'Projects', link: '/projects/', items: [] }],
  '/blog/': [{ text: 'Blog', link: '/blog/', items: [] }],
  '/guides/': [{ text: 'Guides', link: '/guides/', items: [] }]
};
export default {
  title: 'Colter+',
  description: 'My Digital Universe - Curated',
  
  // Site-level options
  lang: 'en-US',
  lastUpdated: true,
  cleanUrls: true,
  
  // Build options
  srcDir: '.',
  outDir: './.vitepress/dist',
  cacheDir: './.vitepress/cache',
  
  // Markdown options
  markdown: {
    theme: 'github-dark',
    lineNumbers: true,
    headers: {
      level: [2, 3, 4]
    }
  },
  
  // Head tags
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#409EFF' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
    ['meta', { name: 'msapplication-TileColor', content: '#409EFF' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
  ],
  
  // Theme configuration
  themeConfig: {
    // Logo and site title
    logo: '/logo.svg',
    siteTitle: 'Colter+',
    
    // Navigation
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Projects', link: '/projects/' },
      { text: 'Blog', link: '/blog/' },
      { text: 'Status', link: '/status' }
    ],
    
    // Sidebar
    sidebar: {
      '/projects/': [
        {
          text: 'Projects',
          items: [
            { text: 'All Projects', link: '/projects/' }
          ]
        }
      ],
      '/blog/': [
        {
          text: 'Blog',
          items: [
            { text: 'All Posts', link: '/blog/' }
          ]
        }
      ]
    },
    
    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ColterD' },
      { icon: 'twitter', link: 'https://twitter.com/colter' }
    ],
    
    // Footer
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2023-present Colter+'
    },
    
    // Search
    search: {
      provider: 'local'
    },
    
    // Last updated text
    lastUpdatedText: 'Last Updated'
  }
}
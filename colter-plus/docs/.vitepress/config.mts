// docs/.vitepress/config.mts
import { defineConfig } from 'vitepress';
import { execSync } from 'child_process';
import UnoCSS from 'unocss/vite';
import AutoImport from 'unplugin-auto-import/vite';
// Temporarily disable PWA
// import { withPwa } from '@vite-pwa/vitepress';
import nprogress from 'vitepress-plugin-nprogress';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

// Local imports
import unocssConfig from './unocss.config.js';
import { securityHeaders } from './config/security';
import { generateSeoTags, seoConfig } from './config/seo';
import { nav, sidebar } from './config/nav';
// Temporarily disable PWA for build testing
// import { pwaConfig } from './config/pwa';

// Helper functions
const getGitRevision = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
};

const baseConfig = defineConfig({
  // Site metadata
  lang: 'en-US',
  title: 'C+',
  description: seoConfig.description,
  titleTemplate: ':title • Colter+',
  appearance: 'force-dark',
  lastUpdated: true,
  
  // Content configuration
  srcDir: './content',
  cleanUrls: true,
  ignoreDeadLinks: 'localhostLinks',
  
  // Head metadata with manually added structured data
  head: [
    ...generateSeoTags(),
    ...securityHeaders
  ],
  
  // Markdown configuration
  markdown: {
    theme: 'github-dark',
    lineNumbers: true,
    anchor: {
      permalink: true,
    },
    toc: { level: [2, 3] },
    config: (md) => {
      // Add custom markdown extensions here
    }
  },
  
  // Theme configuration
  themeConfig: {
    // Navigation
    nav,
    sidebar,
    
    // Search
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, tags: 1 },
          },
        },
      },
    },
    
    // UI elements
    editLink: {
      pattern: `${seoConfig.siteUrl}/edit/main/docs/:path`,
      text: '📝 Edit this page',
    },
    outline: 'deep',
    logo: '/logo.png',
    socialLinks: [
      { icon: 'github', link: seoConfig.siteUrl },
      { icon: 'discord', link: 'https://discord.gg/colterplus' },
      { icon: 'twitter', link: seoConfig.twitterCreator },
    ],
    footer: {
      message: `Built with VitePress • Last updated: ${new Date().toLocaleDateString()}`,
      copyright: `Copyright © ${new Date().getFullYear()} Colter+`
    },
    lastUpdated: {
      text: 'Updated at',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    },
  },
  
  // Vite configuration
  vite: {
    // Plugins
    plugins: [
      UnoCSS(unocssConfig),
      AutoImport({
        imports: ['vue', '@vueuse/core'],
        dts: 'docs/.vitepress/auto-imports.d.ts',
        dirs: ['docs/.vitepress/theme/composables'],
        vueTemplate: true,
      }),
      nprogress(),
      ViteImageOptimizer({
        png: {
          quality: 80,
        },
        jpeg: {
          quality: 80,
        },
        jpg: {
          quality: 80,
        },
        webp: {
          lossless: true,
        },
      }),
    ],
    
    // SSR options
    ssr: {
      noExternal: ['nprogress']
    },
    
    // File resolution
    resolve: {
      alias: {
        '@': '/docs',
        '@theme': '/docs/.vitepress/theme',
        '@components': '/docs/.vitepress/theme/components',
        '@composables': '/docs/.vitepress/theme/composables',
        '@utils': '/docs/.vitepress/theme/utils',
        '@styles': '/docs/.vitepress/theme/styles',
        '@config': '/docs/.vitepress/config',
      }
    },
    
    // Build options
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue'],
            vueuse: ['@vueuse/core'],
          }
        }
      }
    }
  },
  
  // PWA configuration temporarily disabled
  // pwa: pwaConfig
});

// Export without PWA for now
export default baseConfig;
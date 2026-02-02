import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';

// Import global styles
import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/blog.css';
import './styles/projects.css';

// Import components
import OptimizedImage from './components/OptimizedImage.vue';
import StatusPage from './components/StatusPage.vue';
import HomeStatus from './components/HomeStatus.vue';

export default {
  extends: DefaultTheme,
  
  // Override the default layout to add custom elements
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // Add a skip to content link for accessibility
      'nav-bar-title-before': () => h('a', { 
        href: '#main-content',
        class: 'skip-to-content'
      }, 'Skip to content'),
      
      // Add an ID to the main content for the skip link
      'layout-top': () => h('div', { 
        id: 'main-content',
        tabindex: -1
      }),
    });
  },
  
  // Register global components
  enhanceApp({ app }) {
    app.component('OptimizedImage', OptimizedImage);
    app.component('StatusPage', StatusPage);
    app.component('HomeStatus', HomeStatus);
  }
};
// docs/.vitepress/unocss.config.js
import { defineConfig } from 'unocss';
import { presetUno, presetTypography, presetWebFonts, presetIcons } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetTypography(),
    presetWebFonts({
      fonts: {
        sans: 'Inter:400,500,600,700',
        mono: 'JetBrains Mono:400,500',
      },
    }),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  theme: {
    colors: {
      swarm: {
        '950': 'rgb(7, 13, 24)',
        '800': 'rgb(26, 44, 77)',
        '600': 'rgb(55, 90, 155)',
        '400': 'rgb(120, 160, 230)',
        '200': 'rgb(188, 213, 255)',
      },
      meadow: {
        '950': 'rgb(5, 24, 12)',
        '800': 'rgb(25, 77, 51)',
        '600': 'rgb(52, 140, 90)',
        '400': 'rgb(100, 200, 150)',
        '200': 'rgb(152, 245, 200)',
      },
      merlin: {
        '950': 'rgb(24, 18, 5)',
        '800': 'rgb(77, 58, 25)',
        '600': 'rgb(140, 105, 52)',
        '400': 'rgb(200, 160, 100)',
        '200': 'rgb(245, 211, 152)',
      },
      carnation: {
        '950': 'rgb(24, 5, 9)',
        '800': 'rgb(77, 25, 34)',
        '600': 'rgb(140, 52, 70)',
        '400': 'rgb(200, 100, 120)',
        '200': 'rgb(245, 152, 170)',
      },
    },
    breakpoints: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
  shortcuts: {
    // Buttons
    'btn': 'px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent',
    'btn-primary': 'btn bg-swarm-600 text-white hover:bg-swarm-800 focus:ring-swarm-400',
    'btn-secondary': 'btn bg-meadow-600 text-white hover:bg-meadow-800 focus:ring-meadow-400',
    'btn-outline': 'btn border border-swarm-600 text-swarm-200 hover:bg-swarm-800 hover:border-transparent focus:ring-swarm-400',
    'btn-ghost': 'btn text-swarm-200 hover:bg-swarm-800/50 focus:ring-swarm-400',
    
    // Cards
    'card': 'p-4 rounded-lg bg-swarm-950 shadow-md border border-swarm-800/50',
    'card-hover': 'card hover:shadow-lg hover:border-swarm-600/50 transition-all duration-200',
    'card-interactive': 'card-hover cursor-pointer transform hover:-translate-y-1',
    
    // Form elements
    'input': 'p-2 rounded-md border border-swarm-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-meadow-600 w-full',
    'select': 'input appearance-none bg-swarm-950 pr-8',
    'checkbox': 'w-4 h-4 rounded border-swarm-800 text-meadow-600 focus:ring-meadow-600 focus:ring-offset-swarm-950',
    
    // Layout
    'container-sm': 'max-w-screen-sm mx-auto px-4',
    'container-md': 'max-w-screen-md mx-auto px-4',
    'container-lg': 'max-w-screen-lg mx-auto px-4',
    'container-xl': 'max-w-screen-xl mx-auto px-4',
    
    // Flexbox utilities
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    
    // Typography
    'heading-1': 'text-3xl md:text-4xl font-bold',
    'heading-2': 'text-2xl md:text-3xl font-bold',
    'heading-3': 'text-xl md:text-2xl font-bold',
    'text-body': 'text-base leading-relaxed',
    'text-small': 'text-sm leading-relaxed',
    
    // Status indicators
    'status-dot': 'w-2 h-2 rounded-full inline-block mr-2',
    'status-operational': 'status-dot bg-meadow-600',
    'status-degraded': 'status-dot bg-merlin-600',
    'status-down': 'status-dot bg-carnation-600',
  },
  safelist: [
    'status-operational',
    'status-degraded',
    'status-down',
    'btn-primary',
    'btn-secondary',
    'btn-outline',
    'btn-ghost',
  ],
});
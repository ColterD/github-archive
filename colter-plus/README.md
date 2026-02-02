# Colter+

![CI/CD](https://github.com/ColterD/ColterPlus/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/github/license/ColterD/ColterPlus)
![Last Commit](https://img.shields.io/github/last-commit/ColterD/ColterPlus)

My Digital Universe - Curated. Projects, blogs, and guides by Colter.

## 🚀 Features

- **Blog**: Share thoughts, tutorials, and deep dives into technology
- **Projects**: Showcase technical projects and works in progress
- **Guides**: Step-by-step tutorials and reference materials
- **Status**: Real-time status monitoring of services
- **PWA Support**: Install as a Progressive Web App
- **Dark Mode**: Optimized for dark mode viewing
- **Responsive Design**: Works on all devices

## 🛠️ Tech Stack

- [VitePress](https://vitepress.dev/) - Static Site Generator
- [Vue 3](https://vuejs.org/) - Frontend Framework
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
- [UnoCSS](https://unocss.dev/) - Atomic CSS Engine
- [Vite](https://vitejs.dev/) - Build Tool
- [Vitest](https://vitest.dev/) - Testing Framework
- [Cloudflare Pages](https://pages.cloudflare.com/) - Hosting

## 📦 Project Structure

```
docs/
├── .vitepress/         # VitePress configuration
│   ├── config/         # Configuration modules
│   ├── theme/          # Custom theme
│   │   ├── components/ # Vue components
│   │   ├── composables/ # Vue composables
│   │   ├── styles/     # CSS styles
│   │   └── utils/      # Utility functions
│   └── public/         # Static assets
├── content/            # Content files
│   ├── blog/           # Blog posts
│   ├── projects/       # Project showcases
│   └── guides/         # Guides and tutorials
└── tests/              # Test files
    ├── unit/           # Unit tests
    ├── integration/    # Integration tests
    └── e2e/            # End-to-end tests
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v10 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/ColterD/ColterPlus.git
cd ColterPlus

# Install dependencies
pnpm install

# Start the development server
pnpm docs:dev
```

The site will be available at http://localhost:12000.

### Build

```bash
# Build for production
pnpm docs:build

# Preview the production build
pnpm docs:preview
```

### Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run end-to-end tests
pnpm test:e2e
```

## 🧪 Development

### Linting and Formatting

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm typecheck
```

### Adding Content

#### Blog Posts

Create a new markdown file in `docs/content/blog/` with the following frontmatter:

```markdown
---
title: My Blog Post
date: 2025-05-01
description: A short description of the blog post
tags: [tag1, tag2]
author: Colter
---

Content goes here...
```

#### Projects

Create a new markdown file in `docs/content/projects/` with the following frontmatter:

```markdown
---
title: My Project
description: A short description of the project
date: 2025-05-01
status: completed # or in-progress, planned
tags: [tag1, tag2]
---

Content goes here...
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [VitePress](https://vitepress.dev/) for the amazing static site generator
- [Vue.js](https://vuejs.org/) for the frontend framework
- [UnoCSS](https://unocss.dev/) for the utility-first CSS framework
- [Cloudflare Pages](https://pages.cloudflare.com/) for hosting
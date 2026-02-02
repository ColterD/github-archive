# Homelab Builder

A PCPartPicker-like platform for discovering, comparing, and purchasing used enterprise hardware. Find the best deals on servers, storage, and networking equipment for your homelab or business.

## 🏗️ Platform Overview

Homelab Builder provides:

- **Hardware Catalog**: Comprehensive database of enterprise servers, storage, and networking equipment
- **Price Comparison**: Real-time pricing from multiple vendors and marketplaces
- **Build Creator**: Design and share custom hardware configurations
- **Community**: User reviews, build guides, and hardware discussions
- **Deal Tracking**: Price alerts and historical pricing data
- **Vendor Integration**: Direct purchasing links and affiliate partnerships

## 📋 Prerequisites

### Development Requirements

- **Node.js**: 20+ (LTS recommended)
- **Package Manager**: pnpm 9+ (preferred) or npm
- **Database**: PostgreSQL 15+ (Railway provides this)
- **Git**: For version control

### Production Deployment

- **Railway Account**: For hosting and database
- **GitHub/Google OAuth**: For user authentication
- **External APIs**: eBay, vendor integrations (optional)

## ✨ Features

### 🔧 Core Features

- **Hardware Catalog**: Comprehensive database of enterprise servers, storage, and networking
- **Smart Search**: AI-powered search with typo tolerance and semantic matching
- **Price Tracking**: Historical pricing data with deal alerts
- **Build Sharing**: Community-driven hardware configurations
- **Real-time Data**: Live metrics and WebSocket updates

### 🎨 Modern Experience

- **Responsive Design**: Mobile-first with desktop enhancements
- **Dark/Light Themes**: Auto-detection with manual override
- **Professional UI**: shadcn-svelte components with custom variants
- **Accessibility**: WCAG 2.1 AA compliance

### 🔒 Enterprise Security

- **OAuth Authentication**: GitHub/Google integration with role-based access
- **Admin Dashboard**: Real-time metrics and content moderation
- **Security Headers**: OWASP Top 10 compliance
- **Rate Limiting**: Smart protection against abuse

## 🚀 Quick Start

### Local Development

```bash
# Clone and install
git clone <your-repo-url>
cd homelab-builder
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Initialize database
pnpm run db:generate
pnpm run db:push
pnpm run db:seed

# Start development server
pnpm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

### Railway Deployment

1. **Connect Repository**: Link your GitHub repo to Railway
2. **Add PostgreSQL**: Add PostgreSQL service to your Railway project
3. **Configure Environment**: Set required environment variables
4. **Deploy**: Railway will automatically build and deploy

See [Railway Deployment Guide](docs/setup/railway-deployment.md) for detailed instructions.

## 📚 Documentation

### Setup Guides

- [Environment Setup Guide](docs/setup/environment-setup.md) - Detailed token and service configuration
- [Complete Setup Checklist](docs/setup/complete-checklist.md) - Production deployment guide
- [Railway Deployment](docs/setup/railway-deployment.md) - Hosting and optimization

### Development

- [Project Structure](docs/development/project-structure.md) - Codebase organization
- [Workflow Guide](docs/development/workflow-guide.md) - Development processes
- [API Documentation](docs/development/api-docs.md) - Endpoint specifications

### Specifications

- [UI Design System](docs/specifications/ui-design.md) - Component library and theming
- [Security Compliance](docs/specifications/security.md) - Security standards and practices
- [Database Schema](docs/specifications/database-schema.md) - Data models and relationships

## 🛠️ Tech Stack

**Frontend**

- **Framework**: SvelteKit 2.x with TypeScript
- **Styling**: Tailwind CSS + shadcn-svelte
- **Icons**: Lucide icons
- **Build**: Vite 7.x

**Backend**

- **Runtime**: Node.js 20+
- **Database**: PostgreSQL + Prisma ORM
- **Search**: Meilisearch for full-text search
- **Cache**: Redis for sessions and performance
- **Auth**: Auth.js with GitHub/Google OAuth

**Infrastructure**

- **Hosting**: Railway (app + database)
- **CDN**: Cloudflare for global performance
- **Monitoring**: Sentry + OpenTelemetry
- **Email**: Resend for transactional emails

## 📊 Project Status

Current milestone: **FOUNDATION_COMPLETE** ✅

**Completed:**

- ✅ SvelteKit + TypeScript setup
- ✅ Modern UI system with themes
- ✅ Database schema design
- ✅ Authentication foundation
- ✅ Admin dashboard structure
- ✅ Railway deployment ready

**In Progress:**

- 🔄 Hardware catalog implementation
- 🔄 Search functionality
- 🔄 User management system

**Planned:**

- ⏳ Community features (builds, reviews)
- ⏳ Price tracking and alerts
- ⏳ Advanced analytics
- ⏳ API access for developers

## 🎯 Business Model

**Revenue Streams:**

- **Affiliate Commissions**: Earn from hardware sales through partner vendors
- **Premium Features**: Advanced search, price alerts, build analytics
- **Vendor Partnerships**: Featured listings and promotional placements
- **API Access**: Developer access to hardware data and pricing

**Target Metrics:**

- 1000+ active users
- 5000+ hardware listings
- 500+ community builds
- 10% premium conversion rate

## 🔗 Quick Links

- **Live Demo**: [Coming Soon]
- **Admin Dashboard**: `/admin` (requires admin role)
- **API Docs**: `/api/docs`
- **Health Check**: `/health`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

See our [development workflow guide](docs/development/workflow-guide.md) for detailed contributing instructions.

## 📈 Performance

**Targets:**

- Page loads: <2 seconds
- API responses: <500ms
- Lighthouse score: >90
- Mobile-first responsive design

**Monitoring:**

- Real-time error tracking with Sentry
- Performance monitoring with Railway metrics
- Uptime monitoring with health checks

## 🔐 Security

- OWASP Top 10 compliance
- OAuth-only authentication (no passwords)
- Role-based access control
- Input validation with Zod schemas
- Security headers with Helmet.js
- Regular vulnerability scanning

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ for hardware enthusiasts and IT professionals**

_Helping enthusiasts build better labs with smarter hardware choices_

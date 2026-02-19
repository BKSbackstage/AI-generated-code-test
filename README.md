# Backstage Global — Next Generation Event Ticketing Platform

> A Web3-powered marketplace for artists, events, and live experiences. Built with modern full-stack architecture inspired by DICE, Eventbrite, Ticketmaster, and Ra.

## Platform Overview

Backstage Global is a comprehensive event ticketing and artist marketplace platform that combines:
- **Traditional ticketing** (Stripe, Swish, MercadoPago)
- **Web3/NFT ticketing** (BNB Chain, NEAR Protocol, BKS Token)
- **Artist & Promoter tools** (event management, revenue tracking)
- **Travel integration** (flights, hotels, activities)
- **AI Assistant** for personalized recommendations
- **Rewards & Loyalty** system with BKS token

---

## Repository Structure

```
AI-generated-code-test/
├── frontend/               # React + Vite + TypeScript (User-facing app)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # All platform pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # Zustand state management
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # Helper utilities
│   └── package.json
│
├── backend/                # NestJS + TypeScript + PostgreSQL
│   ├── src/
│   │   ├── auth/           # JWT + OAuth + Web3 auth
│   │   ├── users/          # User management
│   │   ├── events/         # Event management
│   │   ├── tickets/        # Ticket generation & QR
│   │   ├── payments/       # Stripe, Swish, crypto
│   │   ├── artists/        # Artist profiles
│   │   ├── promoters/      # Promoter management
│   │   ├── notifications/  # Email, push, Telegram
│   │   ├── marketplace/    # NFT marketplace
│   │   └── admin/          # Super admin APIs
│   └── package.json
│
├── promoter-admin/         # Promoter dashboard (React + Vite)
│   └── src/
│       ├── pages/          # Event upload, sales, analytics
│       └── components/
│
├── super-admin/            # Super admin dashboard (React + Vite)
│   └── src/
│       ├── pages/          # Full platform control
│       └── components/
│
├── docker-compose.yml      # Infrastructure orchestration
├── nginx.conf              # Reverse proxy config
└── README.md
```

---

## Tech Stack

### Frontend
| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite 5 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + shadcn/ui |
| State | Zustand |
| Data Fetching | TanStack Query (React Query) |
| Routing | React Router DOM 6 |
| Auth | Privy.io + JWT |
| Web3 | Ethers.js 6 + wagmi |
| Maps | Leaflet + Mapbox |
| Charts | Recharts |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |

### Backend
| Layer | Technology |
|-------|------------|
| Framework | NestJS 10 |
| Language | TypeScript 5 |
| ORM | TypeORM + PostgreSQL |
| Cache | Redis |
| Queue | Bull (Redis-backed) |
| Auth | JWT + Passport + Privy |
| Payments | Stripe + Swish + MercadoPago |
| Storage | AWS S3 + IPFS |
| Email | Mailgun + AWS SES |
| Realtime | Socket.io |
| Docs | Swagger/OpenAPI |
| Logging | Winston + Sentry |

### Infrastructure
| Layer | Technology |
|-------|------------|
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| CDN | Cloudflare |
| Hosting | AWS EC2 / DigitalOcean |
| CI/CD | GitHub Actions |

---

## Key Features

### For Users
- Browse & discover events by genre, location, date
- NFT ticket minting (ERC721 on BSC/NEAR)
- Multi-payment: Card, Swish, BNB, NEAR, BKS token
- QR-code ticket wallet
- Trip planning (flights + hotel + activities)
- AI-powered event recommendations
- Rewards & loyalty points
- Favorites & collections

### For Artists
- Artist profile with media gallery
- Revenue analytics dashboard
- Tour date management
- Fan engagement tools
- Direct messaging with promoters

### For Promoters
- Full event creation wizard
- Multi-tier ticketing (Early Bird, VIP, General, etc.)
- Real-time sales dashboard
- QR check-in management
- Promo codes & discount management
- Attendee CRM
- Payout management

### For Super Admins
- Full platform oversight
- User & promoter management
- Revenue & commission control
- Smart contract management
- Platform configuration
- Analytics & reporting

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose

### Quick Start with Docker
```bash
git clone https://github.com/BKSbackstage/AI-generated-code-test
cd AI-generated-code-test
cp .env.example .env  # Configure your environment variables
docker-compose up -d
```

### Manual Setup

**Backend:**
```bash
cd backend
npm install
npm run migration:run
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Promoter Admin:**
```bash
cd promoter-admin
npm install
npm run dev
```

**Super Admin:**
```bash
cd super-admin
npm install
npm run dev
```

---

## Environment Variables

See `.env.example` for all required variables including:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe API key
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `MAILGUN_API_KEY` - Email service
- `PRIVY_APP_ID` / `PRIVY_APP_SECRET` - Web3 auth
- `IPFS_PROJECT_ID` / `IPFS_PROJECT_SECRET` - IPFS storage

---

## Architecture Flow

```
User → Nginx → Frontend (React) → Backend API (NestJS)
                                         ↓
                              ┌──────────┼──────────┐
                           PostgreSQL  Redis    Bull Queue
                                         ↓
                              ┌──────────┼──────────┐
                           Stripe    Mailgun    IPFS/S3
                                         ↓
                           Blockchain (BSC / NEAR)
```

---

## License

Proprietary - Backstage Global © 2026. All rights reserved.

---

*Built by BKSbackstage OU, Estonia*
*Website: backstage.global*

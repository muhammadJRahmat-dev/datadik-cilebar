# Datadik Cilebar

Portal Data Pendidikan Kecamatan Cilebar - Sistem manajemen data Dapodik terpadu dengan Next.js 16, Supabase, dan Leaflet.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

## 📁 Project Structure

```
Datadik_Cilebar/
├── app/                    # Next.js 16 App Router
│   ├── admin/kecamatan/   # Admin Kecamatan dashboard
│   ├── dashboard/          # Operator sekolah dashboard
│   ├── home/               # Landing page publik
│   ├── sites/[site]/       # Multi-tenant sekolah pages
│   ├── login/              # Authentication
│   ├── api/                # API routes
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── ui/                # Shadcn UI components
│   ├── map/               # Leaflet map component
│   ├── Navbar.tsx
│   └── Footer.tsx
├── lib/                   # Utilities
│   ├── supabase.ts        # Supabase client
│   └── utils.ts
├── types/                 # TypeScript definitions
│   └── index.ts
└── scripts/               # Utility scripts
    └── import-excel.mjs
```

## 🔐 Database Setup

Run these SQL files in Supabase SQL Editor (in order):

1. `supabase_seed.sql` - Create tables and insert sample data
2. `supabase_security.sql` - Set up RLS policies and authentication
3. `fix_rls_security.sql` - Fix security issues (latest)

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript check
npm run import:excel # Import data from Excel
```

## 🏗️ Architecture

### Multi-Tenant System
- **Root domain** (`datadikcilebar.my.id`) → Landing page dengan agregator berita semua sekolah
- **Subdomain** (`sdn1.datadikcilebar.my.id`) → Profil sekolah spesifik

### Database Schema
| Table | Description |
|-------|-------------|
| `organizations` | Sekolah, mitra, dan dinas |
| `school_data` | Data statistik sekolah dengan `stats` JSONB |
| `profiles` | User roles (admin_kecamatan, operator, visitor) |
| `posts` | Berita/pengumuman/agenda |
| `submissions` | File submissions from sekolah |
| `verification_codes` | OTP codes untuk email/whatsapp verification |
| `login_attempts` | Brute force protection |

### Role-Based Access Control
| Role | Permissions |
|------|-------------|
| `admin_kecamatan` | Full access kecamatan data, manage users, approve submissions |
| `operator` | Manage their own school data, create posts, submit files |
| `visitor` | Read-only access to public data |

## 🎨 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Maps**: React-Leaflet (Leaflet)
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📱 Features

- ✅ Interactive school map with clustering
- ✅ Real-time statistics dashboard
- ✅ Multi-school content aggregation
- ✅ Role-based authentication
- ✅ File submission system
- ✅ OTP verification (email/WhatsApp)
- ✅ Excel export functionality
- ✅ Kemendikdasmen API sync
- ✅ Responsive design (mobile-first)

## 🔒 Security

- Row-Level Security (RLS) on all tables
- Brute force protection (max 5 attempts/15 min)
- Service role key for admin operations
- Environment-based configuration
- Type-safe API routes

## 📝 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🚢 Deployment

### Vercel (Recommended)
```bash
vercel login
vercel
```

### Manual Build
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` and `npm run typecheck`
5. Submit a pull request

## 📄 License

Proprietary - Dinas Pendidikan Kecamatan Cilebar

## 📞 Support

For issues or questions, contact: admin@datadikcilebar.id

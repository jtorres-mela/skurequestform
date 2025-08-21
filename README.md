SKU Request Management System

This is a Next.js
 project for managing SKU requests at Melaleuca.
It provides tools to create, revise, and track SKU submissions, including product details, accessories, culture translations, and recommendations.

Built with:

⚡ Next.js (App Router)

🗄️ Prisma + SQLite (dev) / configurable for other DBs

🎨 Tailwind CSS

🔗 Type-safe API routes

Getting Started
1. Install dependencies
npm install

2. Set up environment

Create a .env file in the project root with your database connection string. Example for SQLite:

DATABASE_URL="file:./dev.db"

3. Generate Prisma Client
npx prisma generate

4. Run database migrations
npx prisma migrate dev

5. Start the development server
npm run dev


Visit http://localhost:3000
 in your browser.

Key Features

Dashboard: View all requests and SKUs in a streamlined table.

Request Management: Create requests, attach notes, set due dates, and assign submitters.

Product Submissions: Track revisions per SKU with version history.

Prefill Revisions: Start a new submission prefilled from an existing SKU.

Accessories, Recommendations & Cultures: Add supporting data for each SKU.

Admin View: Manage all requests centrally.

Tech Stack

Frontend: Next.js 14 (App Router), TypeScript, TailwindCSS

Backend: Next.js API routes with Prisma ORM

Database: SQLite (development) — can be swapped for PostgreSQL/MySQL in production

Development Notes

The schema is defined in prisma/schema.prisma.

Generated Prisma client is available at @/lib/prisma.

Main UI work is in src/app/, including:

request/[id]/page.tsx → ManageRequest screen

new/page.tsx → Add SKU submission form

We follow a feature branch workflow (optional) with pull requests into main.

Learn More

Next.js Documentation

Prisma Documentation

Tailwind CSS Docs
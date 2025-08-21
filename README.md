# SKU Request Management System
>
  A Next.js app for creating, revising, and tracking SKU requests at **Melaleuca**.



  ![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
  ![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwindcss&logoColor=white)


SKU Requests streamlines product submissions and revisions, including accessories, culture translations, and recommendations — with version history per SKU.



## ✨ Features

  * **Dashboard**: Scan requests and current SKUs in a streamlined table.
  * **Request Management**: Create requests, set due dates, and track notes.
  * **SKU Submissions**: Add SKUs to a request with full product metadata.
  * **Revisions &amp; Versioning**: Add revisions per SKU and preserve history.
  * **Prefill Revisions**: Start from an existing SKU to speed up edits.
  * **Accessories, Recommendations, Cultures**: First-class nested data.
  * **Admin View**: Central management for all requests (WIP as needed).




## 🧱 Tech Stack

  
    
      Layer
      Tools
    
  
  
    
      Frontend
      Next.js (App Router), TypeScript
    
    
      Styling
      Tailwind CSS
    
    
      Backend
      Next.js API routes
    
    
      Database
      Prisma ORM + SQLite (dev, easy to swap)
    
  

Swap SQLite for PostgreSQL/MySQL in production by changing `DATABASE_URL` and running migrations.



## 🚀 Getting Started

### 1. Install
`npm install
`

### 2. Environment
Create a `.env` in the project root:
`DATABASE_URL="file:./dev.db"
`

### 3. Prisma
`npx prisma generate
npx prisma migrate dev
`

### 4. Run Dev Server
`npm run dev
`

Then open [http://localhost:3000](http://localhost:3000)



## 🗂️ Key Paths
`src/
├─ app/
│  ├─ page.tsx                       # Dashboard
│  ├─ new/page.tsx                   # New SKU (or Add Revision prefilled)
│  └─ request/[id]/page.tsx          # Manage Request view (SKUs table)
│
├─ app/api/
│  ├─ requests/route.ts              # Create/list Requests
│  └─ submissions/
│     ├─ route.ts                    # Create Submission with products
│     └─ [submissionId]/products/[productId]/revisions/route.ts
│                                    # Create Revision for a SKU
│
└─ lib/
   ├─ prisma.ts                      # Prisma client
   ├─ components/RequestTable.tsx    # Requests table
   └─ components/SubmissionTable.tsx # Legacy submissions table
`



## 🔁 Revisions Flow

  1. **Manage Request** (`/request/[id]`) shows the **current** revision per SKU.
  1. Click **Add Revision** → opens `/new?requestId=…&amp;fromProductId=…&amp;submissionId=…`.
  1. Prefill logic loads the existing SKU.
  1. On submit, the Revisions API marks the previous SKU revision as not current.
  1. Optional **History** view lists all revisions for a SKU.




## 🧩 Schema Highlights

  * `SubmissionProduct` includes:
    <ul>
      * `version Int @default(1)`
      * `isCurrent Boolean @default(true)`
      * `@@unique([submissionId, sku, version])`
      * Flags: `noEndDate`, `noSavings`, `isPdpRequested`
    
  
  Nested models:
    
      * `SubmissionProductAccessory`
      * `SubmissionProductRecommendation`
      * `SubmissionProductCulture`
    
  

See `prisma/schema.prisma` for full schema.



## 📦 Scripts
`npm run dev        # start dev server
npm run build      # production build
npm run start      # start production server
npx prisma studio  # browse database (dev)
`



## 📜 License
Internal project. © Melaleuca.

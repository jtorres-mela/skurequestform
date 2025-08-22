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




<section id="tech-stack">
  <h2>🔧 Tech Stack</h2>

  <h3>🖥️ Frontend</h3>
  <ul>
    <li><strong>Next.js 14 (App Router)</strong> — Modern React framework with SSR/SSG and file-based routing.</li>
    <li><strong>TypeScript</strong> — Static typing for safer, scalable code.</li>
  </ul>

  <h3>🎨 Styling</h3>
  <ul>
    <li><strong>Tailwind CSS</strong> — Utility-first styling for fast, responsive UI.</li>
  </ul>

  <h3>⚙️ Backend</h3>
  <ul>
    <li><strong>Next.js API Routes</strong> — Lightweight endpoints for CRUD over SKU data.</li>
  </ul>

  <h3>🗄️ Database</h3>
  <ul>
    <li><strong>Prisma ORM</strong> — Type-safe queries and migrations.</li>
    <li><strong>SQLite (development)</strong> — Simple file-based DB (<code>dev.db</code>).</li>
    <li><strong>PostgreSQL/MySQL (production)</strong> — Swap via <code>DATABASE_URL</code> and run Prisma migrations.</li>
  </ul>

  <p><em>Tip:</em> Swap SQLite for PostgreSQL/MySQL in production by changing <code>DATABASE_URL</code> and running Prisma migrations.</p>
</section>




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



<h2>🗂️ Key Paths</h2>

<details open>
  <summary><strong>App Routes</strong></summary>
  <table>
    <thead>
      <tr>
        <th align="left">Path</th>
        <th align="left">Purpose</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>src/app/page.tsx</code></td>
        <td>Dashboard</td>
      </tr>
      <tr>
        <td><code>src/app/new/page.tsx</code></td>
        <td>New SKU form (also used for “Add Revision” with prefill)</td>
      </tr>
      <tr>
        <td><code>src/app/request/[id]/page.tsx</code></td>
        <td>Manage Request view (current SKU table, actions)</td>
      </tr>
    </tbody>
  </table>
</details>

<details open>
  <summary><strong>API Routes</strong></summary>
  <table>
    <thead>
      <tr>
        <th align="left">Path</th>
        <th align="left">Purpose</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>src/app/api/requests/route.ts</code></td>
        <td>Create/list Requests</td>
      </tr>
      <tr>
        <td><code>src/app/api/submissions/route.ts</code></td>
        <td>Create Submission (group) with products</td>
      </tr>
      <tr>
        <td><code>src/app/api/submissions/[submissionId]/products/[productId]/revisions/route.ts</code></td>
        <td>Create a Revision for a SKU</td>
      </tr>
    </tbody>
  </table>
</details>

<details open>
  <summary><strong>Lib & Schema</strong></summary>
  <table>
    <thead>
      <tr>
        <th align="left">Path</th>
        <th align="left">Purpose</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>src/lib/prisma.ts</code></td>
        <td>Prisma client</td>
      </tr>
      <tr>
        <td><code>prisma/schema.prisma</code></td>
        <td>Database schema</td>
      </tr>
      <tr>
        <td><code>src/lib/components/RequestTable.tsx</code></td>
        <td>Requests table component</td>
      </tr>
      <tr>
        <td><code>src/lib/components/SubmissionTable.tsx</code></td>
        <td>Legacy submissions table</td>
      </tr>
    </tbody>
  </table>
</details>



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

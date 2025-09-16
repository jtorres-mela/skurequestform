# SKU Request Management System

> A Next.js app for creating, revising, and tracking SKU requests at **Melaleuca**.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwindcss&logoColor=white)

SKU Requests streamlines product submissions and revisions, including accessories, culture translations, and recommendations — with version history per SKU.

---

## ✨ Features

- **Per-market model:** UoM, savings, and sale dates by market (US/CA/MX/GB/IE/NL/DE/PL/LT).
- **Cultures:** EU presets restored; quick select/toggle via an improved **CulturePicker**.
- **SKU entry helpers:** Chip-based editors for **Accessories** and **Recommended Products** with bulk paste & de‑dupe.
- **Rich text long description:** WYSIWYG editor (React Quill) with safe HTML preview rendering.
- **Request Management:** Create requests, set due dates, track notes, upload promotion files.
- **Revisions & Versioning:** Add revisions per SKU and preserve history.
- **Prefill Revisions:** Start from an existing SKU to speed up edits.
- **Action icons:** Clean “Actions” column using compact icon buttons.
- **Smartling submission:** Client-side popup with region selection (US/CA/EU) and credential prompts.

---

<section id="tech-stack">

### 🔧 Tech Stack

#### 🖥️ Frontend
- **Next.js 15 (App Router)**
- **TypeScript**
- **React Quill (`react-quill-new`)** for WYSIWYG

#### 🎨 Styling
- **Tailwind CSS**

#### ⚙️ Backend
- **Next.js API Routes**

#### 🗄️ Database
- **Prisma ORM**
- **SQLite (dev)** via `dev.db` (swapable in prod)

</section>

---

## 🚀 Getting Started

### 1) Install
```bash
npm install
```

### 2) Environment

We use two env files in development:

- **`.env`** (checked in): database only — used by Prisma CLI.
- **`.env.local`** (git-ignored): dev-only/secrets like email settings.

Create/update the files:

**.env**
```bash
# Database
DATABASE_URL="file:./dev.db"

# Email (dev proof-of-concept only)
# Uses Ethereal test SMTP — no real mail is sent; a preview URL is returned.
EMAIL_PROVIDER=ethereal
EMAIL_FROM="SKU Request <noreply@example.com>"

# Optional: used to build absolute links in emails
NEXT_PUBLIC_APP_URL="http://localhost:3000"

### 3) Prisma
```bash
npx prisma generate
npx prisma migrate dev --name per_market_values
```

### 4) Run Dev Server
```bash
npm run dev
```
Then open http://localhost:3000.

> **Windows note:** If you see a Turbopack “workspace root” warning about multiple lockfiles, remove the extra `package-lock.json` at repo root or set `turbopack.root` in `next.config.js`.

---

## 🗂️ Key Paths

<details open>
  <summary><strong>App Routes</strong></summary>

| Path | Purpose |
|---|---|
| `src/app/page.tsx` | Dashboard |
| `src/app/new/page.tsx` | New SKU form (also “Add Revision” w/ prefill) |
| `src/app/request/[id]/page.tsx` | Manage Request (current SKU table, actions, promotion uploads) |
| `src/app/request/[id]/history/page.tsx` | (If present) SKU history by request/sku |
</details>

<details open>
  <summary><strong>API Routes</strong></summary>

| Path | Purpose |
|---|---|
| `src/app/api/requests/route.ts` | Create/list Requests |
| `src/app/api/submissions/route.ts` | Create Submission (group) with products |
| `src/app/api/submissions/[submissionId]/products/[productId]/revisions/route.ts` | Create a Revision for a SKU |
| `src/app/api/smartling-job/route.ts` | Smartling job creation (US/CA/EU) |
| `src/app/api/requests/[id]/promotions/[uploadId]/download/route.ts` | Promotion file download |
</details>

<details open>
  <summary><strong>Lib & Components</strong></summary>

| Path | Purpose |
|---|---|
| `src/lib/prisma.ts` | Prisma client |
| `prisma/schema.prisma` | DB schema (see “Schema Highlights”) |
| `src/lib/components/PreviewPane.tsx` | Live preview; renders sanitized rich HTML |
| `src/lib/components/Form.tsx` | `FormField`, `CurrencyInput`, shared inputs |
| `src/lib/components/RichTextEditorQuill.tsx` | WYSIWYG editor (SSR-safe) |
| `src/lib/components/AccessoryEditor.tsx` | Row+bulk editor for accessories |
| `src/lib/components/AccessoryChips.tsx` | Chip-style accessory editor |
| `src/lib/components/SkuChips.tsx` | Chip-style recommended SKUs editor |
| `src/lib/components/CulturePicker.tsx` | Culture presets + EU group toggle |
| `src/lib/components/IconButton.tsx` | Icon-styled buttons (Link/button) |
| `src/lib/components/ActionBar.tsx` | Compact action group in tables |
| `src/lib/components/ManageRequestActions.tsx` | Request-level actions |
| `src/lib/components/SubmitToSmartlingPopup.tsx` | Client popup for Smartling submission |
</details>

---

## 🔁 Revisions Flow

1. **Manage Request** (`/request/[id]`) shows the **current** revision per SKU.
2. **Add Revision** → opens `/new?requestId=…&fromProductId=…&submissionId=…` and pre-fills.
3. On submit, the API creates a new revision and updates the “current” flag.
4. **History** (if enabled) lists all revisions per SKU.

---

## 🧩 Schema Highlights

**Key change:** Per-market values live in `SubmissionProductMarket` with a `Market` enum.

- **Request**:
  - `type` enum: `OPEN_STOCK | INCREMENTAL_PROMO | COUPON_PROMO`
  - `promoUploads` relation for promo files

- **SubmissionProduct** (core SKU row):
  - Versioning: `version Int @default(1)`, `isCurrent Boolean @default(true)`, `@@unique([submissionId, sku, version])`
  - Translations gate & requested cultures JSON
  - **New relation:** `markets SubmissionProductMarket[]` (per-market UoM, savings, dates)
  - Accessories / Recommendations / Cultures relations unchanged

- **Market** enum:
  - `US | CA | MX | GB | IE | NL | DE | PL | LT`

- **SubmissionProductMarket**:
  - `market Market @unique(productId, market)`
  - `noSavings`, `savings Decimal?`, `currency?`
  - `uomValue?`, `uomTitle?`
  - `onSaleDate?`, `offSaleDate?`, `noEndDate`

- **Promotions**:
  - `PromotionUpload` & `PromotionLine` for promo sheets/files

> Run `npx prisma migrate dev --name per_market_values` to apply.

---

## 🧠 UI Conventions

- **Section layout:** Heading + one-line helper text → per-market cards or fields.
- **Fields:** Use `FormField` for consistent label/help/error.
- **Actions:** Use `ActionBar` with `IconButton` to keep tables compact.
- **Chips:** Prefer `AccessoryChips` / `SkuChips` over CSV inputs; supports paste bulk.
- **WYSIWYG:** `RichTextEditorQuill` stores **HTML**; preview sanitized with `isomorphic-dompurify`.
- **Cultures:** `CulturePicker` provides individual toggles and EU group toggle.

---

## 📦 Scripts

```bash
npm run dev         # start dev server
npm run build       # production build
npm run start       # start production server
npx prisma studio   # browse database (dev)
```

---

## 🔐 Smartling Notes

- Credentials are entered per region (US/CA/EU) in a client popup and stored in `localStorage`.
- EU supports selecting target locales.
- API endpoint: `POST /api/smartling-job`.

---

## 🧰 Troubleshooting

- **Turbopack root warning (Windows):** Remove extra `package-lock.json` at repo root or set `turbopack.root` in `next.config.js`.
- **CRLF warnings:** Harmless on Windows. You can run `git config core.autocrlf true`.
- **React Quill bold flipping:** Using the default Snow toolbar (`modules={{ toolbar: true }}`) avoids custom-format mismatches.

---

## 📜 License

Internal project. © Melaleuca.

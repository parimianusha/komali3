# Intelligent Document Processor (IDP) Studio

A production-ready, secure full-stack Intelligent Document Processing web application built from the ground up. Ingest common business documents, extract grounded structured fields using **Google Gemini AI** via the official `@google/genai` SDK, verify and correct results with a human-in-the-loop review workflow, and search or export verified records to CSV and JSON.

---

## 1. System Overview & Core Directives

The **Intelligent Document Processor** is designed for individuals and teams to handle high-volume documents safely and systematically:
- **Zero Hallucination / Grounded Extraction**: The AI acts purely as an extraction assistant. It does not invent facts, treat ambiguous data as verified truth, or provide legal/financial/medical advice. Unidentified or ambiguous values are flagged with explicit warning notices and evidence citations.
- **Human-in-the-Loop Review**: Extracted values are displayed side-by-side with original source documents (PDFs, images, and text). Users can correct values, mark fields as verified, and attach reviewer notes with a complete audit trail.
- **Account & Workspace Isolation**: Every document, extraction version, review note, and tag is tied to an authenticated owner. Row Level Security (RLS) is enforced in PostgreSQL and verified across all server endpoints.
- **Private Object Storage**: Source documents are stored in private storage buckets and accessed exclusively through short-lived signed URLs. Public file URLs are never exposed.
- **Resilient Offline / Demo Mode**: Full functionality can be tested locally right out of the box with zero external dependencies, seamlessly switching to live cloud Supabase and Gemini AI when API keys are configured.

---

## 2. Technology Stack

- **Frontend**: [React.js 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/)
- **Backend API**: [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/) + [TypeScript](https://www.typescriptlang.org/)
- **Database & Authentication**: [Supabase PostgreSQL](https://supabase.com/) & Supabase Auth with Row Level Security (RLS)
- **Object Storage**: Private buckets with signed URLs (TTL: 300s)
- **AI Engine**: [Google Gemini](https://ai.google.dev/) using the official `@google/genai` SDK on the server only
- **Validation**: [Zod](https://zod.dev/) schemas shared end-to-end between frontend and backend
- **Security**: Magic byte file validation, Helmet security headers, rate limiters, and CSV formula injection mitigations
- **Testing**: [Vitest](https://vitest.dev/) automated test suite for validation, concurrency, security, and exports

---

## 3. Monorepo Architecture

```
.
├── backend/                         # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/                  # Environment validation, Supabase client
│   │   ├── middleware/              # JWT Auth verification, Centralized Error Handler
│   │   ├── routes/                  # Health, Stats, Documents CRUD & Actions
│   │   ├── services/
│   │   │   ├── db/                  # DocumentStore (Supabase + local fallback)
│   │   │   ├── extraction/          # Gemini AI SDK service & PDF parser
│   │   │   ├── fileValidation/      # Magic bytes verification & filename sanitizer
│   │   │   ├── processing/          # DocumentProcessor with durable atomic claims
│   │   │   ├── storage/             # StorageService (Private storage + signed URLs)
│   │   │   └── export/              # CSV & JSON exporter with formula injection defense
│   │   ├── shared/                  # Embedded shared types & Zod schemas
│   │   ├── tests/                   # Vitest unit & integration test suites
│   │   └── app.ts                   # Express application entrypoint
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/                        # React 18 + Vite + Tailwind CSS Client
│   ├── src/
│   │   ├── components/common/       # Navbar, AppShell, Badges, Modals, Skeletons
│   │   ├── context/                 # AuthContext, ToastContext
│   │   ├── features/documents/      # DocumentUploader, Preview, Fields, ReviewEditor, Table
│   │   ├── lib/                     # apiClient, supabaseClient
│   │   ├── pages/                   # Dashboard, List, Upload, Details, Review, Settings, Auth
│   │   ├── shared/                  # Embedded shared types & Zod schemas
│   │   └── App.tsx                  # Router with protected & public guards
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── supabase/
│   └── migrations/
│       ├── 20261015000001_initial_schema.sql       # DDL, indexes, triggers, and table RLS
│       └── 20261015000002_storage_policies.sql     # Private storage bucket & storage RLS
├── .env.example                     # Environment template
├── package.json                     # Root workspace manifest with run scripts
└── README.md
```

---

## 4. Supported Document Categories & Extraction Guidance

The application supports controlled document classifications:
1. **Invoice**: Issuer, recipient, invoice number, invoice date, due date, currency, subtotal, tax, total amount, line items.
2. **Receipt**: Merchant, date, total, tax, currency, payment method (cash/card/online).
3. **Contract**: Parties, effective date, expiration/renewal terms, governing law, and key obligations.
4. **Identity or Application Form**: Form title, applicant name, identifiers, form submission date, visible fields.
5. **Business Letter**: Sender, recipient, date, subject line, core message summary.
6. **Report**: Title, author, date, key numerical metrics, executive summary.
7. **Other / Unclassified**: Title, date, named entities, identifiers, and factual summary.

---

## 5. Database Schema & RLS Policies

The database is built on PostgreSQL with strict constraints, indexes, triggers, and Row Level Security:

### Tables
- `profiles`: Synced with `auth.users`, stores display names and timestamps.
- `documents`: Stores document metadata (`original_name`, `mime_type`, `size_bytes`, `storage_path`, `category`, `custom_category`, `status`, `extracted_text`, `processing_attempts`, `processing_leased_at`, `last_error_code`).
- `document_extractions`: Versioned extractions (`document_id`, `version`, `provider`, `model`, `schema_version`, `result` jsonb, `warnings` jsonb).
- `document_reviews`: Per-field human verification and audit notes (`document_id`, `reviewer_id`, `field_key`, `original_value`, `corrected_value`, `verified`, `note`).
- `document_tags`: Document tags for filtering and organization (`document_id`, `owner_id`, `tag`).

### Row Level Security (RLS)
- **Documents**: `using (owner_id = auth.uid())` for SELECT, INSERT, UPDATE, DELETE.
- **Extractions**: Permitted only when `parent document.owner_id = auth.uid()`.
- **Reviews**: Permitted only when `parent document.owner_id = auth.uid()` AND `reviewer_id = auth.uid()`.
- **Tags**: Permitted only when `parent document.owner_id = auth.uid()` AND `owner_id = auth.uid()`.
- **Storage Objects**: Restricts paths in bucket `documents` to `(storage.foldername(name))[1] = auth.uid()::text`.

---

## 6. Getting Started

### Quick Start (From Root)
Clone the repository and install all dependencies:
```bash
git clone <repository-url>
cd <repository-directory>
npm install
```

### Running Both Together:
```bash
# Runs both backend (port 4000) and frontend (port 5173) simultaneously:
npm run dev
```

### Or Running Independently:

#### Option A: Running from Root Scripts
```bash
# Run backend server (Port 4000)
npm run dev:backend

# Run frontend client (Port 5173)
npm run dev:frontend
```

#### Option B: Running inside separate folders
```bash
# Terminal 1 - Backend:
cd backend
npm install
npm run dev

# Terminal 2 - Frontend:
cd frontend
npm install
npm run dev
```

Open your browser at: **[http://localhost:5173](http://localhost:5173)**.

> **Offline / Demo Mode Notice**:
> If you have not yet configured Supabase or Gemini API keys, the application automatically boots in **Local Offline Mode**. You can click **"Quick Demo Sign In"** on the login screen to immediately test uploading documents, viewing previews, editing fields, and exporting CSV/JSON data.

---

## 8. Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server listening port | `4000` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |
| `APP_ORIGIN` | Web client origin for CORS | `http://localhost:5173` |
| `SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Public anon key for client and auth verification | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged service key (Server-only!) | `eyJhbGci...` |
| `SUPABASE_STORAGE_BUCKET` | Private storage bucket name | `documents` |
| `GOOGLE_API_KEY` | Google Gemini API key (Server-only!) | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini extraction model identifier | `gemini-2.5-flash` |
| `MAX_UPLOAD_BYTES` | Maximum allowed file upload size in bytes | `10485760` (10 MB) |
| `MAX_UPLOAD_FILES` | Maximum number of files in a single batch upload | `10` |
| `SIGNED_URL_TTL_SECONDS`| Validity period of private signed preview URLs | `300` (5 minutes) |
| `AI_PROCESSING_ENABLED` | Global toggle to enable/disable AI model extraction | `true` |

---

## 9. Applying Supabase Migrations

When connecting to a live Supabase project:
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor**.
3. Run the migrations in order:
   - `supabase/migrations/20261015000001_initial_schema.sql` (Tables, Triggers, Indexes, RLS)
   - `supabase/migrations/20261015000002_storage_policies.sql` (Bucket Creation & Storage RLS)
4. Confirm in **Storage** that the `documents` bucket is created and marked **Private**.

---

## 10. REST API Specification (`/api/v1`)

| Method | Endpoint | Description | Authorization |
|---|---|---|---|
| `GET` | `/api/v1/health` | Health check endpoint returning status and version | Public |
| `GET` | `/api/v1/stats` | Aggregated dashboard metrics for authenticated user | Bearer Token |
| `GET` | `/api/v1/documents` | Paginated document list with search, filters, and sort | Bearer Token |
| `POST` | `/api/v1/documents` | Multipart file upload with magic byte inspection | Bearer Token |
| `GET` | `/api/v1/documents/:id` | Document details, latest extraction, tags, and reviews | Bearer Token |
| `PATCH` | `/api/v1/documents/:id` | Update document name, category, or tags | Bearer Token |
| `DELETE` | `/api/v1/documents/:id` | Delete document record and private storage object | Bearer Token |
| `POST` | `/api/v1/documents/:id/process` | Reprocess document with Gemini AI | Bearer Token |
| `GET` | `/api/v1/documents/:id/file` | Generate short-lived signed URL for source preview | Bearer Token |
| `PUT` | `/api/v1/documents/:id/review` | Save human field corrections, verification, and audit notes | Bearer Token |
| `POST` | `/api/v1/documents/export` | Export selected document records as sanitized CSV or JSON | Bearer Token |

---

## 11. Security Guardrails

1. **Server-Side AI Secrets**: The `@google/genai` SDK is called exclusively on the server. `GOOGLE_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are never exposed to the client.
2. **Magic Byte Inspection**: The server reads binary headers (`%PDF-`, `\x89PNG`, `\xFF\xD8\xFF`) to verify authentic file types rather than trusting client extensions or MIME headers.
3. **CSV Formula Injection Mitigation**: Any exported cell value beginning with active spreadsheet formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) is prepended with a single quote `'` to neutralize formula execution in Excel or Google Sheets.
4. **Idempotent Claim Locking**: Concurrency control locks prevent duplicate simultaneous extraction jobs on the same document using database-backed leases.
5. **Private Storage & Short-Lived Signed URLs**: Source files are stored in private namespaces (`<owner_id>/<doc_id>.<ext>`) with short-lived signed URLs (TTL: 300 seconds).
6. **Data Minimization in Logs**: Prompts, full document contents, tokens, passwords, and sensitive extracted values are strictly excluded from server logs.

---

## 12. Automated Testing

Run the automated test suite with Vitest:
```bash
# From root:
npm test

# Or inside backend:
cd backend
npm test
```

The test suite covers:
- Magic bytes detection and file validation across PDF, PNG, JPEG, and text formats.
- Filename sanitization against directory traversal (`../`) and dangerous characters.
- CSV formula injection neutralization (`=`, `@`, `+`, `-`) and comma/quote escaping.
- Zod schema validation on AI extraction responses (snake_case keys, confidence range, bounded lengths).
- Idempotent claim mechanisms preventing concurrent duplicate execution on the same document.
- Error code assignment and safe failure states when storage objects are missing.

---

## 13. Production Build

To compile all TypeScript packages and create optimized production bundles:
```bash
npm run build
```
- API server compiled to `apps/api/dist/`
- Web application bundled to `apps/web/dist/`
- Shared schemas compiled to `packages/shared/dist/`

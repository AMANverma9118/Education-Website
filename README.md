# Greenfield Academy

A full school portal for **students**, **parents**, **teachers**, and the **principal** — public campus site, role dashboards, approvals, grades, attendance, and family linking.

| App | Stack | Deploy |
|-----|--------|--------|
| [`client/`](./client) | React + Vite | **Vercel** |
| [`server/`](./server) | Node + Express + MongoDB | **Render** |

There is **no root `package.json`**. Install and run inside `client/` and `server/` separately.

---

## Features

### Public site
- Luxury campus homepage (scroll hero, horizontal gallery, role panels)
- About & Contact pages
- Sign in / Enrol (student & parent self-registration)

### Authentication & security
- JWT + httpOnly cookies
- Google **reCAPTCHA v2** on login & signup
- Helmet, CORS allowlist, rate limits, Mongo sanitize, HPP
- Zod validation · bcrypt passwords (8+ chars, letter + number)
- Field-level form errors with scroll-to-field
- Button loaders and post-submit “complete” screens

### Principal
- Overview stats, students & teachers roster, pending approvals
- **People** — create teachers, approve students/parents, link parent ↔ student  
  Tables show **linked family** and **phone** numbers
- **Classes** — create sections, assign class teacher, assign students
- **Announcements** — publish to all / students / parents / teachers
- Notification bell + chime when new pending approvals arrive

### Teacher (created by principal only)
- Faculty desk with assigned classes
- Take attendance by class & date
- Record grades (subject, score, comments)

### Student
- Personal portal + **family link code** to share with a parent
- View grades & attendance
- School announcements

### Parent
- Link a child with **student email + family link code**
- Auto-unlocks when linked to an **approved** student
- View children’s grades & attendance

### Registration flow
1. **Student** signs up → principal approves → student shares family link code  
2. **Parent** signs up / links with that email + code → sees the child’s progress  
3. **Teacher** accounts are created only by the principal (People → Create teacher)  
4. **Principal** comes from `server/.env` (`PRINCIPAL_EMAIL` / `PRINCIPAL_PASSWORD`)

---

## Demo logins (explore every role)

Use these after running `npm run seed` in `server/` (and matching principal values in `.env`).

| Role | Email | Password | Notes |
|------|--------|----------|--------|
| **Principal** | `principal@greenfield.edu` | `PrincipalDemo1` | From `PRINCIPAL_*` in `.env` |
| **Teacher** | `teacher@greenfield.edu` | `TeacherDemo1` | Emma Watson · Math / Biology |
| **Student** | `student@greenfield.edu` | `StudentDemo1` | Alekh Verma · Grade 8-A |
| **Parent** | `parent@greenfield.edu` | `ParentDemo1` | Linked to Alekh |

**Student family link code (for parent linking demos):** `GFDEMO1`

> On a live demo, also complete the reCAPTCHA checkbox. For local-only testing you may use [Google’s reCAPTCHA test keys](https://developers.google.com/recaptcha/docs/faq#id-like-to-run-automated-tests-with-recaptcha.-what-should-i-do).

---

## Local setup

### 1. Server

```bash
cd server
npm install
cp .env.example .env   # Windows: copy .env.example .env
```

Edit `server/.env`:

- `MONGODB_URI` — local Mongo or Atlas connection string  
- `PRINCIPAL_EMAIL` / `PRINCIPAL_PASSWORD` — use the demo values above to match the table  
- `RECAPTCHA_SECRET_KEY`  
- `CLIENT_URL=http://localhost:5173`  
- `COOKIE_SECURE=false` for local HTTP  

```bash
npm run seed    # demo teacher / student / parent / class / sample grade
npm run dev     # http://localhost:5000
```

The principal account is created/updated from `.env` every time the API starts.

### 2. Client

```bash
cd client
npm install
cp .env.example .env
```

Set:

- `VITE_API_URL=http://localhost:5000/api`  
- `VITE_RECAPTCHA_SITE_KEY`  

```bash
npm run dev     # http://localhost:5173
```

---

## Deploy

### A. MongoDB Atlas
1. Create a free cluster and database user  
2. Allow network access (Render IPs or `0.0.0.0/0` for demos)  
3. Copy the connection string → `MONGODB_URI`

### B. Backend on Render
1. New **Web Service** → connect this repo  
2. **Root Directory:** `server`  
3. **Build:** `npm install` · **Start:** `npm start`  
4. Or use [`render.yaml`](./render.yaml) Blueprint  

**Environment variables**

| Key | Example / notes |
|-----|------------------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas URI |
| `JWT_SECRET` | long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | `https://your-app.vercel.app` (no trailing slash) |
| `COOKIE_SECURE` | `true` |
| `RECAPTCHA_SECRET_KEY` | from Google reCAPTCHA admin |
| `PRINCIPAL_EMAIL` | `aman@gmail.com` |
| `PRINCIPAL_PASSWORD` | `12345678` (change for real schools) |
| `PRINCIPAL_FIRST_NAME` | `Maya` |
| `PRINCIPAL_LAST_NAME` | `Okoro` |

After the first deploy, open a Render **Shell** (or one-off job) in `server` and run:

```bash
npm run seed
```

so teacher / student / parent demo accounts exist in production.

### C. Frontend on Vercel
1. New Project → this repo  
2. **Root Directory:** `client`  
3. Framework: Vite · Build: `npm run build` · Output: `dist`  
4. [`client/vercel.json`](./client/vercel.json) handles SPA rewrites  

**Environment variables**

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://your-api.onrender.com/api` |
| `VITE_RECAPTCHA_SITE_KEY` | your site key (domain must include the Vercel host) |

Redeploy the client after changing env vars (Vite inlines them at build time).

### D. reCAPTCHA for production
1. [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin) → **v2 “I’m not a robot”**  
2. Domains: your Vercel host (+ `localhost` if needed)  
3. Site key → Vercel `VITE_RECAPTCHA_SITE_KEY`  
4. Secret key → Render `RECAPTCHA_SECRET_KEY`  

---

## Project structure

```
Education-Website/
├── client/                 # React UI (Vercel)
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/          # public, auth, student, parent, teacher, principal
│       └── styles/
├── server/                 # Express API (Render)
│   └── src/
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       ├── middleware/
│       └── scripts/seed.js
├── render.yaml
└── README.md
```

---

## Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| `server/` | `npm run dev` | API with file watch |
| `server/` | `npm start` | Production API |
| `server/` | `npm run seed` | Demo users + class + sample grade |
| `client/` | `npm run dev` | Vite dev server |
| `client/` | `npm run build` | Production bundle |

---

## Suggested walkthrough for reviewers

1. Sign in as **principal** → People (students/parents/phones), Classes, Announcements, notification bell  
2. Sign in as **teacher** → Classes (attendance) → Record grade  
3. Sign in as **student** → family link code, grades, attendance  
4. Sign in as **parent** → see linked child and grades  

Change demo passwords before using this stack for a real school.

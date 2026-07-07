# <div align="center">

![Financia Logo](file:///C:/Users/gilma/.gemini/antigravity/brain/e2d5e85a-036a-41d9-b05c-10c2c2556b0d/financia_logo_1783388186537.jpg){: style="width:150px;"}

# Financia

_⚡️ White‑label financial management app for small businesses_

<div>

[![GitHub license](https://img.shields.io/github/license/gilma/Financia)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/gilma/Financia?style=social)](https://github.com/gilma/Financia/stargazers)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)

</div>

</div>

---

## ✨ Overview

Financia is a **offline‑first**, **white‑label** fintech solution that runs everywhere:
- **Web** (PWA) – hosted on Render
- **Desktop** – Electron (Windows)
- **Mobile** – Android APK (WebView)

Every client gets its own brand (logo, colors, name) without touching code. All UI colors are driven by CSS variables so the same bundle can be re‑skinned on the fly.

---

## 🎯 Key Features

- **Multi‑platform**: PWA, Electron, Android APK
- **Complete CRUD** for transactions, products, losses, and brand settings
- **Robust offline‑first sync** (Dexie ↔ Supabase) with a 2‑minute sync loop
- **White‑label branding** – dynamic CSS variables (`--brand`, `--bg-card`, …)
- **Stripe integration** – subscription & one‑time white‑label payments
- **Full test suite** – 1100+ Vitest tests covering edge cases
- **Strict coding rules** – no optional chaining, no hard‑coded Tailwind colors, no emojis in strings, etc.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, Tailwind CSS v3 (CSS vars) |
| State & Offline | Dexie.js (IndexedDB) |
| Backend | Supabase (PostgreSQL, Auth, RLS, Edge Functions) |
| Desktop | Electron 31 |
| Mobile | Android WebView (APK) |
| Payments | Stripe Elements |
| CI/CD | GitHub Actions (APK + Windows EXE) |
| Tests | Vitest + Testing Library |

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/gilma/Financia.git
cd Financia

# Install dependencies
npm install

# Run locally (web)
npm run dev          # → http://localhost:5173

# Run the full test suite
npm run test
```

> **Note**: Create a `.env` file in the project root with your Supabase keys (see `example.env`).

---

## 📚 Documentation

- **AI Context & Rules** – `docs/AI_CONTEXT.md`
- **Architecture Overview** – `docs/ARCHITECTURE.md`
- **API Reference** – `src/lib/` modules
- **Contribution Guide** – `CONTRIBUTING.md` (coming soon)

---

## 🖼️ Screenshots

> *Replace the placeholders below with real screenshots after customizing the brand.*

<div align="center">
<img src="https://via.placeholder.com/800x450?text=Dashboard+Screen" alt="Dashboard" width="70%"/>
<br/>
<em>Dashboard – Overview of finances</em>
</div>

---

## 🤝 Contributing

Financia follows **the Scout Rule** – always leave the code better than you found it.
1. Fork the repository
2. Create a feature branch (`git checkout -b feat/awesome-feature`)
3. Ensure **all tests pass** (`npm run test`)
4. Open a Pull Request – describe what you changed and why.

All contributions must respect the **strict coding guidelines** listed in `docs/AI_CONTEXT.md` (no optional chaining, no hard‑coded Tailwind colors, etc.).

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
<sub>Built with ❤️ by the Financia team.</sub>
</div>

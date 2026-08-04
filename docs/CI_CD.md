# CI/CD Documentation — Financia

---

## Overview

The Financia project uses GitHub Actions for CI/CD and Render for deployment.

### Pipeline Stages

| Stage | Workflow | Trigger |
|-------|----------|---------|
| Lint + Typecheck | `ci.yml` | Push/PR to main |
| Unit Tests | `ci.yml` | Push/PR to main |
| Integration Tests | `ci.yml` | Push/PR to main |
| Build | `ci.yml` | Push/PR to main |
| Security Audit | `ci.yml` | Push/PR to main |
| Production Audit | `ci.yml` | Push/PR to main |
| Admin Audit | `ci.yml` | Push/PR to main |
| E2E Tests | `ci.yml` | Push/PR to main |
| Extract Errors | `ci.yml` | Push/PR to main |
| Summary + Notify | `ci.yml` | Push/PR to main |
| Deploy to Render | `deploy.yml` | Push to main/develop |
| Deploy Edge Functions | `edge-functions.yml` | Push to main (functions changed) |
| Deploy Migrations | `migrations.yml` | Push to main (migrations changed) |
| Build Release (APK/Windows/PWA/Electron) | `build.yml` | Manual (`workflow_dispatch`) |
| Validate Secrets | `secrets-validation.yml` | PR to main / manual |

---

## Workflow Files

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | Full CI pipeline (lint, test, build, audit, E2E, deploy) |
| `.github/workflows/build.yml` | Release build (APK, PWA, Electron macOS/Linux/Windows) |
| `.github/workflows/deploy.yml` | Auto-deploy to Render (production + staging) |
| `.github/workflows/edge-functions.yml` | Deploy Supabase Edge Functions |
| `.github/workflows/migrations.yml` | Deploy Supabase database migrations |
| `.github/workflows/secrets-validation.yml` | Validate required secrets are configured |

---

## Required Secrets

### CI/CD Secrets (GitHub → Settings → Secrets and variables → Actions)

| Secret | Required For | Description |
|--------|-------------|-------------|
| `RENDER_SERVICE_ID` | Deploy to Render | Render service ID from dashboard |
| `RENDER_API_KEY` | Deploy to Render | Render API key (generate at render.com/api-keys) |
| `SUPABASE_ACCESS_TOKEN` | Edge Functions deploy | Supabase personal access token |
| `SUPABASE_PROJECT_REF` | Edge Functions & Migrations deploy | Supabase project reference ID |
| `KEYSTORE_B64` | APK build (base64-encoded) | Android keystore file encoded in base64 |
| `KEYSTORE_PASS` | APK build | Android keystore password |
| `KEY_ALIAS` | APK build | Android key alias |
| `PLAYWRIGHT_USERNAME` | Admin audit | Test account username |
| `PLAYWRIGHT_PASSWORD` | Admin audit | Test account password |

### Optional Secrets

| Secret | Used For | Description |
|--------|----------|-------------|
| `DISCORD_WEBHOOK_URL` | Notifications | Discord webhook for CI status |
| `SLACK_WEBHOOK_URL` | Notifications | Slack webhook for CI status |
| `LOGO_URL` | Build release | Public URL to client logo |
| `CLIENT_NAME` | Build release | Client name for branded builds |

---

## How to Configure Secrets

### 1. Render API Key

1. Go to https://render.com/api-keys
2. Generate a new API key
3. In GitHub: Settings → Secrets and variables → Actions → New repository secret
4. Name: `RENDER_API_KEY`, Value: `<your-api-key>`
5. Get your service ID from https://render.com/dashboard → your service → Settings → scroll to "Service ID"
6. Name: `RENDER_SERVICE_ID`, Value: `<your-service-id>`

### 2. Supabase Access Token

1. Go to https://supabase.com/dashboard/account/tokens
2. Generate a new access token
3. In GitHub: Settings → Secrets and variables → Actions → New repository secret
4. Name: `SUPABASE_ACCESS_TOKEN`, Value: `<your-token>`
5. Get your project ref from https://supabase.com/dashboard → your project → Project Settings → API → Project Ref
6. Name: `SUPABASE_PROJECT_REF`, Value: `<your-project-ref>`

### 3. Android Keystore

```bash
# Generate keystore (if you don't have one)
keytool -genkeypair -v -keystore financia.jks -keyalg RSA -keysize 2048 -validity 10000 -alias financia

# Encode to base64 for GitHub secret
base64 -i financia.jks | pbcopy
```

Then paste the base64 string as `KEYSTORE_B64` in GitHub secrets.

---

## Auto-Deploy Configuration

### Production (main branch)

When code is pushed to `main`:
1. CI pipeline runs automatically
2. If all jobs pass, `deploy-render` job triggers a Render deploy
3. Render auto-deploys from the connected GitHub repository
4. Production site updates at https://financiabr.me

### Staging (develop branch)

When code is pushed to `develop`:
1. CI pipeline runs automatically
2. `deploy-staging` job triggers a Render deploy for staging
3. Staging site updates at the staging URL

### Branch Strategy

| Branch | Environment | Auto-Deploy |
|--------|------------|-------------|
| `main` | Production | Yes |
| `develop` | Staging | Yes |
| Feature branches | None | No |

---

## Build Workflow

### Manual Release Build

1. Go to GitHub → Actions → "Build Release"
2. Click "Run workflow"
3. Fill in optional fields:
   - **Client Name**: e.g., "Minha Empresa"
   - **Logo URL**: public URL to logo image
   - **Primary Color**: HEX without #, e.g., "002f59"
4. Click "Run workflow"
5. Download artifacts from the workflow run

### Build Outputs

| Artifact | Format | Description |
|----------|--------|-------------|
| APK | `.apk` | Android application package |
| PWA | `.tar.gz` | Progressive Web App archive |
| macOS | `.dmg` | macOS Electron app |
| Linux | `.deb` | Linux Electron package |
| Windows | `.exe` | Windows Electron installer |

---

## Edge Functions Deploy

Edge Functions are automatically deployed when files in `supabase/functions/` are modified:

1. Push changes to `supabase/functions/` directory
2. GitHub Actions triggers `edge-functions.yml`
3. Supabase CLI deploys all functions
4. Functions are live immediately

### Manual Deploy

```bash
supabase functions deploy --no-verify-jwt
```

---

## Migrations Deploy

Database migrations are automatically deployed when files in `supabase/migrations/` are modified:

1. Push changes to `supabase/migrations/` directory
2. GitHub Actions triggers `migrations.yml`
3. Supabase CLI pushes migrations to the database
4. Database schema is updated immediately

### Manual Deploy

```bash
supabase db push
```

---

## CI_REPORT.md

The `CI_REPORT.md` is automatically generated by the `extract-errors` job and committed to the `main` branch after each CI run. It contains:

- Lint + Typecheck status
- Unit test results
- Build status
- E2E test results
- Production audit metrics
- Admin audit summary

---

## Notifications

The pipeline sends notifications via:

1. **GitHub Summary** — Always posted to the PR/workflow run summary
2. **Discord** — If `DISCORD_WEBHOOK_URL` secret is configured
3. **Slack** — If `SLACK_WEBHOOK_URL` secret is configured

---

## Troubleshooting

### CI Pipeline Fails

1. Check the Actions tab in GitHub for the failing job
2. Download the artifact for the failing job
3. Review the logs for the specific error
4. Fix the issue and push a new commit

### Deploy Fails

1. Verify that `RENDER_SERVICE_ID` and `RENDER_API_KEY` are set
2. Check that the Render service is connected to the GitHub repository
3. Verify that the `main` branch is the deploy target in Render settings

### Edge Functions Deploy Fails

1. Verify that `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` are set
2. Check that the Supabase project is accessible
3. Review function logs in the Supabase dashboard

### Migrations Deploy Fails

1. Verify that `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` are set
2. Check for migration conflicts (unapplied migrations)
3. Review migration SQL for syntax errors

---

## Local Development

For local CI/CD testing without pushing to GitHub:

```bash
# Run lint locally
npm run lint

# Run typecheck locally
npm run typecheck

# Run tests locally
npm run test

# Build locally
npm run build

# Deploy Edge Functions locally
supabase functions serve

# Deploy migrations locally
supabase db reset
```

---

## Security Notes

- Never commit secrets to the repository
- All secrets are stored in GitHub Secrets and injected at runtime
- The `RENDER_API_KEY` and `SUPABASE_ACCESS_TOKEN` have limited scope
- The Android keystore is stored as a base64-encoded secret
- The CI pipeline runs with `permissions: contents: read` (minimal permissions)
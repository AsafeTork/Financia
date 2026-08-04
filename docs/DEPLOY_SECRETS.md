# Deploy Secrets Required

This document lists the GitHub Secrets and environment variables required for the Financia CI/CD pipeline to function correctly.

## GitHub Secrets (configured in Settings > Secrets and variables > Actions)

| Secret Name | Description | Required For |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token | Edge Functions deploy, migrations |
| `SUPABASE_PROJECT_REF` | Supabase project reference ID | Edge Functions deploy, migrations |
| `SUPABASE_URL` | Supabase project URL | Validate Secrets job |
| `SUPABASE_ANON_KEY` | Supabase anonymous public key | Validate Secrets job |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Validate Secrets job |
| `STRIPE_SECRET_KEY` | Stripe API secret key | Payment processing (Edge Functions) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Payment webhooks |
| `GH_TOKEN` | GitHub personal access token | Release publishing |
| `RENDER_SERVICE_ID` | Render service ID | Production deploy |
| `RENDER_API_KEY` | Render API key | Production deploy |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL | CI notifications |
| `SLACK_WEBHOOK_URL` | Slack webhook URL | CI notifications |
| `SMTP_HOST` | SMTP server host | Email notifications |
| `SMTP_USER` | SMTP authentication username | Email notifications |
| `SMTP_PASS` | SMTP authentication password | Email notifications |
| `SMTP_FROM_EMAIL` | Sender email address | Email notifications |

## Setup Instructions

1. Go to **Settings > Secrets and variables > Actions** in the GitHub repository
2. Click **New repository secret**
3. Add each secret with the exact name and value from the table above
4. For `DISCORD_WEBHOOK_URL` and `SLACK_WEBHOOK_URL`, create webhooks in your Discord/Slack workspace and paste the URL
5. For `RENDER_SERVICE_ID` and `RENDER_API_KEY`, find them in your Render dashboard

## Notes

- The CI pipeline will skip notification steps if `DISCORD_WEBHOOK_URL` or `SLACK_WEBHOOK_URL` are not set
- The deploy step will fail if `RENDER_SERVICE_ID` or `RENDER_API_KEY` are not configured
- The Validate Secrets job only checks for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
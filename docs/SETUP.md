# The Morrow — Setup Guide

Everything needed to take the project from this repo to a live site with real news, email, Google sign-in and an automatic CI/CD pipeline.

1. [Keys and secrets](#1-keys-and-secrets)
2. [GitHub and commits](#2-github-and-commits)
3. [First-time VPS setup](#3-first-time-vps-setup)
4. [CI/CD pipeline](#4-cicd-pipeline)
5. [Real news providers](#5-real-news-providers)
6. [Checking it all works](#6-checking-it-all-works)

---

## 1. Keys and secrets

All app keys go in **`.env` on the server** — never in the repo, never in chat. `.env` is git-ignored; `.env.example` lists every variable.

| Variable | Needed? | Where it comes from |
|---|---|---|
| `DATABASE_URL` | **Required** | Printed by `deploy/setup-postgres.sh` |
| `AUTH_SECRET` | **Required** | `openssl rand -base64 33` |
| `AUTH_URL`, `APP_URL` | **Required** | Your site address, e.g. `https://morrow.lrdevstudio.com` |
| `CRON_SECRET` | **Required** | `openssl rand -hex 24` |
| `RESEND_API_KEY` | **Required for email** | Resend dashboard (below) |
| `EMAIL_FROM` | **Required for email** | e.g. `The Morrow <paper@yourdomain.com>` — must be on a domain verified in Resend |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | For "Sign in with Google" | Google Cloud (below). The button hides itself until both are set. |
| `GUARDIAN_API_KEY` | Optional | The Guardian Open Platform (section 5) |
| `GNEWS_API_KEY` | Optional | gnews.io (section 5) |
| `NEWSAPI_KEY` | Optional | newsapi.org (section 5) |
| `ANTHROPIC_API_KEY` | Optional | console.anthropic.com — turns on the AI editor (headline, editor's note, summaries, takeaways) |

### Resend (email)
1. Sign up at **resend.com** → **Domains → Add domain** (use a subdomain such as `mail.yourdomain.com`).
2. Add the DNS records Resend shows (SPF, DKIM, and optionally DMARC) at your DNS provider. Wait until the domain shows **Verified**.
3. **API Keys → Create API key** with *Sending access*. Copy it into `RESEND_API_KEY`.
4. Set `EMAIL_FROM` to an address on that verified domain.

Until a key is set, every email is printed to the server log instead of being sent — handy for testing.

Emails the app sends: welcome (every sign-up), new sign-in alert (every sign-in, with method, time, IP and device), "your paper is ready" (daily), password reset, password changed.

### Google sign-in
1. **console.cloud.google.com** → create a project → **APIs & Services → OAuth consent screen**. Choose *External*, fill in app name ("The Morrow"), support email, and your domain. Add scopes `email`, `profile`, `openid`.
2. **Credentials → Create credentials → OAuth client ID → Web application**.
   - Authorised JavaScript origin: `https://YOUR_DOMAIN`
   - Authorised redirect URI: `https://YOUR_DOMAIN/api/auth/callback/google`
   - For local testing also add `http://localhost:3000` and `http://localhost:3000/api/auth/callback/google`.
3. Copy the Client ID and Secret into `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
4. While the consent screen is in *Testing*, only listed test users can sign in. Press **Publish app** before judging day.

---

## 2. GitHub and commits

The evaluators read the commit history, so keep it honest and steady.

### Create the repository and push
```bash
# on your computer, inside the extracted project folder
git remote add origin https://github.com/<your-username>/the-morrow.git
git branch -M main
git push -u origin main
```
Create the repo on github.com first (**New repository → Public**, no README/.gitignore, since the project already has them). The existing history already has separate commits for each piece of work.

### Commit habits that read well
- **Small and often.** One idea per commit; push at least every hour or two of work.
- **Conventional messages:** `feat(reader): add reading progress bar`, `fix(pdf): keep section header with first row`, `docs: setup guide`, `ci: cache npm`, `test: ranking edge cases`.
- **Branches + pull requests for features:** `git switch -c feat/weather-box` → commit → push → open a PR → CI runs on the PR → merge to `main` → CI/CD deploys.
- **Never rewrite or backdate history.** Real timestamps are what "commits are monitored" checks.

### Protect `main` (shows the pipeline is enforced)
GitHub → **Settings → Branches → Add branch ruleset** for `main`: require a pull request, and require the status checks **Lint · Typecheck · Unit tests** and **Migrate · Build · Smoke test** to pass.

---

## 3. First-time VPS setup

Assumes Ubuntu 22.04/24.04 with Node 22, Nginx and a domain pointing at the server.

```bash
# 1. Tools
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git
sudo npm i -g pm2

# 2. Code (a public repo needs no credentials)
cd /var/www
sudo git clone https://github.com/<your-username>/the-morrow.git
sudo chown -R $USER:$USER the-morrow && cd the-morrow

# 3. Database
sudo bash deploy/setup-postgres.sh 'pick-a-strong-db-password'   # prints DATABASE_URL

# 4. Secrets
cp .env.example .env && nano .env      # fill in section 1

# 5. Build and start (PM2 on 127.0.0.1:3010)
bash deploy/deploy.sh
pm2 startup                             # run the command it prints, so PM2 survives reboots

# 6. Nginx + HTTPS
sudo cp deploy/nginx.conf /etc/nginx/sites-available/the-morrow
sudo nano /etc/nginx/sites-available/the-morrow          # set server_name
sudo ln -s /etc/nginx/sites-available/the-morrow /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt-get install -y certbot python3-certbot-nginx && sudo certbot --nginx -d YOUR_DOMAIN

# 7. Daily papers (hourly check; each reader gets theirs at their chosen hour)
crontab -e
# add:  5 * * * * curl -fsS -H "Authorization: Bearer YOUR_CRON_SECRET" https://YOUR_DOMAIN/api/cron/daily > /dev/null
```

**Using `create-nextjs-domain.sh` instead of steps 5–6:** it works as-is, because `npm start -- --port <port>` loads `.env`, runs migrations and starts the standalone server on that port. Answer its prompts with the absolute app folder, PM2 name `the-morrow`, port `3010`, and your domain. After that, `bash deploy/deploy.sh` (or the CI/CD deploy) reloads the same PM2 process.

If the VPS already runs other sites on PM2/Nginx, nothing here touches them: the app has its own PM2 name (`the-morrow`), port (3010) and Nginx site file. Change `PORT` in `deploy/deploy.sh` and `deploy/nginx.conf` together if 3010 is taken.

---

## 4. CI/CD pipeline

Files: `.github/workflows/ci-cd.yml`, `.github/workflows/codeql.yml`, `.github/dependabot.yml`.

| Stage | Runs on | What it does |
|---|---|---|
| **Lint · Typecheck · Unit tests** | every push and PR | ESLint, `tsc --noEmit`, Vitest |
| **Migrate · Build · Smoke test** | after stage 1 | Starts Postgres, applies migrations, fails if migrations and `schema.prisma` disagree, builds, boots the production server, checks public pages return 200, protected pages redirect, cron rejects a missing secret and accepts the right one |
| **Deploy to VPS** | pushes to `main`, once enabled | SSHes into the server, checks out that exact commit, runs `deploy/deploy.sh` (install → migrate → build → PM2 reload), then polls `/api/health` |
| **CodeQL** | pushes/PRs to `main`, weekly | GitHub security scanning |
| **Dependabot** | weekly | PRs for dependency and Action updates |

### Turn on automatic deploys
1. **Make a deploy key pair** on your computer:
   ```bash
   ssh-keygen -t ed25519 -f morrow_deploy -N "" -C "github-actions-deploy"
   ```
2. **Allow it on the VPS:** append `morrow_deploy.pub` to `~/.ssh/authorized_keys` of the deploy user.
3. **GitHub → Settings → Secrets and variables → Actions:**
   - *Secrets:* `VPS_HOST` (IP or hostname), `VPS_USER`, `VPS_SSH_KEY` (the whole private key file `morrow_deploy`), `VPS_APP_DIR` (`/var/www/the-morrow`), and `VPS_PORT` if SSH isn't on 22.
   - *Variables:* `DEPLOY_ENABLED` = `true`, `APP_URL` = `https://YOUR_DOMAIN`.
4. Push to `main`. Watch it in the **Actions** tab; the deploy job links to the live site.

CI never sees your real keys — it uses throwaway values. The app's real secrets stay in `.env` on the server.

---

## 5. Real news providers

### Works out of the box (no keys)
On the VPS the engine already reads live news from:
- **Curated RSS feeds** per topic — BBC, The Guardian, Dawn, Ars Technica, Hacker News, NASA, ScienceDaily, TechCrunch, Dezeen and more (listed in `src/lib/topics.ts`).
- **Google News RSS search** for every topic, every "follow" keyword and the reader's city, localised to their region (PK, US, GB, IN…).

(In the development sandbox these sites were blocked, which is why the sample edition used labelled sample stories. `MORROW_FIXTURES` should be `0` in production.)

### Add keyed news APIs (better summaries and images)
Set any of these in `.env` and run `bash deploy/deploy.sh`. Each one switches on by itself; results are cached for 30 minutes per query so many readers on the same topic share one call.

| Provider | Sign up | `.env` | Notes |
|---|---|---|---|
| **The Guardian Open Platform** | open-platform.theguardian.com/access → *Developer key* | `GUARDIAN_API_KEY` | Good trail-text summaries and thumbnails |
| **GNews** | gnews.io → dashboard | `GNEWS_API_KEY` | Many publishers, country filter; free tier has a small daily request limit |
| **NewsAPI.org** | newsapi.org/register | `NEWSAPI_KEY` | Very broad coverage; the free plan has historically been for development only — read the plan terms before using it on a public site |

Free tiers and terms change often — check each provider's current limits and licence before launch. The Morrow shows headlines, short summaries and links back to the original article, which is what these APIs are designed for.

### Add your own feeds
Open `src/lib/topics.ts` and add RSS/Atom URLs to a topic's `feeds` list, or add a new topic:
```ts
{ id: "urdu-tech", label: "Pakistani Tech", group: "Ideas", emoji: "🇵🇰", query: "Pakistan technology startup",
  feeds: ["https://propakistani.pk/feed/", "https://www.techjuice.pk/feed/"] },
```
Any site with an RSS feed works (most newspapers have one at `/feed`, `/rss` or `/feeds`). Commit, push, and CI/CD deploys it.

### Add a new API provider
Copy one of the providers in `src/server/providers.ts`: give it a `name`, an `enabled()` check for its env key, and a `search()` that maps the API's articles to `{ title, url, source, topic, summary, imageUrl, publishedAt }`. Add it to `PROVIDERS`.

---

## 6. Checking it all works

- `https://YOUR_DOMAIN/api/health` shows the database, active news providers, email mode, Google sign-in and AI editor status, plus the deployed commit:
  ```json
  {"status":"ok","database":"ok","providers":["rss","google-news","guardian"],"email":"resend","googleSignIn":true,"aiEditor":true,"version":"5dbc346"}
  ```
- Sign up → you get the welcome email. Sign out and back in → you get a sign-in alert.
- Trigger the daily run by hand: `curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR_DOMAIN/api/cron/daily`.
- Logs: `pm2 logs the-morrow`.

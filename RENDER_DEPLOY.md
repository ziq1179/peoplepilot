# Deploy PeoplePilot to Render

## 1. Push your code to GitHub

Render deploys from Git. If you haven’t already:

```bash
git add .
git commit -m "Add Render config"
git push origin main
```

(Use your real branch name if it’s not `main`.)

---

## 2. Create the Web Service on Render

1. Go to **[dashboard.render.com](https://dashboard.render.com)** and sign in (or sign up with GitHub).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account if asked, then select the **PeoplePilot** repo.
4. Use these settings:

   | Field | Value |
   |-------|--------|
   | **Name** | `peoplepilot` (or any name) |
   | **Region** | Choose one (e.g. Oregon) |
   | **Branch** | `main` (or your default branch) |
   | **Runtime** | Node |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm start` |
   | **Plan** | Free |

5. Click **Advanced** and add environment variables:

   | Key | Value |
   |----|--------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Your Neon connection string (from Neon dashboard) |
   | `SESSION_SECRET` | A long random string (e.g. from `openssl rand -hex 32`) |

   Use the same Neon `DATABASE_URL` you have in your local `.env`. Do **not** commit it; set it only in Render.

6. Click **Create Web Service**.

Render will install deps, run the build, start the server, and give you a URL like `https://peoplepilot.onrender.com`.

---

## 3. (Optional) Use the Blueprint instead

If you prefer to use the repo’s Blueprint:

1. In the Render dashboard, click **New +** → **Blueprint**.
2. Connect the repo and select it; Render will read `render.yaml`.
3. For `DATABASE_URL` and `SESSION_SECRET`, enter the values in the dashboard when prompted (or after the service is created, in the service **Environment** tab).

---

## 4. After first deploy

- **Database:** The app uses your existing Neon database. No extra DB setup on Render.
- **Free tier:** The service may spin down after ~15 minutes of no traffic; the first request after that can be slow (cold start).
- **Logs:** Use the **Logs** tab on the service in Render to debug build or runtime errors.

Your app URL will be something like: `https://peoplepilot.onrender.com`.

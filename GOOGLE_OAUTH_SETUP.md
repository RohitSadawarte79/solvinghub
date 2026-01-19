# Google OAuth Setup Guide for SolvingHub

## Complete Step-by-Step Instructions

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google account

### Step 2: Create a New Project (or Select Existing)

1. Click the project dropdown at the top of the page
2. Click **"New Project"**
3. Enter project details:
   - **Project Name**: `SolvingHub` (or your preferred name)
   - **Organization**: Leave as default (if applicable)
4. Click **"Create"**
5. Wait for the project to be created (takes ~10 seconds)
6. Select your new project from the dropdown

### Step 3: Enable Google+ API

1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** (or "Google Identity")
3. Click on **"Google+ API"**
4. Click **"Enable"**
5. Wait for activation

### Step 4: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose user type:
   - Select **"External"** (for public access)
   - Click **"Create"**

3. **App information:**
   - **App name**: `SolvingHub`
   - **User support email**: Your email
   - **App logo**: (Optional) Upload your app logo

4. **App domain** (Optional but recommended):
   - **Application home page**: 
     - **For Vercel**: `https://your-project.vercel.app`
     - **For custom domain**: `https://yourapp.com`
     - **For local testing**: `http://localhost:3000`
   - **Application privacy policy link**: Your privacy policy URL
   - **Application terms of service link**: Your terms URL

5. **Authorized domains**:
   - Add: `supabase.co` (for Supabase authentication)
   - **If using Vercel**: Add `vercel.app` (for preview deployments)
   - **If using custom domain**: Add your domain (e.g., `solvinghub.com`)

6. **Developer contact information**:
   - Enter your email address

7. Click **"Save and Continue"**

8. **Scopes** (Step 2):
   - Click **"Add or Remove Scopes"**
   - Select these scopes:
     - `userinfo.email`
     - `userinfo.profile`
     - `openid`
   - Click **"Update"**
   - Click **"Save and Continue"**

9. **Test users** (Step 3):
   - Click **"Add Users"**
   - Add your email and any test users
   - Click **"Save and Continue"**

10. **Summary** (Step 4):
    - Review your settings
    - Click **"Back to Dashboard"**

### Step 5: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** at the top
3. Select **"OAuth 2.0 Client ID"**

4. **Application type**:
   - Select **"Web application"**

5. **Name**:
   - Enter: `SolvingHub Web Client`

6. **Authorized JavaScript origins**:
   - Click **"+ Add URI"**
   - Add: `http://localhost:3000` (for local development)
   - **If using Vercel**:
     - Add: `https://your-project.vercel.app` (production)
     - Add: `https://your-project-git-main-username.vercel.app` (main branch)
     - Optional: `https://solvinghub.com` (if using custom domain)
   - **If NOT using Vercel**:
     - Add: `https://yourdomain.com` (your production domain)
   - Add: `https://your-project-ref.supabase.co` (your Supabase project URL)

7. **Authorized redirect URIs**: ⚠️ **IMPORTANT**
   - Click **"+ Add URI"**
   - For **Supabase**, add:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
   - For **local development**:
     ```
     http://localhost:54321/auth/v1/callback
     ```
   
   > **For Vercel Preview Deployments:**
   > - Vercel creates unique URLs for each PR (e.g., `https://solvinghub-abc123.vercel.app`)
   > - You can't add all preview URLs individually
   > - **Solution**: Use wildcard domain `vercel.app` in "Authorized domains" (Step 5)
   > - This allows OAuth to work on all Vercel preview URLs

   > **How to find your Supabase redirect URI:**
   > 1. Go to your Supabase project dashboard
   > 2. Navigate to **Authentication** → **Providers**
   > 3. Click on **Google**
   > 4. Copy the **Callback URL (for OAuth)** shown there
   > 5. Use that exact URL

8. Click **"Create"**

### Step 6: Save Your Credentials

A popup will appear with your credentials:

```
Client ID: 123456789-abcdefghijklmnop.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ IMPORTANT:**
- Copy both values immediately
- Store them securely (you'll need them for Supabase)
- You can view them again from the Credentials page

### Step 7: Configure Supabase with Google OAuth

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list and toggle it **ON**
5. Enter your credentials:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console
6. Copy the **Callback URL** shown (should match what you added in Step 5)
7. Click **"Save"**

### Step 8: Test Authentication

1. Run your Next.js app:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:3000/login`
3. Click "Sign in with Google"
4. You should be redirected to Google's OAuth consent screen
5. After approval, you'll be redirected back to your app

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Cause**: The redirect URI doesn't match what's configured in Google Cloud Console

**Solution**:
1. Check the error URL for the actual redirect URI being used
2. Add that exact URI to "Authorized redirect URIs" in Google Cloud Console
3. Wait 5 minutes for changes to propagate
4. Try again

### Error: "Access blocked: This app's request is invalid"
**Cause**: OAuth consent screen not properly configured

**Solution**:
1. Complete the OAuth consent screen setup
2. Add test users if app is in "Testing" mode
3. Ensure all required scopes are added

### Error: "Cookies not enabled"
**Cause**: Browser blocking third-party cookies

**Solution**:
1. Enable cookies in your browser
2. Or use Supabase's cookie storage workaround

### Development vs Production URLs

**For Local Development:**
- Authorized JavaScript origins: `http://localhost:3000`
- Redirect URI: `http://localhost:54321/auth/v1/callback`

**For Vercel Production:**
- Authorized JavaScript origins: 
  - `https://your-project.vercel.app`
  - `https://solvinghub.com` (if using custom domain)
- Authorized Domains: `vercel.app` (for all preview deployments)
- Redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`

**For Other Production Hosting:**
- Authorized JavaScript origins: `https://yourdomain.com`
- Redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`

---

## Vercel-Specific Configuration

### Finding Your Vercel URLs

1. **Production URL:**
   - Go to your [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Copy the production URL (e.g., `solvinghub.vercel.app`)

2. **Preview URLs:**
   - Each PR gets a unique URL
   - Format: `your-project-git-branch-username.vercel.app`
   - These work automatically with `vercel.app` authorized domain

### Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (NOT exposed to client)
```

4. Select environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

5. Click **"Save"**

### Troubleshooting Vercel Deployments

**Issue**: OAuth works locally but not on Vercel

**Solutions**:
1. Verify `vercel.app` is in Authorized domains
2. Check environment variables are set correctly
3. Ensure Supabase callback URL matches exactly
4. Clear browser cache and try in incognito mode

**Issue**: Preview deployments show "redirect_uri_mismatch"

**Solution**:
- This is expected if `vercel.app` is not in Authorized domains
- Add `vercel.app` to step 5 (Authorized domains)
- Wait 5 minutes for Google's cache to clear

---

## Security Best Practices

1. **Never commit credentials to Git**
   - Add `.env.local` to `.gitignore`
   - Use environment variables

2. **Restrict domains**
   - Only add domains you control
   - Remove localhost URIs in production

3. **Regular rotation**
   - Rotate Client Secret periodically
   - Revoke unused credentials

4. **Monitor usage**
   - Check Google Cloud Console for unusual activity
   - Set up quota alerts

---

## Quick Reference

**Google Cloud Console**: https://console.cloud.google.com
**OAuth Consent Screen**: APIs & Services → OAuth consent screen
**Credentials**: APIs & Services → Credentials

**Required Scopes:**
- `openid`
- `userinfo.email`
- `userinfo.profile`

**Redirect URI Format:**
```
https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
```

---

## Next Steps After Setup

1. ✅ Google OAuth configured
2. ➡️ Install Supabase dependencies (`npm install`)
3. ➡️ Set environment variables in `.env.local`
4. ➡️ Test authentication flow
5. ➡️ Update frontend components to use Supabase auth

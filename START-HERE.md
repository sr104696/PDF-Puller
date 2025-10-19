# COMPLETE FIX FOR YOUR NEXT.JS + PUPPETEER APP

## 🎯 Your Situation

You have a Next.js app that:
- Generates PDFs from archived web pages
- Uses Puppeteer/Chromium
- Is getting errors: `libglib-2.0.so.0` and `libnspr4.so` missing
- Cannot use external APIs
- Needs the simplest possible solution

## ✅ THE FIX (3 Simple Steps)

### Step 1: Install Missing Libraries

**Open terminal and run:**

```bash
chmod +x install-deps-simple.sh
sudo bash install-deps-simple.sh
```

This installs the libraries Chrome needs. Takes ~1 minute.

---

### Step 2: Update Your API Route

**File:** `src/app/api/generate-pdf/route.ts`

**Replace with:** The content from `api-route-fixed.ts`

**What it does:**
- Tries multiple ways to launch Chrome
- Uses `--single-process` flag (helps with missing libraries)
- Better error messages
- More robust timeout handling

---

### Step 3: Restart Your App

```bash
npm run dev
```

**That's it!** ✓

---

## 📦 Files Created For You

1. **api-route-fixed.ts** - Drop-in replacement for your API route
2. **install-deps-simple.sh** - One-command dependency installer
3. **Dockerfile.nextjs** - If you need Docker deployment
4. **SIMPLE-FIX-README.md** - Step-by-step instructions
5. **PUPPETEER-SETUP.md** - Additional Puppeteer configuration options

---

## 🐳 Docker Users

If deploying with Docker:

**Use provided Dockerfile:**
```bash
docker build -f Dockerfile.nextjs -t myapp .
docker run -p 3000:3000 --shm-size=2gb myapp
```

**CRITICAL:** Must use `--shm-size=2gb` or Chrome will crash!

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    shm_size: '2gb'
```

---

## 🔍 Troubleshooting

### Error: "Permission denied"
```bash
# Add sudo
sudo bash install-deps-simple.sh
```

### Error: "Still getting libXXX.so errors"
```bash
# Check what's missing
ldconfig -p | grep libglib

# Install manually
sudo apt-get install -y libglib2.0-0 libnspr4 libnss3
```

### Error: "Browser launch failed"
```bash
# Check Chrome is accessible
which google-chrome
which chromium-browser

# Test Chrome directly
google-chrome --version
```

### Error: "Target closed" (Docker only)
```bash
# You forgot --shm-size!
docker run --shm-size=2gb your-image
```

---

## 🚀 Why This Works

**The Problem:**
1. Puppeteer downloads Chrome/Chromium
2. Chrome needs system libraries (libglib, libnspr, etc.)
3. Your system doesn't have these libraries
4. Chrome fails to start

**The Solution:**
1. Install the missing libraries ✓
2. Use safer Chrome launch flags ✓
3. Handle errors gracefully ✓

---

## 📊 What Changed in Your Code

### Before:
```typescript
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ],
})
```

### After:
```typescript
// Tries multiple strategies
// Strategy 1: Standard + --single-process
// Strategy 2: Old headless mode
// Better error handling
// Detailed error messages
```

The new code tries different ways to start Chrome and gives you better error messages if something fails.

---

## 💡 Key Points

✅ **No external APIs needed** - Everything runs on your server
✅ **No complex setup** - Just install libraries and replace one file
✅ **Works locally and in production** - Same solution for both
✅ **Docker ready** - Dockerfile provided
✅ **Well documented** - Clear error messages and instructions

---

## 🎓 What You Learned

1. **Puppeteer needs system dependencies** - It's not just Node packages
2. **Docker needs special config** - `--shm-size=2gb` for Chrome
3. **Multiple launch strategies** - Fallbacks make apps more robust
4. **Error handling matters** - Good errors = faster debugging

---

## ✅ Quick Checklist

- [ ] Run `install-deps-simple.sh` (with sudo)
- [ ] Replace API route with `api-route-fixed.ts`
- [ ] Restart Next.js app
- [ ] Test PDF generation
- [ ] If Docker: Use `--shm-size=2gb`

---

## 🆘 Still Having Issues?

1. Read the error message carefully
2. Check terminal output when error occurs
3. Verify libraries installed: `ldconfig -p | grep libglib`
4. Check Chrome exists: `which google-chrome`
5. Try running Chrome directly: `google-chrome --version`

---

## 🎉 Success Looks Like

```bash
✓ Libraries installed
✓ API route updated
✓ App restarted
✓ PDF generated
✓ No more libXXX.so errors!
```

**You're done!** Your app should now generate PDFs without errors.

---

## 📚 Reference

- Puppeteer Docs: https://pptr.dev
- Chrome Flags: https://peter.sh/experiments/chromium-command-line-switches/
- Docker & Puppeteer: https://pptr.dev/guides/docker

---

**Remember:** The core issue is just missing system libraries. Install them once, and Puppeteer works perfectly! 🚀

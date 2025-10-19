# Fix Puppeteer Missing Libraries - SIMPLE GUIDE

Your Next.js app is failing because Chrome needs system libraries that aren't installed.

## 🚨 The Problem

Error messages like:
```
libglib-2.0.so.0: cannot open shared object file
libnspr4.so: cannot open shared object file
```

This means your system is missing Chrome's dependencies.

## ✅ The Solution

### Option 1: Install Dependencies (Simplest)

**If you have terminal/SSH access:**

1. Make script executable:
```bash
chmod +x install-deps-simple.sh
```

2. Run it (requires sudo):
```bash
sudo bash install-deps-simple.sh
```

3. Restart your Next.js app:
```bash
npm run dev
# or
npm start
```

That's it! ✓

---

### Option 2: Manual Installation

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y libglib2.0-0 libnspr4 libnss3 libatk1.0-0 \
  libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libgbm1 \
  libasound2 libpango-1.0-0 libcairo2
```

**Alpine:**
```bash
apk add --no-cache glib nss chromium
```

Then set in your app:
```javascript
process.env.PUPPETEER_EXECUTABLE_PATH = '/usr/bin/chromium-browser'
```

---

### Option 3: Docker (If deploying to container)

Use the provided Dockerfile:

```bash
# Build
docker build -f Dockerfile.nextjs -t myapp .

# Run (IMPORTANT: Add --shm-size)
docker run -p 3000:3000 --shm-size=2gb myapp
```

Or with docker-compose.yml:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    shm_size: '2gb'  # CRITICAL for Puppeteer
```

---

## 📁 Updated Files

Replace your API route with the fixed version:

**Location:** `src/app/api/generate-pdf/route.ts`

**What changed:**
- Multiple launch strategies (tries different ways to start Chrome)
- Better error handling
- Uses `--single-process` flag (helps with missing libraries)
- More generous timeouts
- Falls back to simpler headless mode if needed

---

## 🧪 Test It

After installing dependencies:

1. Start your Next.js app:
```bash
npm run dev
```

2. Try generating a PDF through your UI

3. If it still fails, check the terminal for error messages

---

## 🆘 Still Not Working?

### Check if libraries are installed:
```bash
ldconfig -p | grep libglib
ldconfig -p | grep libnspr
ldconfig -p | grep libnss
```

You should see output for each. If not, they're not installed.

### Check Chrome/Chromium:
```bash
# Find Chrome
which google-chrome
which chromium-browser

# Test Chrome
google-chrome --version
```

### Get more details:
Run your Next.js app and look at the terminal output when the error occurs. The error message will tell you which specific library is missing.

---

## 🎯 Quick Checklist

- [ ] Terminal/SSH access to server
- [ ] Sudo permissions
- [ ] Run `install-deps-simple.sh`
- [ ] Replace API route with `api-route-fixed.ts`
- [ ] Restart Next.js app
- [ ] Test PDF generation

---

## 📝 Notes

**Why this happens:**
- Puppeteer downloads Chrome/Chromium
- Chrome needs system libraries to run
- Your system doesn't have these libraries
- Installing them fixes the issue

**Why --single-process helps:**
- Uses one process instead of multiple
- Requires fewer system resources
- Works around some missing library issues
- Slightly less stable but usually fine

**Why --shm-size matters (Docker):**
- Chrome uses shared memory (/dev/shm)
- Default Docker /dev/shm is only 64MB
- Chrome needs more (at least 2GB recommended)
- Without it, Chrome crashes with "Target closed" errors

---

## 💡 Pro Tips

1. **Local development:** Just install the dependencies once
2. **Production:** Use Docker with dependencies baked in
3. **CI/CD:** Add dependency installation to your pipeline
4. **Serverless (Vercel/Netlify):** Consider using their Chrome layer or switch to a service

---

## 🚀 That's It!

The simplest path:
1. Run `sudo bash install-deps-simple.sh`
2. Replace your API route
3. Restart your app
4. Generate PDFs ✓

No APIs needed, no complex setup, just install the libraries Chrome needs!

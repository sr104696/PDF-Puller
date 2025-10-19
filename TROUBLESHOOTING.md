# Comprehensive Puppeteer Troubleshooting Guide

## 🔍 Quick Diagnostic

Run this first to identify your issue:

```bash
npm run diagnose
```

## 📋 Error Categories

### 1. Missing System Libraries

#### Symptoms
```
Error: Failed to launch chrome!
Code: 127
stderr: error while loading shared libraries: libXXX.so: cannot open shared object file
```

#### Affected Libraries
- `libglib-2.0.so.0` - Core GLIB library
- `libnspr4.so` - Netscape Portable Runtime
- `libnss3.so` - Network Security Services
- `libatk-1.0.so.0` - Accessibility Toolkit
- `libatk-bridge2.0-0` - ATK bridge
- `libcups2` - Print system
- `libdrm2` - Direct Rendering Manager
- `libgbm1` - Generic Buffer Management
- `libgtk-3-0` - GTK+ toolkit
- `libxcomposite1` - X Composite extension
- `libxdamage1` - X Damage extension
- `libxrandr2` - X Resize and Rotate extension

#### Solutions

**Immediate fix (single library):**
```bash
# Replace XXX with the specific library name
sudo apt-get install -y libXXX
```

**Complete fix (all libraries):**
```bash
sudo ./install-chrome-deps.sh
```

**Manual installation (Debian/Ubuntu):**
```bash
sudo apt-get update && sudo apt-get install -y \
  ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
  libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 \
  libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 \
  libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
  libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
  libxss1 libxtst6 lsb-release wget xdg-utils libdrm2 libxkbcommon0
```

**Verification:**
```bash
npm run check:deps
```

---

### 2. Browser Crashes

#### Symptoms
```
Error: Protocol error (Target.createTarget): Target closed
Error: Protocol error (Runtime.callFunctionOn): Session closed
Page crashed!
```

#### Causes
- Insufficient memory
- Shared memory (/dev/shm) too small
- Incompatible Chrome flags
- System resource exhaustion

#### Solutions

**A. Increase shared memory (Docker):**

docker-compose.yml:
```yaml
services:
  app:
    shm_size: '2gb'
```

Dockerfile:
```dockerfile
# No built-in solution, use docker-compose or run command
```

Docker run:
```bash
docker run --shm-size=2gb your-image
```

**B. Disable shared memory usage:**
```javascript
args: ['--disable-dev-shm-usage']
```

**C. Reduce memory footprint:**
```javascript
args: [
  '--single-process',       // Use single process (less stable)
  '--no-zygote',           // Disable zygote process
  '--disable-gpu',         // Disable GPU
  '--disable-dev-shm-usage'
]
```

**D. System-level (Linux):**
```bash
# Increase /dev/shm size
sudo mount -o remount,size=2G /dev/shm

# Verify
df -h /dev/shm
```

---

### 3. Timeout Errors

#### Symptoms
```
Error: Navigation timeout of 30000 ms exceeded
Error: Timeout waiting for selector
TimeoutError: waiting for function failed: timeout 30000ms exceeded
```

#### Solutions

**A. Increase timeout globally:**
```javascript
const browser = await puppeteer.launch();
const page = await browser.newPage();
page.setDefaultTimeout(60000); // 60 seconds
page.setDefaultNavigationTimeout(60000);
```

**B. Per-operation timeout:**
```javascript
// Navigation
await page.goto(url, { timeout: 60000 });

// Wait for selector
await page.waitForSelector('.element', { timeout: 10000 });

// Wait for function
await page.waitForFunction(() => document.readyState === 'complete', {
  timeout: 30000
});
```

**C. Use retry logic:**
```javascript
await browserManager.navigateWithRetry(page, url, {
  retries: 3,
  waitUntil: 'networkidle2'
});
```

**D. Check wait conditions:**
```javascript
// More lenient conditions
await page.goto(url, {
  waitUntil: 'domcontentloaded' // Instead of 'networkidle2'
});
```

---

### 4. Navigation Failures

#### Symptoms
```
Error: net::ERR_NAME_NOT_RESOLVED
Error: net::ERR_CONNECTION_REFUSED
Error: net::ERR_CONNECTION_TIMED_OUT
Error: net::ERR_ABORTED
```

#### Solutions

**A. Validate URL:**
```javascript
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

**B. Handle errors gracefully:**
```javascript
try {
  await page.goto(url);
} catch (error) {
  if (error.message.includes('net::ERR_')) {
    console.log('Network error, retrying...');
    await page.goto(url, { timeout: 60000 });
  }
}
```

**C. Check network connectivity:**
```bash
# Test DNS resolution
nslookup example.com

# Test connectivity
curl -I https://example.com
```

**D. Configure proxy if needed:**
```javascript
const browser = await puppeteer.launch({
  args: ['--proxy-server=http://proxy:port']
});
```

---

### 5. Sandbox Issues

#### Symptoms
```
Error: Failed to move to new namespace
Error: setuid sandbox
```

#### Solutions

**A. Disable sandbox (containers only):**
```javascript
const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

⚠️ **Warning:** Only use `--no-sandbox` in trusted environments (Docker, CI/CD)

**B. Run as non-root with proper capabilities:**

Dockerfile:
```dockerfile
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser
USER pptruser
```

**C. Configure AppArmor/SELinux:**
```bash
# Disable AppArmor for Chrome (if necessary)
sudo aa-complain /usr/bin/chromium-browser
```

---

### 6. Memory Issues

#### Symptoms
```
Error: Cannot allocate memory
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```

#### Solutions

**A. Increase Node.js heap:**
```bash
NODE_OPTIONS="--max-old-space-size=4096" node script.js
```

**B. Clean up resources:**
```javascript
// Always close pages
await page.close();

// Close browser when done
await browser.close();

// Force garbage collection (if enabled)
if (global.gc) {
  global.gc();
}
```

**C. Limit concurrent operations:**
```javascript
const pLimit = require('p-limit');
const limit = pLimit(3); // Max 3 concurrent pages

const promises = urls.map(url => 
  limit(() => procesPage(url))
);

await Promise.all(promises);
```

**D. Monitor memory:**
```javascript
setInterval(() => {
  const usage = process.memoryUsage();
  console.log(`Memory: ${Math.round(usage.heapUsed / 1024 / 1024)} MB`);
}, 5000);
```

---

### 7. Page Crashes

#### Symptoms
```
Error: Page crashed!
Error: Target closed
```

#### Solutions

**A. Handle page crash event:**
```javascript
page.on('error', error => {
  console.log('Page crashed:', error);
  // Recreate page
});

page.on('pageerror', error => {
  console.log('Page error:', error);
});
```

**B. Reduce page complexity:**
```javascript
// Block resources
await page.setRequestInterception(true);
page.on('request', req => {
  if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
    req.abort();
  } else {
    req.continue();
  }
});

// Disable JavaScript (if possible)
await page.setJavaScriptEnabled(false);
```

**C. Use process-per-site:**
```javascript
const browser = await puppeteer.launch({
  args: ['--process-per-site']
});
```

---

### 8. Docker-Specific Issues

#### Issue: Container exits immediately

**Solution:**
```dockerfile
# Keep container running
CMD ["node", "script.js"]
# Not: RUN node script.js
```

#### Issue: Shared memory too small

**Solution:**
```yaml
# docker-compose.yml
services:
  app:
    shm_size: '2gb'
```

#### Issue: Permission denied

**Solution:**
```dockerfile
# Ensure proper ownership
RUN chown -R pptruser:pptruser /app
USER pptruser
```

#### Issue: Chrome not found

**Solution:**
```dockerfile
# Use official Puppeteer image
FROM ghcr.io/puppeteer/puppeteer:23.0.0

# Or install Chrome/Chromium
RUN apt-get update && apt-get install -y chromium
```

---

### 9. CI/CD Issues

#### GitHub Actions

Add to workflow:
```yaml
- name: Install dependencies
  run: |
    sudo apt-get update
    sudo apt-get install -y libglib2.0-0 libnspr4 libnss3
- name: Run tests
  run: npm test
```

#### GitLab CI

```yaml
test:
  image: ghcr.io/puppeteer/puppeteer:23.0.0
  script:
    - npm ci
    - npm test
```

#### Jenkins

```groovy
stage('Test') {
  steps {
    sh 'apt-get update && apt-get install -y libglib2.0-0'
    sh 'npm test'
  }
}
```

---

### 10. Performance Issues

#### Slow page loads

**Solutions:**
```javascript
// Block unnecessary resources
await page.setRequestInterception(true);
page.on('request', req => {
  const blockList = ['image', 'stylesheet', 'font', 'media'];
  if (blockList.includes(req.resourceType())) {
    req.abort();
  } else {
    req.continue();
  }
});

// Use faster wait conditions
await page.goto(url, { waitUntil: 'domcontentloaded' });

// Disable images
const browser = await puppeteer.launch({
  args: ['--blink-settings=imagesEnabled=false']
});
```

#### High CPU usage

**Solutions:**
```javascript
// Limit concurrent operations
const limit = pLimit(2);

// Reduce animation/rendering
args: [
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
  '--disable-software-rasterizer'
]
```

---

## 🛠️ Diagnostic Tools

### Check System Resources

```bash
# Memory
free -h

# Disk
df -h

# Shared memory
df -h /dev/shm

# CPU
top -bn1 | head -20

# Chrome processes
ps aux | grep chrome
```

### Check Dependencies

```bash
# Check library
ldconfig -p | grep libglib

# List all Chrome dependencies
ldd /usr/bin/chromium-browser

# Check Chrome version
google-chrome --version
chromium-browser --version
```

### Debug Puppeteer

```javascript
// Enable debug logging
const browser = await puppeteer.launch({
  dumpio: true,  // Pipe browser process stdout/stderr
  headless: false // See what's happening
});

// Log all page events
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
page.on('pageerror', error => console.log('PAGE ERROR:', error));
page.on('response', response => 
  console.log('RESPONSE:', response.status(), response.url())
);
page.on('requestfailed', request =>
  console.log('FAILED:', request.failure().errorText, request.url())
);
```

---

## 📊 Common Error Code Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 127 | Command not found / Missing library | Install dependencies |
| -11 (SIGSEGV) | Segmentation fault | Increase memory, check flags |
| -6 (SIGABRT) | Abort signal | Check logs, reduce complexity |
| ECONNREFUSED | Connection refused | Check browser is running |
| ETIMEDOUT | Connection timeout | Increase timeout |
| ENOTFOUND | DNS resolution failed | Check network |

---

## 🚑 Emergency Recovery

If everything fails:

1. **Complete reset:**
```bash
npm run clean
rm -rf node_modules package-lock.json
sudo ./install-chrome-deps.sh
npm install
npm test
```

2. **Use official Docker image:**
```bash
docker pull ghcr.io/puppeteer/puppeteer:23.0.0
docker run -it ghcr.io/puppeteer/puppeteer:23.0.0 bash
```

3. **Minimal test:**
```javascript
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://example.com');
  console.log(await page.title());
  await browser.close();
})();
```

---

## 📞 Getting Help

1. Check error logs: `cat /tmp/puppeteer-errors.log`
2. Run diagnostics: `npm run diagnose`
3. Review test results: `npm test`
4. Check Puppeteer docs: https://pptr.dev/troubleshooting
5. Search GitHub issues: https://github.com/puppeteer/puppeteer/issues

---

## ✅ Prevention Checklist

- [ ] All system dependencies installed
- [ ] Sufficient memory (>2GB recommended)
- [ ] Shared memory configured (2GB for Docker)
- [ ] Proper timeout values set
- [ ] Error handling implemented
- [ ] Resources properly closed
- [ ] Running as non-root (Docker)
- [ ] Tests passing
- [ ] Health checks enabled
- [ ] Monitoring configured

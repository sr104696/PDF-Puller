# Add Puppeteer to Your Next.js App

## If Puppeteer is NOT in your package.json dependencies:

Add it:

```bash
npm install puppeteer
```

Your package.json should include:

```json
{
  "dependencies": {
    "puppeteer": "^23.0.0",
    // ... other dependencies
  }
}
```

## Already have Puppeteer?

Just make sure it's version 23+ for best compatibility:

```bash
npm install puppeteer@latest
```

## Alternative: Use puppeteer-core + Chrome

If you want to use system Chrome instead of downloading Chromium:

```bash
npm install puppeteer-core
```

Then in your code:

```typescript
import puppeteer from "puppeteer-core"

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome', // or chromium-browser
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
})
```

## For Alpine Linux / Smaller Docker Images

```bash
# Install Chromium via system package manager
apk add chromium

# Use puppeteer-core (doesn't download Chrome)
npm install puppeteer-core
```

Set environment variable:
```bash
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## Environment Variables (Optional)

Add to .env.local:

```bash
# Skip Chromium download (if using system Chrome)
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Use system Chrome
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
```

Then in your code:
```typescript
const browser = await puppeteer.launch({
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  // ... other options
})
```

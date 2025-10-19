# PDF Beans

A Next.js application that generates PDFs from archived web pages such as archive.ph, the Wayback Machine, and 12ft.io. The app uses Puppeteer/Chromium under the hood so you can run everything on your own infrastructure without relying on third-party PDF APIs.

## Features

- **Multi-archive support** – Pick between archive.ph, the Wayback Machine, or 12ft.io.
- **Resilient Chromium launch** – Tries multiple Puppeteer launch strategies (including the `--single-process` flag) and surfaces detailed diagnostics via response headers.
- **Self-hosted PDFs** – Generate PDFs entirely on your own server and download them directly from the browser.
- **Helpful tooling** – Includes scripts and documentation for installing the system dependencies that Chromium requires in minimal environments.

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Install Chromium system libraries** (if you are on a minimal server, CI, or container):

   ```bash
   chmod +x install-deps-simple.sh
   sudo ./install-deps-simple.sh
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser and generate a PDF by pasting the URL you want to archive.

## Environment Variables

- `PUPPETEER_EXECUTABLE_PATH` (optional) – Use this if you need Puppeteer to use a system-installed Chromium/Chrome instead of the bundled binary. This is helpful on Alpine or Docker images where you install `chromium` manually.

## Docker

A ready-to-use Dockerfile lives at `Dockerfile.nextjs`. Build with the `--shm-size=2gb` flag so Chromium has enough shared memory:

```bash
docker build -f Dockerfile.nextjs -t pdf-beans .
docker run -p 3000:3000 --shm-size=2gb pdf-beans
```

## Troubleshooting

- Run the included `install-deps-simple.sh` script if Chromium fails to launch with errors such as `libglib-2.0.so.0` or `libnspr4.so` missing.
- Check the `X-PDF-Beans-Launch-Strategy` response header to see which Puppeteer strategy successfully launched Chromium.
- See `START-HERE.md`, `SIMPLE-FIX-README.md`, and `PUPPETEER-SETUP.md` in this repository for deeper guidance on debugging Puppeteer environments.

## License

This project is provided as-is under the MIT license.

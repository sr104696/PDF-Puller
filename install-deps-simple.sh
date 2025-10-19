#!/bin/bash

# Simple Chrome Dependencies Installer
# Run this with: sudo bash install-deps-simple.sh

echo "Installing Chrome dependencies..."

# Detect OS
if [ -f /etc/debian_version ]; then
    echo "Detected Debian/Ubuntu system"
    
    apt-get update
    apt-get install -y \
        libglib2.0-0 \
        libnspr4 \
        libnss3 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libcups2 \
        libdrm2 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxrandr2 \
        libgbm1 \
        libasound2 \
        libpango-1.0-0 \
        libcairo2 \
        fonts-liberation
    
    echo "✓ Dependencies installed"
    
elif [ -f /etc/alpine-release ]; then
    echo "Detected Alpine Linux"
    
    apk add --no-cache \
        glib \
        nss \
        chromium
    
    echo "✓ Dependencies installed"
    echo "Note: Set PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser"
    
else
    echo "Unsupported OS. Please install manually:"
    echo "  libglib2.0-0, libnspr4, libnss3, libatk1.0-0, etc."
    exit 1
fi

echo ""
echo "Verifying installation..."
ldconfig -p | grep libglib && echo "✓ libglib found"
ldconfig -p | grep libnspr && echo "✓ libnspr found"
ldconfig -p | grep libnss && echo "✓ libnss found"

echo ""
echo "Installation complete! Try running your app again."

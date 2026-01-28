#!/bin/bash

# Create directory structure
mkdir -p ssl/certs

# Generate Self-Signed Certificate valid for 365 days
# This allows Nginx to start. Cloudflare "Full" mode accepts this.
echo "Generating Self-Signed SSL Certificates..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/certs/meenuin.key \
  -out ssl/certs/meenuin.crt \
  -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Meenuin/OU=Tech/CN=meenuin.biz.id"

echo "-----------------------------------"
echo "✅ SSL Certificates Generated in ./ssl/certs/"
echo "   - meenuin.key"
echo "   - meenuin.crt"
echo "-----------------------------------"
echo "👉 IMPORTANT: Ensure your Cloudflare SSL/TLS mode is set to 'FULL'."
echo "   (Do not use 'Strict' with this self-signed cert)"

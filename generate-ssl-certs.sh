#!/bin/bash

# SSL Certificate Generation Script for JSON Schema API Generator
# Author: Thomas Rieger <t.rieger@quickline.ch>

set -e

echo "🔒 Generating SSL certificates for HTTPS support..."

# Create SSL directory if it doesn't exist
mkdir -p ssl

# Generate private key
echo "🔑 Generating private key..."
openssl genrsa -out ssl/key.pem 2048

# Generate certificate signing request
echo "📝 Generating certificate signing request..."
openssl req -new -key ssl/key.pem -out ssl/cert.csr -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"

# Generate self-signed certificate
echo "📜 Generating self-signed certificate..."
openssl x509 -req -days 365 -in ssl/cert.csr -signkey ssl/key.pem -out ssl/cert.pem

# Set proper permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

# Clean up CSR file
rm ssl/cert.csr

echo "✅ SSL certificates generated successfully!"
echo ""
echo "📁 Files created:"
echo "   - ssl/cert.pem (Certificate)"
echo "   - ssl/key.pem (Private Key)"
echo ""
echo "🚀 To use HTTPS with Docker:"
echo "   1. Run: docker-compose --profile production up -d"
echo "   2. Access: https://localhost"
echo ""
echo "⚠️  Note: This is a self-signed certificate for development."
echo "   Your browser will show a security warning - click 'Advanced' and 'Proceed to localhost'"
echo ""
echo "🔒 For production, replace with certificates from a trusted CA."
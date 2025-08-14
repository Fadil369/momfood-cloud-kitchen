#!/bin/bash

# Deploy MomFood to Cloudflare Pages
# This script can be used for manual deployment

echo "🚀 Deploying MomFood to Cloudflare Pages..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Build the application
echo "📦 Building application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Cloudflare Pages
echo "🌐 Deploying to Cloudflare Pages..."
echo "👋 Please make sure you have:"
echo "   1. Cloudflare account setup"
echo "   2. wrangler login completed (run: wrangler login)"
echo "   3. Created a Cloudflare Pages project named 'momfood-cloud-kitchen'"
echo ""

# Deploy using wrangler
wrangler pages deploy dist --project-name=momfood-cloud-kitchen

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo "🌍 Your app is now live on Cloudflare Pages"
else
    echo "❌ Deployment failed. Please check your Cloudflare configuration."
    exit 1
fi
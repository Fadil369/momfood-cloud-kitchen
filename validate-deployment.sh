#!/bin/bash

# MomFood Cloudflare Deployment Validation Script
# This script validates that everything is ready for Cloudflare deployment

echo "🔍 Validating MomFood Cloudflare Deployment Setup..."
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if required files exist
echo ""
echo "📁 Checking required files..."

files_to_check=(
    "package.json"
    "wrangler.toml"
    "public/_routes.json"
    ".github/workflows/deploy.yml"
    "deploy.sh"
    "DEPLOYMENT.md"
    "functions/api/health.js"
)

all_files_exist=true
for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ ${GREEN}$file${NC}"
    else
        echo -e "  ❌ ${RED}$file (missing)${NC}"
        all_files_exist=false
    fi
done

# Check build
echo ""
echo "🔨 Testing build process..."
if npm run build > /dev/null 2>&1; then
    echo -e "  ✅ ${GREEN}Build successful${NC}"
    
    # Check if dist directory has required files
    if [ -f "dist/index.html" ] && [ -f "dist/_routes.json" ] && [ -d "dist/assets" ]; then
        echo -e "  ✅ ${GREEN}Build output contains required files${NC}"
    else
        echo -e "  ❌ ${RED}Build output missing required files${NC}"
        all_files_exist=false
    fi
else
    echo -e "  ❌ ${RED}Build failed${NC}"
    all_files_exist=false
fi

# Check Node.js version
echo ""
echo "🟢 Checking Node.js version..."
node_version=$(node --version)
if [[ $node_version =~ ^v1[89]\. ]] || [[ $node_version =~ ^v2[0-9]\. ]]; then
    echo -e "  ✅ ${GREEN}Node.js $node_version (compatible)${NC}"
else
    echo -e "  ⚠️  ${YELLOW}Node.js $node_version (recommend 18+)${NC}"
fi

# Check npm
echo ""
echo "📦 Checking npm..."
if command -v npm &> /dev/null; then
    npm_version=$(npm --version)
    echo -e "  ✅ ${GREEN}npm $npm_version${NC}"
else
    echo -e "  ❌ ${RED}npm not found${NC}"
    all_files_exist=false
fi

# Summary
echo ""
echo "📋 Validation Summary"
echo "===================="

if [ "$all_files_exist" = true ]; then
    echo -e "✅ ${GREEN}All checks passed! Ready for Cloudflare deployment.${NC}"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Set up Cloudflare account"
    echo "  2. Configure GitHub secrets (if using auto-deployment)"
    echo "  3. Run ./deploy.sh or push to main branch"
    echo "  4. Visit DEPLOYMENT.md for detailed instructions"
else
    echo -e "❌ ${RED}Some checks failed. Please fix the issues above.${NC}"
    exit 1
fi
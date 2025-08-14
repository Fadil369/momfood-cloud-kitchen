# Cloudflare Deployment Guide

This guide explains how to deploy the MomFood cloud kitchen platform to Cloudflare Pages and Workers.

## Prerequisites

1. **Cloudflare Account**: [Sign up for free](https://dash.cloudflare.com/sign-up)
2. **Node.js 18+**: Required for building the application
3. **Git**: For version control and automated deployments

## Quick Start

### Option 1: Automatic Deployment (Recommended)

The repository includes GitHub Actions for automatic deployment on every push to the main branch.

1. **Set up Cloudflare secrets in GitHub:**
   - Go to your GitHub repository settings
   - Navigate to "Secrets and variables" → "Actions"
   - Add these secrets:
     - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Pages and Workers permissions
     - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

2. **Get your Cloudflare credentials:**
   - **API Token**: Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) → Create Token → Custom Token
     - Zone permissions: Zone:Read, Zone:Edit
     - Account permissions: Cloudflare Pages:Edit
   - **Account ID**: Found in the right sidebar of any Cloudflare dashboard page

3. **Push to main branch:**
   ```bash
   git push origin main
   ```

The GitHub Action will automatically build and deploy your app to Cloudflare Pages.

### Option 2: Manual Deployment

1. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Build the application:**
   ```bash
   npm install
   npm run build
   ```

4. **Deploy to Cloudflare Pages:**
   ```bash
   wrangler pages deploy dist --project-name=momfood-cloud-kitchen
   ```

Or simply run the deployment script:
```bash
./deploy.sh
```

## Configuration Files

### `wrangler.toml`
Main configuration for Cloudflare deployment:
- Build command: `npm run build`
- Output directory: `dist`
- Node.js compatibility enabled
- Security headers configured

### `public/_routes.json`
Cloudflare Pages routing configuration for single-page application (SPA) support.

### `.github/workflows/deploy.yml`
GitHub Actions workflow for automatic deployment.

## Features Deployed

✅ **React 19 Application**: Modern React with TypeScript
✅ **Multi-role Interface**: Customer, Kitchen, Driver views
✅ **Arabic & English Support**: RTL layout and bilingual content
✅ **Local Storage Persistence**: Data persists across sessions
✅ **Mobile-responsive Design**: Optimized for all devices
✅ **Production Build**: Optimized bundle with code splitting

## Environment Configuration

### Production Environment
- **Node.js Version**: 18
- **Build Output**: Static files in `dist/` directory
- **Routing**: Client-side routing with fallback to `index.html`
- **Security**: CSP headers and security configurations enabled

### Development Environment
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build locally
```

## Domain Setup

### Custom Domain (Optional)
1. **Add your domain to Cloudflare:**
   - Add your domain to Cloudflare
   - Update nameservers at your domain registrar

2. **Configure Pages domain:**
   - Go to Cloudflare Pages dashboard
   - Select your project
   - Go to "Custom domains" tab
   - Add your domain

### SSL/TLS
Cloudflare automatically provides SSL certificates for your domain.

## Performance Optimizations

The deployed application includes:
- **Code Splitting**: React and UI components are split into separate chunks
- **Minification**: JavaScript and CSS are minified
- **Gzip Compression**: Assets are compressed for faster loading
- **CDN Distribution**: Cloudflare's global CDN for fast worldwide access

## Monitoring and Analytics

### Cloudflare Analytics
- Visit your Cloudflare Pages dashboard
- View traffic, performance, and error analytics
- Monitor Core Web Vitals and loading times

### Error Tracking
The application includes error boundaries to handle and display errors gracefully.

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Ensure Node.js 18+ is used
   - Check that all dependencies are installed: `npm ci`
   - Verify build command works locally: `npm run build`

2. **Routing Issues:**
   - Ensure `_routes.json` is in the `public/` directory
   - Check that all routes fallback to `index.html` for SPA behavior

3. **Icon Loading Issues:**
   - All Phosphor icons have been updated to use correct export names
   - If you add new icons, verify they exist in the package

4. **Authentication Errors:**
   - Verify Cloudflare API token has correct permissions
   - Check that account ID is correct
   - Ensure `wrangler login` was successful

### Getting Help

1. **Cloudflare Documentation**: [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
2. **GitHub Issues**: Report issues in this repository
3. **Cloudflare Community**: [Cloudflare Developers Discord](https://discord.cloudflare.com/)

## Advanced Configuration

### Workers Integration (Optional)

If you need serverless functions, you can add Cloudflare Workers:

1. Create a `functions/` directory in your project
2. Add Worker functions as JavaScript/TypeScript files
3. Deploy with: `wrangler pages deploy dist --project-name=momfood-cloud-kitchen`

### Environment Variables

Add environment variables in `wrangler.toml`:
```toml
[env.production.vars]
API_URL = "https://api.your-domain.com"
ANALYTICS_ID = "your-analytics-id"
```

### Custom Build Commands

Modify the build command in `wrangler.toml` if needed:
```toml
[build]
command = "npm run build && npm run post-build"
```

## Security

### Headers Configuration
Security headers are configured in `wrangler.toml`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### Content Security Policy
Consider adding CSP headers for additional security in production.

## Cost Considerations

Cloudflare Pages offers:
- **Free Tier**: 1 build per minute, 500 builds per month
- **Unlimited bandwidth** on free tier
- **Custom domains** included
- **Global CDN** included

For high-traffic applications, consider Cloudflare's paid plans for additional features and higher limits.

## Next Steps

1. **Set up monitoring**: Add error tracking and analytics
2. **Add custom domain**: Configure your domain with Cloudflare
3. **Enable Workers**: Add serverless functions if needed
4. **Configure CI/CD**: Set up additional environments (staging, preview)
5. **Add tests**: Include automated testing in your deployment pipeline

---

**Need help?** Create an issue in the repository or check the Cloudflare documentation for additional support.
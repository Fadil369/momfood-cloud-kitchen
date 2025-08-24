# Cloudflare Deployment Guide

This guide covers deploying the MomFood Cloud Kitchen platform to Cloudflare Pages (frontend) and Cloudflare Workers (backend API).

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally: `npm install -g wrangler`
3. **GitHub Repository**: Connected to your Cloudflare account

## Environment Setup

### 1. Get Cloudflare Credentials

```bash
# Login to Cloudflare via Wrangler
wrangler login

# Get your Account ID
wrangler whoami
```

### 2. Create KV Namespaces

```bash
# Create production KV namespaces
wrangler kv:namespace create "ORDERS_KV"
wrangler kv:namespace create "CUSTOMERS_KV" 
wrangler kv:namespace create "RESTAURANTS_KV"

# Create preview KV namespaces for development
wrangler kv:namespace create "ORDERS_KV" --preview
wrangler kv:namespace create "CUSTOMERS_KV" --preview
wrangler kv:namespace create "RESTAURANTS_KV" --preview
```

### 3. Create R2 Bucket (Optional - for image uploads)

```bash
# Create R2 bucket for images
wrangler r2 bucket create momfood-images
wrangler r2 bucket create momfood-images-preview
```

### 4. Update wrangler.toml

Update the `wrangler.toml` file with your actual KV namespace IDs:

```toml
[[kv_namespaces]]
binding = "ORDERS_KV"
preview_id = "your-actual-preview-kv-namespace-id"
id = "your-actual-production-kv-namespace-id"
```

## Frontend Deployment (Cloudflare Pages)

### Automatic Deployment via GitHub

1. **Connect Repository**:
   - Go to Cloudflare Dashboard → Pages
   - Click "Connect to Git"
   - Select your GitHub repository
   - Configure build settings:
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
     - **Root directory**: `/` (leave empty)

2. **Environment Variables**:
   Set these in Cloudflare Pages dashboard:
   ```
   VITE_API_URL=https://your-worker-domain.workers.dev
   VITE_ENVIRONMENT=production
   ```

3. **Custom Domain** (Optional):
   - Add your custom domain in Pages settings
   - Update DNS records as instructed

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy to Cloudflare Pages using Wrangler
wrangler pages deploy dist --project-name momfood-cloud-kitchen
```

## Backend Deployment (Cloudflare Workers)

### 1. Install Worker Dependencies

```bash
cd workers
npm install
```

### 2. Deploy Workers

```bash
# Deploy to staging
wrangler deploy --env staging

# Deploy to production
wrangler deploy --env production
```

### 3. Test the API

```bash
# Test the deployed worker
curl https://your-worker-domain.workers.dev/api/health
```

## GitHub Actions Setup

### 1. Add Secrets to GitHub Repository

Go to GitHub Repository → Settings → Secrets and variables → Actions:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

### 2. Generate Cloudflare API Token

1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Create Custom Token with these permissions:
   - **Zone:Zone:Read** (for your domain)
   - **Zone:Page Rules:Edit** (for Pages)
   - **Account:Cloudflare Workers:Edit** (for Workers)
   - **Zone:Zone Settings:Edit** (for DNS)

## Environment Configuration

### Development Environment

```bash
# Frontend development
npm run dev

# Worker development (in workers directory)
cd workers
npm run dev
```

### Environment Variables

#### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8787
VITE_ENVIRONMENT=development
```

#### Worker (wrangler.toml)
```toml
[env.production.vars]
ENVIRONMENT = "production"
API_BASE_URL = "https://your-domain.com"

[env.staging.vars]
ENVIRONMENT = "staging"
API_BASE_URL = "https://staging.your-domain.com"
```

## Database Setup (KV Storage)

### Initialize Mock Data

```bash
# Upload mock data to KV storage
wrangler kv:key put --binding=RESTAURANTS_KV "restaurants" --path=./src/lib/mockData-restaurants.json
wrangler kv:key put --binding=ORDERS_KV "orders" --path=./src/lib/mockData-orders.json
```

## Monitoring and Logging

### Worker Logs

```bash
# Stream worker logs
wrangler tail

# View specific deployment logs
wrangler tail --env production
```

### Analytics

- View analytics in Cloudflare Dashboard → Workers & Pages
- Monitor performance and usage metrics
- Set up alerts for errors and performance issues

## Troubleshooting

### Common Issues

1. **Build Errors**:
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Worker Deployment Errors**:
   ```bash
   # Check wrangler configuration
   wrangler whoami
   wrangler dev --local
   ```

3. **CORS Issues**:
   - Ensure worker includes proper CORS headers
   - Check API endpoint URLs in frontend configuration

### Performance Optimization

1. **Bundle Analysis**:
   ```bash
   npm run build -- --analyze
   ```

2. **Worker Optimization**:
   - Use KV caching for frequently accessed data
   - Implement proper error handling
   - Optimize API response sizes

## Security Considerations

1. **API Keys**: Never commit API keys to repository
2. **CORS**: Configure appropriate CORS policies
3. **Rate Limiting**: Implement rate limiting in workers
4. **Validation**: Validate all API inputs

## Scaling Considerations

1. **KV Limits**: Monitor KV storage usage
2. **Worker Limits**: Be aware of CPU time limits
3. **R2 Storage**: Monitor storage costs
4. **CDN**: Leverage Cloudflare's global CDN

## Support

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
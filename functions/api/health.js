// Cloudflare Pages Function for health check
// This will be available at /api/health

export async function onRequest(context) {
  const { request } = context;
  
  // Simple health check
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'MomFood Cloud Kitchen',
    uptime: process.uptime ? Math.floor(process.uptime()) : 'unknown',
    environment: 'production'
  };

  // Add CORS headers for API access
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  // Return health status
  return new Response(JSON.stringify(healthData, null, 2), {
    status: 200,
    headers: corsHeaders
  });
}
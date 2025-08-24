// Cloudflare Pages Functions middleware
export interface Env {
  // Environment variables will be available here
}

export const onRequest: PagesFunction<Env> = async (context) => {
  // Add security headers
  const response = await context.next()
  
  // Security headers for production
  const headers = new Headers(response.headers)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-XSS-Protection', '1; mode=block')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set(
    'Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
  )

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}
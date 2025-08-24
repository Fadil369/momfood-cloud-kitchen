/**
 * MomFood Cloud Kitchen - Cloudflare Worker
 * Handles API requests for the cloud kitchen platform
 */

export interface Env {
  ORDERS_KV: KVNamespace;
  CUSTOMERS_KV: KVNamespace;
  RESTAURANTS_KV: KVNamespace;
  IMAGES_BUCKET: R2Bucket;
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route API requests
      if (path.startsWith('/api/')) {
        return await handleApiRequest(request, env, path);
      }

      // For all other requests, return a simple message
      return new Response(
        JSON.stringify({
          message: 'MomFood Cloud Kitchen API',
          version: '1.0.0',
          endpoints: [
            '/api/orders',
            '/api/restaurants', 
            '/api/customers',
            '/api/drivers'
          ]
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
};

async function handleApiRequest(request: Request, env: Env, path: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Parse the API path
    const apiPath = path.replace('/api/', '');
    const [resource, id] = apiPath.split('/');

    switch (resource) {
      case 'orders':
        return await handleOrdersApi(request, env, id);
      
      case 'restaurants':
        return await handleRestaurantsApi(request, env, id);
      
      case 'customers':
        return await handleCustomersApi(request, env, id);
      
      case 'drivers':
        return await handleDriversApi(request, env, id);
      
      case 'health':
        return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      
      default:
        return new Response(
          JSON.stringify({ error: 'Not Found', message: `API endpoint ${resource} not found` }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'API Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
}

async function handleOrdersApi(request: Request, env: Env, id?: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  switch (request.method) {
    case 'GET': {
      if (id) {
        // Get specific order
        const order = await env.ORDERS_KV.get(id);
        if (!order) {
          return new Response(JSON.stringify({ error: 'Order not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        return new Response(order, {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } else {
        // Get all orders (implement pagination as needed)
        const orders = await env.ORDERS_KV.list();
        const orderData = await Promise.all(
          orders.keys.map(async (key) => {
            const data = await env.ORDERS_KV.get(key.name);
            return data ? JSON.parse(data) : null;
          })
        );
        return new Response(JSON.stringify(orderData.filter(Boolean)), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    case 'POST': {
      // Create new order
      const newOrder = await request.json();
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const orderWithId = { ...newOrder, id: orderId, createdAt: new Date().toISOString() };
      
      await env.ORDERS_KV.put(orderId, JSON.stringify(orderWithId));
      
      return new Response(JSON.stringify(orderWithId), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    case 'PUT': {
      // Update order
      if (!id) {
        return new Response(JSON.stringify({ error: 'Order ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      const updateData = await request.json();
      const existingOrder = await env.ORDERS_KV.get(id);
      
      if (!existingOrder) {
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      const updatedOrder = { ...JSON.parse(existingOrder), ...updateData, updatedAt: new Date().toISOString() };
      await env.ORDERS_KV.put(id, JSON.stringify(updatedOrder));
      
      return new Response(JSON.stringify(updatedOrder), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
  }
}

async function handleRestaurantsApi(_request: Request, _env: Env, _id?: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Implement restaurants API logic
  return new Response(JSON.stringify({ message: 'Restaurants API - Coming Soon' }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function handleCustomersApi(_request: Request, _env: Env, _id?: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Implement customers API logic
  return new Response(JSON.stringify({ message: 'Customers API - Coming Soon' }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function handleDriversApi(_request: Request, _env: Env, _id?: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Implement drivers API logic
  return new Response(JSON.stringify({ message: 'Drivers API - Coming Soon' }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
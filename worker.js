/**
 * MiTienda CDN Worker
 *
 * Serves images stored in Cloudflare R2 via cdn.mitienda.pe.
 * Supports on-the-fly resizing via Cloudflare Image Resizing (plan Pro+).
 *
 * URL patterns:
 *   https://cdn.mitienda.pe/tienda_000001/{hash}.jpg          → original
 *   https://cdn.mitienda.pe/tienda_000001/{hash}.jpg?w=320    → resized to 320px wide
 *   https://cdn.mitienda.pe/tienda_000001/{hash}.jpg?w=720&q=80&f=webp
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1); // strip leading /

    if (!key) {
      return new Response('Not Found', { status: 404 });
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Fetch object from R2
    const object = await env.R2_BUCKET.get(key);

    if (!object) {
      return new Response('Not Found', { status: 404 });
    }

    const contentType = object.httpMetadata?.contentType || 'image/jpeg';

    // On-the-fly resize via Cloudflare Image Resizing (requires Pro/Business plan)
    const width   = url.searchParams.get('w');
    const height  = url.searchParams.get('h');
    const quality = parseInt(url.searchParams.get('q') || '85', 10);
    const format  = url.searchParams.get('f') || 'auto';

    if ((width || height) && contentType.startsWith('image/') && contentType !== 'image/svg+xml') {
      const imageOptions = { quality, format };
      if (width)  imageOptions.width  = parseInt(width, 10);
      if (height) imageOptions.height = parseInt(height, 10);

      // Re-issue request through Cloudflare Image Resizing
      const resizeRequest = new Request(request.url, {
        cf: { image: imageOptions },
      });

      // Fetch original from R2 as a stream and pipe through Image Resizing
      const r2Url = `https://${url.hostname}/${key}`;
      return fetch(new Request(r2Url, resizeRequest), {
        cf: { image: imageOptions },
      });
    }

    // Serve original with long cache headers
    return new Response(object.body, {
      headers: {
        'Content-Type':                contentType,
        'Cache-Control':               'public, max-age=31536000, immutable',
        'ETag':                        object.etag,
        'Access-Control-Allow-Origin': '*',
        'Vary':                        'Accept',
      },
    });
  },
};

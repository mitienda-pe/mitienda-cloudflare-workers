# mitienda-cloudflare-workers

Cloudflare Workers para la infraestructura de MiTienda.

## Workers

### `cdn/` — MiTienda CDN

Sirve imágenes del bucket R2 `mitienda-images` vía `cdn.mitienda.pe`.

**Funcionalidades:**
- Sirve imágenes originales con headers `Cache-Control: immutable`
- Redimensionado on-the-fly via query params (`?w=320&q=80&f=webp`)
- Headers CORS para acceso desde frontends
- 404 limpio para objetos no encontrados

**URL patterns:**
```
# Imagen original
https://cdn.mitienda.pe/tienda_000001/{hash}.jpg

# Redimensionada (requiere plan Pro+ de Cloudflare)
https://cdn.mitienda.pe/tienda_000001/{hash}.jpg?w=320
https://cdn.mitienda.pe/tienda_000001/{hash}.jpg?w=720&q=80&f=webp
```

## Setup (una sola vez en Cloudflare Dashboard)

1. Crear bucket R2: `mitienda-images`
2. Verificar que el dominio `mitienda.pe` usa nameservers de Cloudflare
3. Agregar custom domain `cdn.mitienda.pe` al Worker (o al bucket R2)
4. Activar **Cloudflare Image Resizing** si se quiere resize on-the-fly (plan Pro+)

## Deploy

```bash
npm install
npm run deploy:cdn
```

## Desarrollo local

```bash
npm run dev:cdn
# Worker disponible en http://localhost:8787
```

## Variables de entorno del API (.env)

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_api_token_key
R2_SECRET_ACCESS_KEY=your_r2_api_token_secret
R2_BUCKET_NAME=mitienda-images
R2_PUBLIC_URL=https://cdn.mitienda.pe
```

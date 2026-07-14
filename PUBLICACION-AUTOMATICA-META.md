# Publicación automática en Instagram y Facebook

El planificador de `/panel/contenido` puede **publicar solo** en Instagram (feed y stories)
y en la Página de Facebook, usando la **Graph API de Meta**.

- **Instagram + Facebook** → publicación automática (botón "Publicar ahora" y programación por fecha).
- **TikTok y LinkedIn** → NO son de Meta: siguen siendo manuales (descargar la foto y subirla).
  Sus APIs (TikTok Content Posting API / LinkedIn API) son integraciones aparte.

Se publica siempre la **foto recortada al tamaño de la red** (`pub_url`), nunca la simulación con la interfaz.

---

## 1. Requisitos en Meta (una vez)

1. **Cuenta de Instagram Business o Creator**, vinculada a una **Página de Facebook**.
2. Una **app en [Meta for Developers](https://developers.facebook.com/)** (ya tienes una para Lead Ads).
3. La app necesita los permisos:
   - `instagram_content_publish`
   - `pages_manage_posts`
   - `pages_read_engagement`
   > En desarrollo funcionan para los usuarios que sean **administradores/probadores** de la app.
   > Para usarlo con cualquier cuenta hace falta pasar la **App Review** de Meta.
4. Genera un **Token de acceso de Página de larga duración** con esos permisos
   (Graph API Explorer → seleccionar la Página → generar token → convertirlo a long-lived).

## 2. Consigue los IDs

- **IG User ID**: `GET /me/accounts` → coge el `id` de la Página → `GET /{page-id}?fields=instagram_business_account`.
- **Page ID**: aparece en `GET /me/accounts` (el `id` de la Página).

## 3. Variables de entorno (Vercel → Settings → Environment Variables, y en `.env.local`)

```
META_PAGE_ACCESS_TOKEN=EAAG...   (con los 3 permisos de arriba)
META_IG_USER_ID=1784xxxxxxxxxxx
META_PAGE_ID=1023xxxxxxxxxxx
META_GRAPH_VERSION=v21.0
CRON_SECRET=un_secreto_que_inventes
```

## 4. Base de datos

Ejecuta (o vuelve a ejecutar) `supabase-contenido-social.sql` en Supabase → SQL Editor.
Es idempotente y añade las columnas nuevas (`pub_url`, `estado`, `programado_para`, etc.).

## 5. Programación automática (cron)

`vercel.json` ya define un cron cada 5 minutos que llama a `/api/cron-publish`.
Ese endpoint busca las piezas **programadas** cuya fecha ya pasó y las publica.
Vercel añade solo el header `Authorization: Bearer $CRON_SECRET`.

En local no hay cron: usa el botón **"Publicar ahora"** para probar.

---

## Cómo se usa

1. Monta la pieza en el simulador y pulsa **Programar** (fecha/hora) o **Guardar borrador**.
2. En el **planificador**:
   - **Publicar ahora** → publica al instante en Instagram/Facebook.
   - Programadas → se publican solas al llegar su hora (vía cron).
3. Al publicarse, la pieza pasa a estado **Publicado**.

## Notas y límites de Meta

- La imagen debe ser una **URL pública** (el bucket `contenido-social` es público: ✅).
- Instagram: feed admite proporciones 4:5 a 1.91:1; stories 9:16. El simulador ya exporta esos tamaños.
- Instagram limita el número de publicaciones por API a **25 al día** por cuenta.
- Si falta algún token/ID, el botón mostrará un mensaje claro indicando qué falta.

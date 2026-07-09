# Notificaciones de leads (speed-to-lead) — configuración

El código ya está listo (`src/app/api/notify-lead/route.ts`). Cuando entra un lead nuevo:

- **B6** → email instantáneo al **asesor** (con botones Llamar / WhatsApp / Ver en el panel).
- **B7** → email de **confirmación automática al lead** ("te llamamos en <24 h", con botón de WhatsApp para adelantarse).

Para activarlo hacen falta **3 cosas** (unos 10 minutos):

---

## 1. Cuenta de Resend (envío de emails)

1. Crea una cuenta gratis en [resend.com](https://resend.com) (100 emails/día gratis).
2. **Verifica tu dominio** (Domains → Add Domain → `dkv-ergo.es`) y crea una **API Key**.
   - Verificar el dominio es imprescindible para enviar al **lead** (B7). Mientras no lo verifiques, Resend solo deja enviar a tu propio correo (sirve para probar B6).
3. Copia la API Key.

## 2. Variables de entorno (en Vercel → Settings → Environment Variables, y en `.env.local`)

```env
RESEND_API_KEY=re_xxxxxxxxxxxx          # la API key de Resend
NOTIFY_SECRET=inventa_un_texto_secreto   # cualquier cadena aleatoria larga
NOTIFY_EMAIL=asesor@dkv-ergo.es          # a dónde llega el aviso al asesor (B6)
NOTIFY_FROM=DKV Seguros <no-reply@dkv-ergo.es>   # remitente (debe ser de tu dominio verificado)
NEXT_PUBLIC_WHATSAPP=34699669603         # (opcional) WhatsApp de empresa para los botones
```

> Redespliega en Vercel después de añadirlas.

## 3. Webhook de Supabase (dispara el aviso al insertar un lead)

Supabase Dashboard → **Database → Webhooks → Create a new hook**:

- **Name:** `notify-lead`
- **Table:** `leads`
- **Events:** `Insert`
- **Type:** HTTP Request → **POST**
- **URL:** `https://TU-APP.vercel.app/api/notify-lead`
- **HTTP Headers:** añade una cabecera
  - `x-notify-secret` = *(el mismo valor que pusiste en `NOTIFY_SECRET`)*

Guarda. A partir de ahí, **cada lead nuevo** (venga de la web, de la landing de anuncios o de Meta) dispara los dos emails automáticamente.

---

## Cómo probarlo

1. Rellena el formulario público con un email tuyo real.
2. Deberías recibir: (a) el aviso de asesor en `NOTIFY_EMAIL`, y (b) la confirmación en el email que pusiste como lead.
3. Si algo falla, mira los logs de la función `/api/notify-lead` en Vercel: el endpoint devuelve `{ ok:true, resultados:{ asesor:"enviado", lead:"enviado" } }` o el detalle del error.

## Mejora opcional (más adelante): confirmación por WhatsApp al lead

El email de confirmación es inmediato y gratis. Si quieres además enviar un **WhatsApp automático** al lead (aún mejor tasa de apertura), hace falta la **WhatsApp Cloud API** de Meta (número de WhatsApp Business + plantilla aprobada). Es un paso de configuración aparte; cuando lo tengáis, se añade un `fetch` a la Graph API en este mismo endpoint.

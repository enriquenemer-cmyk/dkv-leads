# DKV Leads – App de captación de seguros de salud

App web completa con dos lados:
- **`/`** — Landing pública con formulario de captación (sin login)
- **`/panel`** — CRM protegido para asesores (Supabase Auth)

Stack: Next.js 16 · TypeScript · Tailwind CSS · Supabase · Vercel

---

## 1. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New project
2. Anotar la **URL** y la **anon key** del proyecto (Settings → API)

---

## 2. Ejecutar el SQL en Supabase

1. Supabase Dashboard → **SQL Editor** → New query
2. Pegar y ejecutar todo el contenido de [`supabase-setup.sql`](./supabase-setup.sql)

Esto crea la tabla `leads` con todas las columnas y las políticas RLS correctas.

---

## 3. Crear el primer usuario asesor

En Supabase Dashboard → **Authentication** → Users → **Invite user** (o Add user):
- Correo: `asesor@tudominio.es`
- Contraseña: la que quieras

Con esto el asesor puede entrar en `/panel/login`.

---

## 4. Variables de entorno

Renombrar `.env.example` a `.env.local` y completar:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TUPROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
```

---

## 5. Correr localmente

```bash
npm install
npm run dev
```

- Formulario público: http://localhost:3000
- Panel de asesores: http://localhost:3000/panel/login

---

## 6. Desplegar en Vercel

1. Subir el repo a GitHub
2. Ir a [vercel.com](https://vercel.com) → New Project → importar el repo
3. En **Environment Variables** añadir:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

Vercel generará dos URLs (son la misma app con rutas `/` y `/panel`).

---

## Funcionalidades

| Función | Estado |
|---|---|
| Formulario público responsive | ✅ |
| Página de gracias personalizada | ✅ |
| Login con Supabase Auth | ✅ |
| Dashboard con métricas y embudo | ✅ |
| Panel de leads con búsqueda y filtros | ✅ |
| Detalle de lead con acciones rápidas | ✅ |
| WhatsApp / Correo / Llamar links | ✅ |
| Calificación por etiqueta | ✅ |
| Notas por lead | ✅ |
| Recordatorios con fecha | ✅ |
| Alta y edición manual de leads | ✅ |
| Exportar a CSV (Excel) | ✅ |
| Tiempo real (Supabase Realtime) | ✅ |

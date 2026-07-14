// ============================================================
//  Publicación automática en Instagram y Facebook (Graph API)
//  Publica la FOTO recortada (pub_url) — nunca la simulación.
//  Requiere en el entorno:
//    META_PAGE_ACCESS_TOKEN  (con permisos instagram_content_publish + pages_manage_posts)
//    META_IG_USER_ID         (id de la cuenta de Instagram Business)
//    META_PAGE_ID            (id de la Página de Facebook)
//    META_GRAPH_VERSION      (opcional, por defecto v21.0)
// ============================================================

const GV = process.env.META_GRAPH_VERSION || 'v21.0'
const graph = (path: string) => `https://graph.facebook.com/${GV}/${path}`

export type PublicablePlatform = 'ig-feed' | 'ig-story' | 'facebook'
export const AUTO_PUBLICABLES: PublicablePlatform[] = ['ig-feed', 'ig-story', 'facebook']

export interface PublishInput {
  platform: string
  imageUrl: string   // URL pública de la foto lista (pub_url)
  caption: string
}
export interface PublishResult {
  ok: boolean
  network?: 'instagram' | 'facebook'
  postId?: string
  postUrl?: string
  error?: string
}

async function graphPost(path: string, params: Record<string, string>): Promise<any> {
  const body = new URLSearchParams(params)
  const res = await fetch(graph(path), { method: 'POST', body })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.error) {
    const msg = json?.error?.message || `Error HTTP ${res.status}`
    throw new Error(msg)
  }
  return json
}

/** Instagram: 1) crear contenedor de media, 2) publicarlo. */
async function publishInstagram(input: PublishInput, token: string, igUserId: string): Promise<PublishResult> {
  const container: Record<string, string> = { image_url: input.imageUrl, access_token: token }
  if (input.caption) container.caption = input.caption
  if (input.platform === 'ig-story') container.media_type = 'STORIES'

  const created = await graphPost(`${igUserId}/media`, container)
  const creationId = created.id as string

  // Las imágenes suelen estar listas al instante; damos un pequeño margen por si acaso.
  const published = await graphPost(`${igUserId}/media_publish`, { creation_id: creationId, access_token: token })
  const postId = published.id as string
  return { ok: true, network: 'instagram', postId, postUrl: `https://www.instagram.com/` }
}

/** Facebook: publica una foto en la Página. */
async function publishFacebook(input: PublishInput, token: string, pageId: string): Promise<PublishResult> {
  const params: Record<string, string> = { url: input.imageUrl, access_token: token, published: 'true' }
  if (input.caption) params.caption = input.caption
  const res = await graphPost(`${pageId}/photos`, params)
  const postId = (res.post_id || res.id) as string
  return { ok: true, network: 'facebook', postId, postUrl: postId ? `https://www.facebook.com/${postId}` : undefined }
}

/** Publica una pieza según su red. Lanza error con mensaje claro si falta configuración. */
export async function publishToMeta(input: PublishInput): Promise<PublishResult> {
  const token = process.env.META_PAGE_ACCESS_TOKEN
  if (!token) throw new Error('Falta META_PAGE_ACCESS_TOKEN en el entorno.')

  if (input.platform === 'ig-feed' || input.platform === 'ig-story') {
    const igUserId = process.env.META_IG_USER_ID
    if (!igUserId) throw new Error('Falta META_IG_USER_ID (id de la cuenta de Instagram Business).')
    return publishInstagram(input, token, igUserId)
  }
  if (input.platform === 'facebook') {
    const pageId = process.env.META_PAGE_ID
    if (!pageId) throw new Error('Falta META_PAGE_ID (id de la Página de Facebook).')
    return publishFacebook(input, token, pageId)
  }
  throw new Error('Esta red no admite publicación automática (solo Instagram y Facebook). TikTok y LinkedIn son manuales.')
}

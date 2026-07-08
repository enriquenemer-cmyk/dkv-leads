// Quita la atribución técnica (dispositivo, UTM, origen) del texto de interés
// para mostrarlo limpio al asesor. La info sigue guardada en la BD; solo no se muestra.
export function limpiarInteres(interes: string | null | undefined): string {
  if (!interes) return ''
  return interes
    .replace(/\s*·?\s*origen:.*$/i, '') // quita "· origen: disp=movil · utm=..."
    .replace(/\bdisp=\w+/gi, '')         // por si quedara suelto
    .replace(/·\s*·/g, '·')              // colapsa separadores duplicados "· ·"
    .replace(/\s*·\s*$/, '')             // quita separador colgante al final
    .trim()
}

/* ─────────────────────────────────────────────────────────────
   Datos del RESPONSABLE del sitio, usados en las páginas legales.
   ⚠️ COMPLETA/REVISA los campos marcados con «COMPLETAR» antes de
   dar difusión al sitio: son obligatorios por RGPD/LSSI-CE.
   ───────────────────────────────────────────────────────────── */
export const TITULAR = {
  nombre: 'Kdental Excellent, S.L.',     // nombre fiscal de la empresa (CIF B86801594)
  nif: 'B-86801594',                     // CIF de la empresa
  domicilio: 'C/ Príncipe de Vergara 80, 28006 Madrid',
  email: 'info@dkv-ergo.es',             // revisa que esta cuenta exista o cámbiala
  telefono: '+34 699 669 603',
  dominio: 'dkv-ergo.es',
  actividad: 'mediación y asesoramiento en la contratación de seguros de salud',
}

export const ACTUALIZADO = 'julio de 2026'

/* Muestra el valor solo si está completado; si sigue como placeholder,
   devuelve un texto neutro para que la web no muestre «[COMPLETAR...]». */
export const shown = (v: string) => (v.includes('[COMPLETAR') ? 'disponible a solicitud' : v)

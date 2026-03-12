/**
 * Valida el formulario de compra
 * Sincronizado con backend/app/schemas.py PurchaseRequest
 */
export function isPurchaseFormValid(form) {
  const errors = []

  // customer_id: int > 0
  if (!form.customer_id || form.customer_id <= 0) {
    errors.push('Debe seleccionar un cliente xxxx')
  }

  // track_ids: list con al menos 1 elemento
  if (!form.track_ids || !Array.isArray(form.track_ids) || form.track_ids.length === 0) {
    errors.push('Debe seleccionar al menos una canción')
  }

  // quantity: int > 0 (opcional, default 1)
  if (form.quantity !== undefined && form.quantity <= 0) {
    errors.push('La cantidad debe ser mayor a 0')
  }

  // billing_address: 3-70 caracteres
  if (form.billing_address && (form.billing_address.length < 3 || form.billing_address.length > 70)) {
    errors.push('La dirección debe tener entre 3 y 70 caracteres')
  }

  // billing_city: 2-40 caracteres
  if (form.billing_city && (form.billing_city.length < 2 || form.billing_city.length > 40)) {
    errors.push('La ciudad debe tener entre 2 y 40 caracteres')
  }

  // billing_country: 2-40 caracteres
  if (form.billing_country && (form.billing_country.length < 2 || form.billing_country.length > 40)) {
    errors.push('El país debe tener entre 2 y 40 caracteres')
  }

  // billing_postal_code: 3-10 caracteres
  if (form.billing_postal_code && (form.billing_postal_code.length < 3 || form.billing_postal_code.length > 10)) {
    errors.push('El código postal debe tener entre 3 y 10 caracteres')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Valida los filtros de búsqueda de tracks
 */
export function isSearchValid(filters) {
  // Al menos un filtro debe tener valor
  return Boolean(filters.q || filters.artist || filters.genre)
}

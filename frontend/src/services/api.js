const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}
const API_BASE_URL = env.VITE_API_URL || 'http://localhost:8000/api'

export async function fetchCustomers() {
  const response = await fetch(`${API_BASE_URL}/store/customers`)
  if (!response.ok) throw new Error('No se pudo cargar clientes')
  return response.json()
}

export async function searchTracks(params = {}) {
  const query = new URLSearchParams(params)
  const response = await fetch(`${API_BASE_URL}/store/tracks/search?${query.toString()}`)
  if (!response.ok) throw new Error('No se pudo buscar canciones')
  return response.json()
}

export async function createPurchase(payload) {
  const response = await fetch(`${API_BASE_URL}/store/purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'No se pudo registrar la compra')
  }

  return response.json()
}

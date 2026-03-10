import test from 'node:test'
import assert from 'node:assert/strict'

import { createPurchase, fetchCustomers, searchTracks } from '../src/services/api.js'
import { isPurchaseFormValid } from '../src/utils/validation.js'

// ==================== TESTS PARA fetchCustomers ====================

test('fetchCustomers retorna data cuando fetch es exitoso', async () => {
  global.fetch = async () => ({ ok: true, json: async () => [{ customer_id: 1 }] })
  const data = await fetchCustomers()
  assert.equal(data[0].customer_id, 1)
})

test('fetchCustomers lanza error cuando fetch falla', async () => {
  global.fetch = async () => ({ ok: false })
  await assert.rejects(() => fetchCustomers(), /No se pudo cargar clientes/)
})

// ==================== TESTS PARA searchTracks ====================

test('searchTracks arma query correctamente', async () => {
  let url = ''
  global.fetch = async (input) => {
    url = input
    return { ok: true, json: async () => [] }
  }
  await searchTracks({ q: 'abc' })
  assert.match(url, /q=abc/)
})

test('searchTracks filtra parámetros vacíos', async () => {
  let url = ''
  global.fetch = async (input) => {
    url = input
    return { ok: true, json: async () => [] }
  }
  await searchTracks({ q: 'rock', artist: '', genre: '' })
  assert.match(url, /q=rock/)
  assert.ok(!url.includes('artist='))
  assert.ok(!url.includes('genre='))
})

test('searchTracks lanza error cuando fetch falla', async () => {
  global.fetch = async () => ({ ok: false })
  await assert.rejects(() => searchTracks({ q: 'test' }), /No se pudo buscar canciones/)
})

// ==================== TESTS PARA createPurchase ====================

test('createPurchase lanza error con detalle del servidor', async () => {
  global.fetch = async () => ({ ok: false, json: async () => ({ detail: 'Track no encontrado' }) })
  await assert.rejects(() => createPurchase({}), /Track no encontrado/)
})

test('createPurchase lanza error genérico si no hay detalle', async () => {
  global.fetch = async () => ({ ok: false, json: async () => ({}) })
  await assert.rejects(() => createPurchase({}), /No se pudo registrar la compra/)
})

test('createPurchase retorna data cuando es exitoso', async () => {
  global.fetch = async () => ({ ok: true, json: async () => ({ invoice_id: 1, total: 2.99 }) })
  const data = await createPurchase({ customer_id: 1, track_ids: [1] })
  assert.equal(data.invoice_id, 1)
  assert.equal(data.total, 2.99)
})

// ==================== TESTS PARA isPurchaseFormValid ====================

test('isPurchaseFormValid retorna inválido sin customer_id', () => {
  const result = isPurchaseFormValid({ customer_id: '', track_ids: [1] })
  assert.equal(result.isValid, false)
  assert.ok(result.errors.some(e => e.includes('cliente')))
})

test('isPurchaseFormValid retorna inválido sin tracks', () => {
  const result = isPurchaseFormValid({ customer_id: 1, track_ids: [] })
  assert.equal(result.isValid, false)
  assert.ok(result.errors.some(e => e.includes('canción')))
})

test('isPurchaseFormValid retorna válido con datos correctos', () => {
  const result = isPurchaseFormValid({
    customer_id: 1,
    track_ids: [1, 2],
    quantity: 1,
  })
  assert.equal(result.isValid, true)
  assert.equal(result.errors.length, 0)
})

test('isPurchaseFormValid valida longitud de billing_address', () => {
  const result = isPurchaseFormValid({
    customer_id: 1,
    track_ids: [1],
    billing_address: 'AB', // muy corto (mínimo 3)
  })
  assert.equal(result.isValid, false)
  assert.ok(result.errors.some(e => e.includes('dirección')))
})

test('isPurchaseFormValid valida cantidad mayor a 0', () => {
  const result = isPurchaseFormValid({
    customer_id: 1,
    track_ids: [1],
    quantity: 0,
  })
  assert.equal(result.isValid, false)
  assert.ok(result.errors.some(e => e.includes('cantidad')))
})

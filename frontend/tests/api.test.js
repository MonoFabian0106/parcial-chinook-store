import test from 'node:test'
import assert from 'node:assert/strict'

import { createPurchase, fetchCustomers, searchTracks } from '../src/services/api.js'
import { isPurchaseFormValid } from '../src/utils/validation.js'

test('fetchCustomers retorna data', async () => {
  global.fetch = async () => ({ ok: true, json: async () => [{ customer_id: 1 }] })
  const data = await fetchCustomers()
  assert.equal(data[0].customer_id, 1)
})

test('searchTracks arma query', async () => {
  let url = ''
  global.fetch = async (input) => {
    url = input
    return { ok: true, json: async () => [] }
  }
  await searchTracks({ q: 'abc' })
  assert.match(url, /q=abc/)
})

test('createPurchase lanza error', async () => {
  global.fetch = async () => ({ ok: false, json: async () => ({ detail: 'error' }) })
  await assert.rejects(() => createPurchase({}), /error/)
})

test('isPurchaseFormValid valida campos requeridos', () => {
  assert.equal(isPurchaseFormValid({ customer_id: '', track_id: '' }), false)
  assert.equal(
    isPurchaseFormValid({
      customer_id: 1,
      track_id: 2,
      billing_address: 'A',
      billing_city: 'B',
      billing_country: 'C',
      billing_postal_code: 'D',
    }),
    true,
  )
})

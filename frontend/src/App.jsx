import { useEffect, useState } from 'react'
import './App.css'
import { createPurchase, fetchCustomers, searchTracks } from './services/api'
import { isPurchaseFormValid } from './utils/validation'

const initialForm = {
  customer_id: '',
  track_id: '',
  quantity: 1,
  billing_address: '',
  billing_city: '',
  billing_country: '',
  billing_postal_code: '',
}

function App() {
  const [customers, setCustomers] = useState([])
  const [tracks, setTracks] = useState([])
  const [filters, setFilters] = useState({ q: '', artist: '', genre: '' })
  const [form, setForm] = useState(initialForm)
  const [alert, setAlert] = useState({ type: '', message: '' })

  useEffect(() => {
    fetchCustomers().then(setCustomers).catch((error) => setAlert({ type: 'error', message: error.message }))
  }, [])

  const onSearch = async (event) => {
    event.preventDefault()
    try {
      const data = await searchTracks(filters)
      setTracks(data)
      setAlert({ type: 'success', message: `Se encontraron ${data.length} canciones.` })
    } catch (error) {
      setAlert({ type: 'error', message: error.message })
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()

    if (!isPurchaseFormValid(form)) {
      setAlert({ type: 'error', message: 'Completa todos los campos de compra.' })
      return
    }

    try {
      const payload = {
        ...form,
        customer_id: Number(form.customer_id),
        track_id: Number(form.track_id),
        quantity: Number(form.quantity),
      }
      const result = await createPurchase(payload)
      setAlert({ type: 'success', message: `Compra exitosa. Factura #${result.invoice_id}` })
      setForm(initialForm)
    } catch (error) {
      setAlert({ type: 'error', message: error.message })
    }
  }

  return (
    <main className="container">
      <h1>Chinook Store</h1>
      <p>Busca canciones por nombre, artista o género y registra compras de clientes.</p>

      {alert.message && <div className={`alert ${alert.type}`}>{alert.message}</div>}

      <section>
        <h2>Búsqueda de canciones</h2>
        <form className="grid" onSubmit={onSearch}>
          <input placeholder="Canción" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          <input placeholder="Artista" value={filters.artist} onChange={(e) => setFilters({ ...filters, artist: e.target.value })} />
          <input placeholder="Género" value={filters.genre} onChange={(e) => setFilters({ ...filters, genre: e.target.value })} />
          <button type="submit">Buscar</button>
        </form>

        <ul>
          {tracks.map((track) => (
            <li key={track.track_id}>
              #{track.track_id} - {track.track_name} | {track.artist_name || 'Sin artista'} | {track.genre_name || 'Sin género'} | ${track.unit_price}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Registrar compra</h2>
        <form className="grid" onSubmit={onSubmit}>
          <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
            <option value="">Selecciona cliente</option>
            {customers.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>

          <input
            placeholder="ID Canción"
            value={form.track_id}
            onChange={(e) => setForm({ ...form, track_id: e.target.value })}
          />
          <input
            type="number"
            min="1"
            max="10"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <input placeholder="Dirección" value={form.billing_address} onChange={(e) => setForm({ ...form, billing_address: e.target.value })} />
          <input placeholder="Ciudad" value={form.billing_city} onChange={(e) => setForm({ ...form, billing_city: e.target.value })} />
          <input placeholder="País" value={form.billing_country} onChange={(e) => setForm({ ...form, billing_country: e.target.value })} />
          <input
            placeholder="Código postal"
            value={form.billing_postal_code}
            onChange={(e) => setForm({ ...form, billing_postal_code: e.target.value })}
          />
          <button type="submit">Comprar canción</button>
        </form>
      </section>
    </main>
  )
}

export default App

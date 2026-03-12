import { useState, useEffect } from 'react'
import './App.css'

import TrackSearch from './components/TrackSearch'

import { searchTracks, fetchCustomers } from './services/api'

function App() {

  const [tracks, setTracks] = useState([])
  const [customers, setCustomers] = useState([])
  const [filters, setFilters] = useState({ q: '', artist: '', genre: '' })
  const [alert, setAlert] = useState({ type: '', message: '' })
  const [isLoading, setIsLoading] = useState(false)

  // Cargar clientes al inicio
  useEffect(() => {
    fetchCustomers()
      .then(setCustomers)
      .catch(err => console.error('Error cargando clientes:', err))
  }, [])

  const onSearch = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setAlert({ type: '', message: '' })

    try {
      const data = await searchTracks(filters)
      setTracks(data)

      setAlert({
        type: 'success',
        message: `Se encontraron ${data.length} canciones`
      })

    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container">

      <h1>Chinook Tienda</h1>

      {alert.message && (
        <div className={`alert ${alert.type}`}>
          {alert.message}
        </div>
      )}

      <TrackSearch
        filters={filters}
        setFilters={setFilters}
        tracks={tracks}
        onSearch={onSearch}
        isLoading={isLoading}
        customers={customers}
      />

    </main>
  )
}

export default App
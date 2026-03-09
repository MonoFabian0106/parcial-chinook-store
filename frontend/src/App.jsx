import { useEffect, useState } from 'react'
import './App.css'

import TrackSearch from './components/TrackSearch'

import { fetchCustomers, searchTracks } from './services/api'

function App() {

  const [tracks, setTracks] = useState([])
  const [filters, setFilters] = useState({ q: '', artist: '', genre: '' })
  const [alert, setAlert] = useState({ type: '', message: '' })

  const onSearch = async (event) => {
    event.preventDefault()

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

    }
  }

  return (
    <main className="container">

      <h1>Chinook Store</h1>

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
      />

    </main>
  )
}

export default App
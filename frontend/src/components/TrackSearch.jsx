import { useState } from "react"

function TrackSearch({ filters, setFilters, tracks, onSearch }) {

  const [selectedTracks, setSelectedTracks] = useState([])

  const addTrack = (track) => {
    const exists = selectedTracks.find(t => t.track_id === track.track_id)
    if (!exists) {
      setSelectedTracks([...selectedTracks, track])
    }
  }

  const removeTrack = (track_id) => {
    setSelectedTracks(selectedTracks.filter(t => t.track_id !== track_id))
  }

  // === Función de compra corregida para enviar LISTA ===
  const buyTracks = async () => {
    if (selectedTracks.length === 0) return;

    // Creamos el array de IDs de las canciones seleccionadas
    const trackIds = selectedTracks.map(track => track.track_id);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/store/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customer_id: 1, // Usuario por defecto
          track_ids: trackIds, // Enviamos la lista completa
          quantity: 1,
          billing_address: "Calle Falsa 123",
          billing_city: "Madrid",
          billing_country: "España",
          billing_postal_code: "28001"
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Detalle del error:", data.detail)
        throw new Error("Error en la respuesta del servidor")
      }

      alert(`Compra realizada con éxito. Total: $${data.total}`)
      setSelectedTracks([])

    } catch (error) {
      alert("Error al procesar la compra. Revisa la consola.")
      console.error(error)
    }
  }

  return (
    <section>
      <h2>Buscar canciones</h2>

      <form className="search-form" onSubmit={onSearch}>
        <input
          placeholder="Canción"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />
        <input
          placeholder="Artista"
          value={filters.artist}
          onChange={(e) => setFilters({ ...filters, artist: e.target.value })}
        />
        <input
          placeholder="Género"
          value={filters.genre}
          onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
        />
        <button type="submit">Buscar</button>
      </form>

      <div className="tracks-container">
        {/* RESULTADOS */}
        <div className="results">
          <h3>Resultados</h3>
          <ul className="track-list">
            {tracks.map((track) => (
              <li
                key={track.track_id}
                onClick={() => addTrack(track)}
                style={{ cursor: 'pointer' }}
              >
                #{track.track_id} - {track.track_name} | {track.artist_name} | ${track.unit_price}
              </li>
            ))}
          </ul>
        </div>

        {/* SELECCIONADAS */}
        <div className="selected">
          <h3>Seleccionadas</h3>

          {selectedTracks.length === 0 && <p>No hay canciones seleccionadas</p>}

          <ul className="selected-list">
            {selectedTracks.map((track) => (
              <li key={track.track_id}>
                {track.track_name} | ${track.unit_price}
                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTrack(track.track_id)
                  }}
                >
                  X
                </button>
              </li>
            ))}
          </ul>

          {selectedTracks.length > 0 && (
            <button
              className="buy-btn"
              onClick={buyTracks}
            >
              Comprar canciones ({selectedTracks.length})
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default TrackSearch
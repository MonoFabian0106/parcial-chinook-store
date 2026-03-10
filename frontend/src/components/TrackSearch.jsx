import { useState } from "react"
import { createPurchase } from "../services/api"
import { isPurchaseFormValid } from "../utils/validation"

function TrackSearch({ filters, setFilters, tracks, onSearch, isLoading, customers = [] }) {

  const [selectedTracks, setSelectedTracks] = useState([])
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [validationErrors, setValidationErrors] = useState([])

  const addTrack = (track) => {
    const exists = selectedTracks.find(t => t.track_id === track.track_id)
    if (!exists) {
      setSelectedTracks([...selectedTracks, track])
    }
  }

  const removeTrack = (track_id) => {
    setSelectedTracks(selectedTracks.filter(t => t.track_id !== track_id))
  }

  const calculateTotal = () => {
    return selectedTracks.reduce((sum, track) => sum + parseFloat(track.unit_price || 0), 0).toFixed(2)
  }

  const buyTracks = async () => {
    setValidationErrors([])
    
    const payload = {
      customer_id: parseInt(selectedCustomerId) || 0,
      track_ids: selectedTracks.map(track => track.track_id),
      quantity: 1
    }

    // Validar antes de enviar
    const validation = isPurchaseFormValid(payload)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    setIsPurchasing(true)

    try {
      const data = await createPurchase(payload)

      alert(`✅ Compra realizada con éxito!\nTotal: $${data.total}`)
      setSelectedTracks([])
      setSelectedCustomerId('')

    } catch (error) {
      alert(`❌ ${error.message}`)
      console.error(error)
    } finally {
      setIsPurchasing(false)
    }
  }

  return (
    <section className="search-section">
      <h2>Buscar canciones</h2>

      <form className="search-form" onSubmit={onSearch}>
        <div className="input-group">
          <input
            type="text"
            placeholder="Nombre de la canción..."
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
          <label>Canción</label>
        </div>
        <div className="input-group">
          <input
            type="text"
            placeholder="Nombre del artista..."
            value={filters.artist}
            onChange={(e) => setFilters({ ...filters, artist: e.target.value })}
          />
          <label>Artista</label>
        </div>
        <div className="input-group">
          <input
            type="text"
            placeholder="Rock, Pop, Jazz..."
            value={filters.genre}
            onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
          />
          <label>Género</label>
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Buscando...
            </>
          ) : (
            <>
              <span>🔍</span>
              Buscar
            </>
          )}
        </button>
      </form>

      <div className="tracks-container">
        {/* RESULTADOS */}
        <div className="results">
          <h3>Resultados ({tracks.length})</h3>
          
          {tracks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎵</div>
              <p className="empty-state-text">Busca canciones por nombre, artista o género</p>
            </div>
          ) : (
            <ul className="track-list">
              {tracks.map((track) => (
                <li
                  key={track.track_id}
                  onClick={() => addTrack(track)}
                >
                  <span className="track-name">{track.track_name}</span>
                  <div className="track-info">
                    <span>{track.artist_name}</span>
                    <span>•</span>
                    <span className="track-price">${track.unit_price}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* SELECCIONADAS */}
        <div className="selected">
          <h3>Carrito ({selectedTracks.length})</h3>

          {selectedTracks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <p className="empty-state-text">Haz clic en una canción para agregarla</p>
            </div>
          ) : (
            <>
              {/* Selector de cliente */}
              <div className="customer-select">
                <label htmlFor="customer">Cliente:</label>
                <select
                  id="customer"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="select-input"
                >
                  <option value="">Seleccionar cliente...</option>
                  {customers.map((customer) => (
                    <option key={customer.customer_id} value={customer.customer_id}>
                      {customer.first_name} {customer.last_name} ({customer.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Errores de validación */}
              {validationErrors.length > 0 && (
                <div className="validation-errors">
                  {validationErrors.map((error, index) => (
                    <p key={index} className="error-message">⚠️ {error}</p>
                  ))}
                </div>
              )}

              <ul className="selected-list">
                {selectedTracks.map((track) => (
                  <li key={track.track_id}>
                    <div className="selected-track-info">
                      <span className="selected-track-name">{track.track_name}</span>
                      <span className="selected-track-price">${track.unit_price}</span>
                    </div>
                    <button
                      className="btn-danger-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeTrack(track.track_id)
                      }}
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>

              <div className="cart-total">
                <span className="cart-total-label">Total</span>
                <span className="cart-total-amount">${calculateTotal()}</span>
              </div>

              <button
                className="btn btn-success"
                onClick={buyTracks}
                disabled={isPurchasing}
              >
                {isPurchasing ? (
                  <>
                    <span className="spinner"></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <span>💳</span>
                    Comprar ({selectedTracks.length} {selectedTracks.length === 1 ? 'canción' : 'canciones'})
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default TrackSearch
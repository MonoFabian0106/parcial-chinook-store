import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TrackSearch from '../src/components/TrackSearch'

// Mock del servicio api
vi.mock('../src/services/api', () => ({
  createPurchase: vi.fn(),
}))

import { createPurchase } from '../src/services/api'

describe('TrackSearch Component', () => {
  const defaultProps = {
    filters: { q: '', artist: '', genre: '' },
    setFilters: vi.fn(),
    tracks: [],
    onSearch: vi.fn((e) => e.preventDefault()),
    isLoading: false,
    customers: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==================== TESTS DE RENDERIZADO ====================

  it('renderiza el título correctamente', () => {
    render(<TrackSearch {...defaultProps} />)
    expect(screen.getByText('Buscar canciones')).toBeInTheDocument()
  })

  it('renderiza los campos de búsqueda', () => {
    render(<TrackSearch {...defaultProps} />)
    expect(screen.getByPlaceholderText('Nombre de la canción...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nombre del artista...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Rock, Pop, Jazz...')).toBeInTheDocument()
  })

  it('renderiza el botón de búsqueda', () => {
    render(<TrackSearch {...defaultProps} />)
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay resultados', () => {
    render(<TrackSearch {...defaultProps} />)
    expect(screen.getByText('Busca canciones por nombre, artista o género')).toBeInTheDocument()
  })

  // ==================== TESTS DE INTERACCIÓN ====================

  it('actualiza filtros cuando el usuario escribe', () => {
    const setFilters = vi.fn()
    render(<TrackSearch {...defaultProps} setFilters={setFilters} />)

    const input = screen.getByPlaceholderText('Nombre de la canción...')
    fireEvent.change(input, { target: { value: 'Rock' } })

    expect(setFilters).toHaveBeenCalledWith({ q: 'Rock', artist: '', genre: '' })
  })

  it('llama onSearch cuando se envía el formulario', () => {
    const onSearch = vi.fn((e) => e.preventDefault())
    render(<TrackSearch {...defaultProps} onSearch={onSearch} />)

    const form = screen.getByRole('button', { name: /buscar/i }).closest('form')
    fireEvent.submit(form)

    expect(onSearch).toHaveBeenCalled()
  })

  it('muestra spinner cuando isLoading es true', () => {
    render(<TrackSearch {...defaultProps} isLoading={true} />)
    expect(screen.getByText('Buscando...')).toBeInTheDocument()
  })

  it('deshabilita el botón cuando isLoading es true', () => {
    render(<TrackSearch {...defaultProps} isLoading={true} />)
    const button = screen.getByRole('button', { name: /buscando/i })
    expect(button).toBeDisabled()
  })

  // ==================== TESTS DE RESULTADOS ====================

  it('muestra las canciones cuando hay resultados', () => {
    const tracks = [
      { track_id: 1, track_name: 'Song One', artist_name: 'Artist A', genre_name: 'Rock', unit_price: '0.99' },
      { track_id: 2, track_name: 'Song Two', artist_name: 'Artist B', genre_name: 'Pop', unit_price: '1.29' },
    ]
    render(<TrackSearch {...defaultProps} tracks={tracks} />)

    expect(screen.getByText('Song One')).toBeInTheDocument()
    expect(screen.getByText('Song Two')).toBeInTheDocument()
    expect(screen.getByText('Resultados (2)')).toBeInTheDocument()
  })

  it('muestra el precio de las canciones', () => {
    const tracks = [
      { track_id: 1, track_name: 'Song One', artist_name: 'Artist A', genre_name: 'Rock', unit_price: '0.99' },
    ]
    render(<TrackSearch {...defaultProps} tracks={tracks} />)
    expect(screen.getByText('$0.99')).toBeInTheDocument()
  })

  // ==================== TESTS DEL CARRITO ====================

  it('agrega track al carrito cuando se hace clic', () => {
    const tracks = [
      { track_id: 1, track_name: 'Song One', artist_name: 'Artist A', genre_name: 'Rock', unit_price: '0.99' },
    ]
    render(<TrackSearch {...defaultProps} tracks={tracks} />)

    fireEvent.click(screen.getByText('Song One'))
    
    // El carrito debería mostrar "(1)" ahora
    expect(screen.getByText('Carrito (1)')).toBeInTheDocument()
  })

  it('no agrega track duplicado al carrito', () => {
    const tracks = [
      { track_id: 1, track_name: 'Song One', artist_name: 'Artist A', genre_name: 'Rock', unit_price: '0.99' },
    ]
    render(<TrackSearch {...defaultProps} tracks={tracks} />)

    const track = screen.getByText('Song One')
    fireEvent.click(track)
    fireEvent.click(track)
    
    // Debería seguir siendo 1
    expect(screen.getByText('Carrito (1)')).toBeInTheDocument()
  })

  it('muestra selector de cliente cuando hay tracks en el carrito', () => {
    const tracks = [
      { track_id: 1, track_name: 'Song One', artist_name: 'Artist A', genre_name: 'Rock', unit_price: '0.99' },
    ]
    const customers = [
      { customer_id: 1, first_name: 'Ana', last_name: 'Lopez', email: 'ana@mail.com' },
    ]
    render(<TrackSearch {...defaultProps} tracks={tracks} customers={customers} />)

    fireEvent.click(screen.getByText('Song One'))
    
    expect(screen.getByLabelText('Cliente:')).toBeInTheDocument()
    expect(screen.getByText(/Ana Lopez/)).toBeInTheDocument()
  })

  it('calcula el total correctamente', () => {
    const tracks = [
      { track_id: 1, track_name: 'Song One', artist_name: 'Artist A', genre_name: 'Rock', unit_price: '1.00' },
      { track_id: 2, track_name: 'Song Two', artist_name: 'Artist B', genre_name: 'Pop', unit_price: '2.00' },
    ]
    render(<TrackSearch {...defaultProps} tracks={tracks} />)

    fireEvent.click(screen.getByText('Song One'))
    fireEvent.click(screen.getByText('Song Two'))
    
    // Total = 1.00 + 2.00 = 3.00
    expect(screen.getByText('$3.00')).toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../src/App'

// Mock de los servicios
vi.mock('../src/services/api', () => ({
  searchTracks: vi.fn(),
  fetchCustomers: vi.fn(),
}))

import { searchTracks, fetchCustomers } from '../src/services/api'

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchCustomers.mockResolvedValue([])
  })

  // ==================== TESTS DE RENDERIZADO ====================

  it('renderiza el título de la aplicación', async () => {
    render(<App />)
    expect(screen.getByText('Chinook Store')).toBeInTheDocument()
  })

  it('renderiza el componente TrackSearch', async () => {
    render(<App />)
    expect(screen.getByText('Buscar canciones')).toBeInTheDocument()
  })

  it('carga clientes al iniciar', async () => {
    const customers = [
      { customer_id: 1, first_name: 'Ana', last_name: 'Lopez', email: 'ana@mail.com' },
    ]
    fetchCustomers.mockResolvedValue(customers)

    render(<App />)

    await waitFor(() => {
      expect(fetchCustomers).toHaveBeenCalled()
    })
  })

  // ==================== TESTS DE BÚSQUEDA ====================

  it('muestra mensaje de éxito cuando la búsqueda retorna resultados', async () => {
    const tracks = [
      { track_id: 1, track_name: 'Song', artist_name: 'Artist', genre_name: 'Rock', unit_price: '0.99' },
    ]
    searchTracks.mockResolvedValue(tracks)

    render(<App />)

    const input = screen.getByPlaceholderText('Nombre de la canción...')
    fireEvent.change(input, { target: { value: 'song' } })

    const form = screen.getByRole('button', { name: /buscar/i }).closest('form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/Se encontraron 1 canciones/)).toBeInTheDocument()
    })
  })

  it('muestra mensaje de error cuando la búsqueda falla', async () => {
    searchTracks.mockRejectedValue(new Error('Error de conexión'))

    render(<App />)

    const form = screen.getByRole('button', { name: /buscar/i }).closest('form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/Error de conexión/)).toBeInTheDocument()
    })
  })

  it('muestra los tracks encontrados', async () => {
    const tracks = [
      { track_id: 1, track_name: 'Highway to Hell', artist_name: 'AC/DC', genre_name: 'Rock', unit_price: '0.99' },
    ]
    searchTracks.mockResolvedValue(tracks)

    render(<App />)

    const form = screen.getByRole('button', { name: /buscar/i }).closest('form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Highway to Hell')).toBeInTheDocument()
    })
  })

  // ==================== TESTS DE FILTROS ====================

  it('actualiza los filtros correctamente', () => {
    render(<App />)

    const songInput = screen.getByPlaceholderText('Nombre de la canción...')
    const artistInput = screen.getByPlaceholderText('Nombre del artista...')
    const genreInput = screen.getByPlaceholderText('Rock, Pop, Jazz...')

    fireEvent.change(songInput, { target: { value: 'Rock' } })
    fireEvent.change(artistInput, { target: { value: 'Queen' } })
    fireEvent.change(genreInput, { target: { value: 'Rock' } })

    expect(songInput.value).toBe('Rock')
    expect(artistInput.value).toBe('Queen')
    expect(genreInput.value).toBe('Rock')
  })

  it('envía los filtros correctos al buscar', async () => {
    searchTracks.mockResolvedValue([])

    render(<App />)

    const songInput = screen.getByPlaceholderText('Nombre de la canción...')
    const artistInput = screen.getByPlaceholderText('Nombre del artista...')

    fireEvent.change(songInput, { target: { value: 'thunder' } })
    fireEvent.change(artistInput, { target: { value: 'acdc' } })

    const form = screen.getByRole('button', { name: /buscar/i }).closest('form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(searchTracks).toHaveBeenCalledWith({ q: 'thunder', artist: 'acdc', genre: '' })
    })
  })

  // ==================== TESTS DE ESTADO DE CARGA ====================

  it('muestra estado de carga mientras busca', async () => {
    searchTracks.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve([]), 100)))

    render(<App />)

    const form = screen.getByRole('button', { name: /buscar/i }).closest('form')
    fireEvent.submit(form)

    expect(screen.getByText('Buscando...')).toBeInTheDocument()
  })

  it('oculta estado de carga cuando termina la búsqueda', async () => {
    searchTracks.mockResolvedValue([])

    render(<App />)

    const form = screen.getByRole('button', { name: /buscar/i }).closest('form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.queryByText('Buscando...')).not.toBeInTheDocument()
    })
  })
})

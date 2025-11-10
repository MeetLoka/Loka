import axios from 'axios'
import type { Trip, FlightSegment, HotelBooking, RideLeg, AttractionVisit } from '../types/domain'

// Use proxy in development (/api), direct URL in production
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
export const api = axios.create({ baseURL })

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

export async function listTrips(): Promise<Trip[]> {
  const res = await api.get<Trip[]>('/trips')
  return res.data
}

export async function getTrip(id: string): Promise<Trip> {
  const res = await api.get<Trip>(`/trips/${id}`)
  return res.data
}

export async function createTrip(data: Partial<Trip>): Promise<Trip> {
  const res = await api.post<Trip>('/trips', data)
  return res.data
}

export async function updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
  const res = await api.put<Trip>(`/trips/${id}`, updates)
  return res.data
}

export async function deleteTrip(id: string): Promise<void> {
  await api.delete(`/trips/${id}`)
}

// Trip sub-resource mutations
export async function addFlightToTrip(tripId: string, flight: any): Promise<Trip> {
  const res = await api.post<Trip>(`/trips/${tripId}/flights`, flight)
  return res.data
}
export async function addHotelToTrip(tripId: string, hotel: any): Promise<Trip> {
  const res = await api.post<Trip>(`/trips/${tripId}/hotels`, hotel)
  return res.data
}
export async function addRideToTrip(tripId: string, ride: any): Promise<Trip> {
  const res = await api.post<Trip>(`/trips/${tripId}/rides`, ride)
  return res.data
}
export async function addAttractionToTrip(tripId: string, attraction: any): Promise<Trip> {
  const res = await api.post<Trip>(`/trips/${tripId}/attractions`, attraction)
  return res.data
}

// Delete trip items by type and index
export async function deleteFlightFromTrip(tripId: string, index: number): Promise<Trip> {
  const res = await api.delete<Trip>(`/trips/${tripId}/flights/${index}`)
  return res.data
}
export async function deleteHotelFromTrip(tripId: string, index: number): Promise<Trip> {
  const res = await api.delete<Trip>(`/trips/${tripId}/hotels/${index}`)
  return res.data
}
export async function deleteRideFromTrip(tripId: string, index: number): Promise<Trip> {
  const res = await api.delete<Trip>(`/trips/${tripId}/rides/${index}`)
  return res.data
}
export async function deleteAttractionFromTrip(tripId: string, index: number): Promise<Trip> {
  const res = await api.delete<Trip>(`/trips/${tripId}/attractions/${index}`)
  return res.data
}

// Flights search via backend proxy
export async function searchFlightByNumber(flightNumber: string, date: string) {
  const res = await api.get(`/flights/search/${encodeURIComponent(flightNumber)}`, { params: { date } })
  return res.data
}

// Flights by route
export async function searchFlightsByRoute(from: string, to: string, date: string, opts?: { directOnly?: boolean; airline?: string }) {
  const params: any = { from, to, date }
  if (opts?.directOnly !== undefined) params.directOnly = String(opts.directOnly)
  if (opts?.airline) params.airline = opts.airline
  const res = await api.get('/flights/search-route', { params })
  return res.data as { flights: Array<any> }
}

// Airports autocomplete/search
export async function searchAirports(query: string) {
  const res = await api.get('/flights/airports/search', { params: { query } })
  return res.data as { airports: Array<{ code: string; name: string; city: string; country: string }> }
}

// Hotels via backend
export async function hotelAutocomplete(input: string) {
  const res = await api.get('/hotels/autocomplete', { params: { input } })
  return res.data
}
export async function hotelDetails(place_id: string) {
  const res = await api.get('/hotels/details', { params: { place_id } })
  return res.data
}
export async function hotelDistanceFromAirport(hotel_place_id: string, airport_code: string) {
  const res = await api.get('/hotels/distance-from-airport', { params: { hotel_place_id, airport_code } })
  return res.data
}

// Rides / Distance
export async function rideDistance(from: string, to: string, mode: string = 'driving') {
  const res = await api.get('/rides/distance', { params: { from, to, mode } })
  return res.data
}

export async function calculateRideRoute(origin: string, destination: string) {
  const res = await api.post('/rides/calculate-route', { origin, destination })
  return res.data
}

// Places / Attractions
export async function placesAutocomplete(input: string, types: string = 'establishment') {
  const res = await api.get('/places/autocomplete', { params: { input, types } })
  return res.data
}
export async function placeDetails(place_id: string) {
  const res = await api.get('/places/details', { params: { place_id } })
  return res.data
}

// Trip Sharing
export async function shareTrip(tripId: string, emails: string[]): Promise<{ message: string; sharedWith: any[] }> {
  const res = await api.post(`/trips/${tripId}/share`, { emails })
  return res.data
}

export async function revokeAccess(tripId: string, userId: string): Promise<{ message: string; sharedWith: any[] }> {
  const res = await api.delete(`/trips/${tripId}/share/${userId}`)
  return res.data
}

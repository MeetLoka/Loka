import { useEffect, useState } from 'react'
import SearchAutocomplete from './SearchAutocomplete'
import type { Trip } from '../types/domain'
import {
  TextField,
  Button,
  Stack,
  Alert,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Paper,
  Divider,
  Typography,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab
} from '@mui/material'
import { DirectionsCar } from '@mui/icons-material'
import {
  addFlightToTrip,
  addHotelToTrip,
  addRideToTrip,
  addAttractionToTrip,
  searchFlightByNumber,
  searchFlightsByRoute,
  searchAirports,
  hotelAutocomplete,
  hotelDetails,
  rideDistance,
  placesAutocomplete,
  placeDetails,
} from '../services/api'

export function AddFlightForm({ tripId, onUpdated, onDone }: { tripId: string, onUpdated: (t: Trip)=>void, onDone?: ()=>void }) {
  const [mode, setMode] = useState<'search' | 'route' | 'manual'>('search')
  const [flightNumber, setFlightNumber] = useState('')
  const [date, setDate] = useState('')
  const [flightData, setFlightData] = useState<any | null>(null)
  
  // Route search fields
  const [origin, setOrigin] = useState<any | null>(null)
  const [destination, setDestination] = useState<any | null>(null)
  const [routeFlights, setRouteFlights] = useState<any[]>([])
  const [selectedFlight, setSelectedFlight] = useState<any | null>(null)
  
  // Manual entry fields
  const [airline, setAirline] = useState('')
  const [departureAirport, setDepartureAirport] = useState('')
  const [arrivalAirport, setArrivalAirport] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')
  
  // User inputs
  const [cost, setCost] = useState<string>('')
  const [carryOn, setCarryOn] = useState(false)
  const [checked, setChecked] = useState(false)
  const [bookingNumber, setBookingNumber] = useState('')
  const [bookingAgency, setBookingAgency] = useState('')
  
  const [searching, setSearching] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function searchFlight() {
    if (!flightNumber.trim() || !date) return
    setErr(null); setSearching(true); setFlightData(null)
    try {
      const data = await searchFlightByNumber(flightNumber.trim(), date)
      setFlightData(data)
    } catch (e: any) {
      setErr(e?.response?.data?.message || e.message)
      setFlightData(null)
    } finally { setSearching(false) }
  }

  async function searchRoute() {
    if (!origin?.code || !destination?.code || !date) return
    setErr(null); setSearching(true); setRouteFlights([]); setSelectedFlight(null)
    try {
      const data = await searchFlightsByRoute(origin.code, destination.code, date)
      setRouteFlights(data.flights || [])
    } catch (e: any) {
      setErr(e?.response?.data?.message || e.message)
      setRouteFlights([])
    } finally { setSearching(false) }
  }

  async function saveFlight() {
    setErr(null); setBusy(true)
    try {
      let segment: any
      
      if (mode === 'search' && flightData) {
        // Save from API search by flight number
        segment = {
          airline: flightData.airline,
          flightNumber: flightData.flightNumber || flightNumber.trim(),
          departureAirportCode: flightData.departureAirportCode,
          arrivalAirportCode: flightData.arrivalAirportCode,
          departureDateTime: flightData.departureDateTime,
          arrivalDateTime: flightData.arrivalDateTime,
          durationMinutes: flightData.durationMinutes,
          aircraftType: flightData.aircraftType,
          terminal: flightData.terminal,
          gate: flightData.gate,
          cost: cost ? Number(cost) : undefined,
          carryOn,
          checkedBag: checked,
          bookingNumber: bookingNumber || undefined,
          bookingAgency: bookingAgency || undefined,
        }
      } else if (mode === 'route' && selectedFlight) {
        // Save from route search - transform nested structure to flat
        segment = {
          airline: selectedFlight.airline,
          flightNumber: selectedFlight.flightNumber,
          departureAirportCode: selectedFlight.departure?.iata || selectedFlight.departureAirportCode,
          arrivalAirportCode: selectedFlight.arrival?.iata || selectedFlight.arrivalAirportCode,
          departureDateTime: selectedFlight.departure?.scheduled || selectedFlight.departureDateTime,
          arrivalDateTime: selectedFlight.arrival?.scheduled || selectedFlight.arrivalDateTime,
          durationMinutes: selectedFlight.durationMinutes,
          aircraftType: selectedFlight.aircraft || selectedFlight.aircraftType,
          terminal: {
            departure: selectedFlight.departure?.terminal,
            arrival: selectedFlight.arrival?.terminal
          },
          gate: selectedFlight.gate,
          cost: cost ? Number(cost) : undefined,
          carryOn,
          checkedBag: checked,
          bookingNumber: bookingNumber || undefined,
          bookingAgency: bookingAgency || undefined,
        }
      } else {
        // Save manual entry
        const depDateTime = date && departureTime ? `${date}T${departureTime}` : date
        const arrDateTime = date && arrivalTime ? `${date}T${arrivalTime}` : date
        
        segment = {
          airline: airline || 'Unknown',
          flightNumber: flightNumber.trim(),
          departureAirportCode: departureAirport.toUpperCase(),
          arrivalAirportCode: arrivalAirport.toUpperCase(),
          departureDateTime: depDateTime,
          arrivalDateTime: arrDateTime,
          cost: cost ? Number(cost) : undefined,
          carryOn,
          checkedBag: checked,
          bookingNumber: bookingNumber || undefined,
          bookingAgency: bookingAgency || undefined,
        }
      }
      
      const updated = await addFlightToTrip(tripId, segment)
      onUpdated(updated)
      
      // Reset form
      setFlightNumber(''); setDate(''); setFlightData(null)
      setOrigin(null); setDestination(null); setRouteFlights([]); setSelectedFlight(null)
      setAirline(''); setDepartureAirport(''); setArrivalAirport('')
      setDepartureTime(''); setArrivalTime('')
      setCost(''); setCarryOn(false); setChecked(false); setBookingNumber(''); setBookingAgency('')
      setMode('search')
      onDone?.()
    } catch (e: any) {
      setErr(e?.response?.data?.message || e.message)
    } finally { setBusy(false) }
  }

  return (
    <Box>
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      
      {/* Mode Selector */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={mode}
          onChange={(_, v) => { setMode(v); setFlightData(null); setRouteFlights([]); setSelectedFlight(null); setErr(null) }}
          variant="fullWidth"
        >
          <Tab value="search" label="By Flight Number" />
          <Tab value="route" label="By Route" />
          <Tab value="manual" label="Manual Entry" />
        </Tabs>
      </Card>

      {/* Search Mode */}
      {mode === 'search' && (
        <>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Search Flight
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Flight Number"
                    placeholder="e.g. IZ603, LY315, BA123"
                    value={flightNumber}
                    onChange={e => setFlightNumber(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Flight Date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
              </Grid>
              <Stack direction="row" spacing={2} mt={2}>
                <Button
                  variant="contained"
                  disabled={!flightNumber.trim() || !date || searching}
                  onClick={searchFlight}
                  endIcon={searching && <CircularProgress size={20} />}
                >
                  {searching ? 'Searching…' : 'Search Flight'}
                </Button>
                {!flightData && (
                  <Button
                    variant="outlined"
                    onClick={() => setMode('manual')}
                  >
                    Can't find flight? Add manually
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </>
      )}

      {/* Route Search Mode */}
      {mode === 'route' && (
        <>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Search Flights by Route
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <SearchAutocomplete
                    label="Origin Airport"
                    placeholder="e.g. TLV, JFK, LHR"
                    minChars={2}
                    value={origin}
                    fetchOptions={async (q: string) => {
                      const result = await searchAirports(q)
                      return result.airports || []
                    }}
                    getOptionLabel={(airport: any) => `${airport.code} - ${airport.name}`}
                    onSelect={(airport: any) => setOrigin(airport)}
                    isOptionEqualToValue={(option: any, value: any) => option.code === value.code}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <SearchAutocomplete
                    label="Destination Airport"
                    placeholder="e.g. DXB, LAX, CDG"
                    minChars={2}
                    value={destination}
                    fetchOptions={async (q: string) => {
                      const result = await searchAirports(q)
                      return result.airports || []
                    }}
                    getOptionLabel={(airport: any) => `${airport.code} - ${airport.name}`}
                    onSelect={(airport: any) => setDestination(airport)}
                    isOptionEqualToValue={(option: any, value: any) => option.code === value.code}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Flight Date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
              </Grid>
              <Button
                variant="contained"
                disabled={!origin?.code || !destination?.code || !date || searching}
                onClick={searchRoute}
                endIcon={searching && <CircularProgress size={20} />}
                sx={{ mt: 2 }}
              >
                {searching ? 'Searching…' : 'Search Flights'}
              </Button>
            </CardContent>
          </Card>

          {/* Flight List Results */}
          {routeFlights.length > 0 && (
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Available Flights ({routeFlights.length})
                </Typography>
                <Stack spacing={2}>
                  {routeFlights.map((flight, idx) => (
                    <Paper
                      key={idx}
                      variant="outlined"
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: selectedFlight === flight ? 2 : 1,
                        borderColor: selectedFlight === flight ? 'primary.main' : 'divider',
                        bgcolor: selectedFlight === flight ? 'primary.50' : 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => setSelectedFlight(flight)}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {flight.airline} - {flight.flightNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {flight.departure?.iata || flight.departureAirportCode} → {flight.arrival?.iata || flight.arrivalAirportCode}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="body2">
                            {(() => {
                              const depDate = new Date(flight.departure?.scheduled || flight.departureDateTime);
                              const arrDate = new Date(flight.arrival?.scheduled || flight.arrivalDateTime);
                              const depTime = isNaN(depDate.getTime()) ? '--:--' : depDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                              const arrTime = isNaN(arrDate.getTime()) ? '--:--' : arrDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                              return `${depTime} - ${arrTime}`;
                            })()}
                          </Typography>
                          {flight.durationMinutes && (
                            <Typography variant="caption" color="text.secondary">
                              {Math.floor(flight.durationMinutes / 60)}h {flight.durationMinutes % 60}m
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} mt={1}>
                        {(flight.stops === 0 || !flight.stops) && (
                          <Chip label="Direct" color="success" size="small" />
                        )}
                        {(flight.aircraft || flight.aircraftType) && (
                          <Chip label={flight.aircraft || flight.aircraftType} size="small" />
                        )}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {routeFlights.length === 0 && !searching && date && origin && destination && (
            <Alert severity="info" sx={{ mb: 3 }}>
              No flights found for this route. Try searching by flight number or add manually.
            </Alert>
          )}
        </>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Enter Flight Details Manually
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Flight Number"
                  placeholder="e.g. IZ603"
                  value={flightNumber}
                  onChange={e => setFlightNumber(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Airline"
                  placeholder="e.g. Arkia Israeli Airlines"
                  value={airline}
                  onChange={e => setAirline(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Departure Airport"
                  placeholder="e.g. TLV"
                  value={departureAirport}
                  onChange={e => setDepartureAirport(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Arrival Airport"
                  placeholder="e.g. DXB"
                  value={arrivalAirport}
                  onChange={e => setArrivalAirport(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Flight Date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Departure Time"
                  value={departureTime}
                  onChange={e => setDepartureTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Arrival Time"
                  value={arrivalTime}
                  onChange={e => setArrivalTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Flight Details (shown after search) */}
      {(flightData || selectedFlight) && (
        <>
          <Card variant="outlined" sx={{ mb: 3, bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Flight Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip label={(flightData || selectedFlight).airline} color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      {(flightData || selectedFlight).flightNumber}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">Departure</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {(flightData || selectedFlight).departureAirportCode || (flightData || selectedFlight).departure?.iata}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date((flightData || selectedFlight).departureDateTime || (flightData || selectedFlight).departure?.scheduled).toLocaleString()}
                    </Typography>
                    {((flightData || selectedFlight).terminal?.departure || (flightData || selectedFlight).departure?.terminal) && (
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        Terminal: {(flightData || selectedFlight).terminal?.departure || (flightData || selectedFlight).departure?.terminal}
                      </Typography>
                    )}
                    {((flightData || selectedFlight).gate?.departure || (flightData || selectedFlight).departure?.gate) && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Gate: {(flightData || selectedFlight).gate?.departure || (flightData || selectedFlight).departure?.gate}
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">Arrival</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {(flightData || selectedFlight).arrivalAirportCode || (flightData || selectedFlight).arrival?.iata}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date((flightData || selectedFlight).arrivalDateTime || (flightData || selectedFlight).arrival?.scheduled).toLocaleString()}
                    </Typography>
                    {((flightData || selectedFlight).terminal?.arrival || (flightData || selectedFlight).arrival?.terminal) && (
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        Terminal: {(flightData || selectedFlight).terminal?.arrival || (flightData || selectedFlight).arrival?.terminal}
                      </Typography>
                    )}
                    {((flightData || selectedFlight).gate?.arrival || (flightData || selectedFlight).arrival?.gate) && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Gate: {(flightData || selectedFlight).gate?.arrival || (flightData || selectedFlight).arrival?.gate}
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                {(flightData || selectedFlight).durationMinutes && (
                  <Grid item xs={12}>
                    <Alert severity="info" icon={false}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="body2">
                          <strong>Duration:</strong> {Math.floor((flightData || selectedFlight).durationMinutes / 60)}h {(flightData || selectedFlight).durationMinutes % 60}m
                        </Typography>
                        {((flightData || selectedFlight).aircraftType || (flightData || selectedFlight).aircraft) && (
                          <Typography variant="body2">
                            <strong>Aircraft:</strong> {(flightData || selectedFlight).aircraftType || (flightData || selectedFlight).aircraft}
                          </Typography>
                        )}
                      </Stack>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* User Inputs Section - shown after search */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Your Booking Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ticket Cost"
                    placeholder="Enter ticket price"
                    type="number"
                    value={cost}
                    onChange={e => setCost(e.target.value)}
                    InputProps={{ startAdornment: '$' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Booking Number"
                    placeholder="e.g. ABC123"
                    value={bookingNumber}
                    onChange={e => setBookingNumber(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Booking Agency"
                    placeholder="e.g. Expedia, Booking.com"
                    value={bookingAgency}
                    onChange={e => setBookingAgency(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Baggage
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <FormControlLabel
                      control={<Checkbox checked={carryOn} onChange={e => setCarryOn(e.target.checked)} />}
                      label="Carry-on Trolley"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={checked} onChange={e => setChecked(e.target.checked)} />}
                      label="Checked Baggage"
                    />
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}

      {/* User Inputs for Manual Mode */}
      {mode === 'manual' && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Additional Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ticket Cost"
                  placeholder="Enter ticket price"
                  type="number"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Booking Number"
                  placeholder="e.g. ABC123"
                  value={bookingNumber}
                  onChange={e => setBookingNumber(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Booking Agency"
                  placeholder="e.g. Expedia, Booking.com"
                  value={bookingAgency}
                  onChange={e => setBookingAgency(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Baggage
                </Typography>
                <Stack direction="row" spacing={2}>
                  <FormControlLabel
                    control={<Checkbox checked={carryOn} onChange={e => setCarryOn(e.target.checked)} />}
                    label="Carry-on Trolley"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={checked} onChange={e => setChecked(e.target.checked)} />}
                    label="Checked Baggage"
                  />
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {((mode === 'search' && flightData) || (mode === 'route' && selectedFlight) || (mode === 'manual' && flightNumber && date && departureAirport && arrivalAirport)) && (
        <Button
          variant="contained"
          size="large"
          disabled={busy}
          onClick={saveFlight}
          endIcon={busy && <CircularProgress size={20} />}
        >
          {busy ? 'Adding Flight…' : 'Add Flight to Trip'}
        </Button>
      )}

      {/* Empty state for search mode */}
      {mode === 'search' && !flightData && !searching && (
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          height={200}
          border={1}
          borderColor="divider"
          borderRadius={2}
          bgcolor="grey.50"
        >
          <Stack alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Enter flight number and date to search
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  )
}

export function AddHotelForm({ tripId, onUpdated, onDone }: { tripId: string, onUpdated: (t: Trip)=>void, onDone?: ()=>void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [hotelDetail, setHotelDetail] = useState<any | null>(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [nights, setNights] = useState('')
  const [cost, setCost] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Debounced search for hotels
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([])
      return
    }
    let active = true
    const timer = setTimeout(async () => {
      try {
        const res = await hotelAutocomplete(searchQuery.trim())
        if (active) setSearchResults(res.suggestions || [])
      } catch (e) {
        console.error('Hotel search error:', e)
      }
    }, 500)
    return () => { active = false; clearTimeout(timer) }
  }, [searchQuery])

  // Fetch hotel details when selected
  async function handleSelectHotel(hotel: any) {
    setSelected(hotel)
    setLoadingDetails(true)
    try {
      const det = await hotelDetails(hotel.placeId)
      setHotelDetail(det.hotel)
    } catch (e) {
      console.error('Error fetching hotel details:', e)
      setHotelDetail(null)
    } finally {
      setLoadingDetails(false)
    }
  }

  async function add() {
    if (!selected || !checkIn || !checkOut) return
    setErr(null); setBusy(true)
    try {
      const hotelPayload = {
        placeId: selected.placeId,
        name: hotelDetail?.name || selected.name,
        address: hotelDetail?.formattedAddress || selected.formattedAddress,
        checkIn, checkOut,
        nights: nights ? Number(nights) : undefined,
        cost: cost ? Number(cost) : undefined,
        rating: hotelDetail?.rating || null,
      }
      const updated = await addHotelToTrip(tripId, hotelPayload as any)
      onUpdated(updated)
      setSearchQuery(''); setSearchResults([]); setSelected(null); setHotelDetail(null); setCheckIn(''); setCheckOut(''); setNights(''); setCost('')
      onDone?.()
    } catch (e: any) { setErr(e?.response?.data?.message || e.message) } finally { setBusy(false) }
  }

  return (
    <Box>
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      
      <Grid container spacing={3}>
        {/* Left side - Search */}
        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Search Hotels"
              placeholder="Type hotel name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
            
            {searchResults.length > 0 && (
              <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Stack divider={<Divider />}>
                  {searchResults.map((hotel) => (
                    <Box
                      key={hotel.placeId}
                      onClick={() => handleSelectHotel(hotel)}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        bgcolor: selected?.placeId === hotel.placeId ? 'action.selected' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">
                        {hotel.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {hotel.formattedAddress}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}
            
            {searchQuery.length >= 3 && searchResults.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                No hotels found. Try a different search.
              </Typography>
            )}
          </Stack>
        </Grid>

        {/* Right side - Hotel Details & Booking */}
        <Grid item xs={12} md={7}>
          {loadingDetails && (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          )}
          
          {!loadingDetails && selected && (
            <Stack spacing={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {hotelDetail?.name || selected.name}
                  </Typography>
                  
                  {hotelDetail?.rating && (
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Typography variant="body2" color="text.secondary">Rating:</Typography>
                      <Box display="flex" alignItems="center">
                        <Typography variant="subtitle2" fontWeight="bold" color="primary">
                          {hotelDetail.rating}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" ml={0.5}>
                          / 5 ⭐
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Address:</strong>
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {hotelDetail?.formattedAddress || selected.formattedAddress}
                  </Typography>
                  
                  {hotelDetail?.distance && (
                    <Box mt={2} p={2} bgcolor="info.50" borderRadius={1}>
                      <Typography variant="caption" color="text.secondary">
                        Distance from airport: <strong>{hotelDetail.distance}</strong>
                      </Typography>
                      {hotelDetail?.duration && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Travel time: <strong>{hotelDetail.duration}</strong>
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Booking Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Check In"
                        value={checkIn}
                        onChange={e => setCheckIn(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Check Out"
                        value={checkOut}
                        onChange={e => setCheckOut(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Nights"
                        type="number"
                        value={nights}
                        onChange={e => setNights(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Cost"
                        placeholder="Optional"
                        type="number"
                        value={cost}
                        onChange={e => setCost(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Button
                variant="contained"
                size="large"
                disabled={!selected || !checkIn || !checkOut || busy}
                onClick={add}
                endIcon={busy && <CircularProgress size={20} />}
              >
                {busy ? 'Adding Hotel…' : 'Add Hotel to Trip'}
              </Button>
            </Stack>
          )}
          
          {!selected && !loadingDetails && (
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="center" 
              height={300}
              border={1}
              borderColor="divider"
              borderRadius={2}
              bgcolor="grey.50"
            >
              <Typography variant="body2" color="text.secondary">
                Search and select a hotel to see details
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}

export function AddRideForm({ tripId, onUpdated, onDone }: { tripId: string, onUpdated: (t: Trip)=>void, onDone?: ()=>void }) {
  const [rideType, setRideType] = useState<'taxi' | 'rental'>('taxi')
  const [searchQueryFrom, setSearchQueryFrom] = useState('')
  const [searchQueryTo, setSearchQueryTo] = useState('')
  const [searchResultsFrom, setSearchResultsFrom] = useState<any[]>([])
  const [searchResultsTo, setSearchResultsTo] = useState<any[]>([])
  const [fromSel, setFromSel] = useState<any | null>(null)
  const [toSel, setToSel] = useState<any | null>(null)
  const [rideDetails, setRideDetails] = useState<any | null>(null)
  
  // Common fields
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [cost, setCost] = useState('')
  const [mode, setMode] = useState('driving')
  
  // Taxi/Ride specific
  const [notes, setNotes] = useState('')
  
  // Car Rental specific
  const [voucherNumber, setVoucherNumber] = useState('')
  const [rentalCompany, setRentalCompany] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [returnTime, setReturnTime] = useState('')
  
  const [busy, setBusy] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Search for pickup locations
  useEffect(() => {
    if (searchQueryFrom.trim().length < 3) {
      setSearchResultsFrom([])
      return
    }
    let active = true
    const timer = setTimeout(async () => {
      try {
        const r = await placesAutocomplete(searchQueryFrom.trim())
        if (active) setSearchResultsFrom(r.suggestions || [])
      } catch (e) {
        console.error('Place search error:', e)
      }
    }, 500)
    return () => { active = false; clearTimeout(timer) }
  }, [searchQueryFrom])

  // Search for dropoff locations
  useEffect(() => {
    if (searchQueryTo.trim().length < 3) {
      setSearchResultsTo([])
      return
    }
    let active = true
    const timer = setTimeout(async () => {
      try {
        const r = await placesAutocomplete(searchQueryTo.trim())
        if (active) setSearchResultsTo(r.suggestions || [])
      } catch (e) {
        console.error('Place search error:', e)
      }
    }, 500)
    return () => { active = false; clearTimeout(timer) }
  }, [searchQueryTo])

  // Calculate distance when both locations are selected
  useEffect(() => {
    if (!fromSel || !toSel) {
      setRideDetails(null)
      return
    }
    setLoadingDetails(true)
    rideDistance(`place_id:${fromSel.placeId}`, `place_id:${toSel.placeId}`, mode)
      .then(dist => setRideDetails(dist))
      .catch(e => console.error('Distance calculation error:', e))
      .finally(() => setLoadingDetails(false))
  }, [fromSel, toSel, mode])

  async function add() {
    // Validate required fields based on ride type
    const hasRequiredFields = rideType === 'rental' 
      ? (fromSel && toSel && pickupDate && pickupTime)
      : (fromSel && toSel && date && time)
    
    if (!hasRequiredFields) return
    
    setErr(null); setBusy(true)
    try {
      const payload: any = {
        type: rideType,
        pickup: fromSel.name,
        dropoff: toSel.name,
        pickupPlaceId: fromSel.placeId,
        dropoffPlaceId: toSel.placeId,
        distance: rideDetails?.distance,
        duration: rideDetails?.duration,
        mode,
        date: rideType === 'rental' ? pickupDate : date,
        time: rideType === 'rental' ? pickupTime : time,
        cost: cost ? Number(cost) : undefined,
      }
      
      // Add taxi/ride specific fields
      if (rideType === 'taxi') {
        payload.notes = notes || undefined
      }
      
      // Add car rental specific fields
      if (rideType === 'rental') {
        payload.voucherNumber = voucherNumber || undefined
        payload.rentalCompany = rentalCompany || undefined
        payload.pickupDate = pickupDate
        payload.pickupTime = pickupTime
        payload.returnDate = returnDate || undefined
        payload.returnTime = returnTime || undefined
      }
      
      const updated = await addRideToTrip(tripId, payload)
      onUpdated(updated)
      
      // Reset all fields
      setSearchQueryFrom(''); setSearchQueryTo(''); setSearchResultsFrom([]); setSearchResultsTo([])
      setFromSel(null); setToSel(null); setRideDetails(null)
      setDate(''); setTime(''); setCost(''); setNotes('')
      setVoucherNumber(''); setRentalCompany(''); setPickupDate(''); setPickupTime(''); setReturnDate(''); setReturnTime('')
      onDone?.()
    } catch (e:any) { setErr(e?.response?.data?.message || e.message) } finally { setBusy(false) }
  }

  return (
    <Box>
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      
      <Grid container spacing={3}>
        {/* Left side - Search */}
        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            {/* Pickup Search */}
            <Box>
              <TextField
                fullWidth
                label="Pickup Location"
                placeholder="Search pickup location..."
                value={searchQueryFrom}
                onChange={(e) => setSearchQueryFrom(e.target.value)}
                autoComplete="off"
              />
              {searchResultsFrom.length > 0 && (
                <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
                  <Stack divider={<Divider />}>
                    {searchResultsFrom.map((place) => (
                      <Box
                        key={place.placeId}
                        onClick={() => { setFromSel(place); setSearchQueryFrom(''); setSearchResultsFrom([]) }}
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          bgcolor: fromSel?.placeId === place.placeId ? 'action.selected' : 'transparent',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <Typography variant="body2" fontWeight="medium">
                          {place.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {place.formattedAddress}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              )}
              {fromSel && (
                <Card variant="outlined" sx={{ mt: 1, bgcolor: 'success.50' }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color="text.secondary">Selected Pickup:</Typography>
                    <Typography variant="body2" fontWeight="bold">{fromSel.name}</Typography>
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Dropoff Search */}
            <Box>
              <TextField
                fullWidth
                label="Drop-off Location"
                placeholder="Search drop-off location..."
                value={searchQueryTo}
                onChange={(e) => setSearchQueryTo(e.target.value)}
                autoComplete="off"
              />
              {searchResultsTo.length > 0 && (
                <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
                  <Stack divider={<Divider />}>
                    {searchResultsTo.map((place) => (
                      <Box
                        key={place.placeId}
                        onClick={() => { setToSel(place); setSearchQueryTo(''); setSearchResultsTo([]) }}
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          bgcolor: toSel?.placeId === place.placeId ? 'action.selected' : 'transparent',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <Typography variant="body2" fontWeight="medium">
                          {place.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {place.formattedAddress}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              )}
              {toSel && (
                <Card variant="outlined" sx={{ mt: 1, bgcolor: 'info.50' }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color="text.secondary">Selected Drop-off:</Typography>
                    <Typography variant="body2" fontWeight="bold">{toSel.name}</Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Stack>
        </Grid>

        {/* Right side - Ride Details */}
        <Grid item xs={12} md={7}>
          {loadingDetails && (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          )}
          
          {!loadingDetails && (fromSel || toSel) && (
            <Stack spacing={3}>
              {fromSel && toSel && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Route Details
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">From:</Typography>
                        <Typography variant="body2">{fromSel.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{fromSel.formattedAddress}</Typography>
                      </Box>
                      
                      <Divider />
                      
                      <Box>
                        <Typography variant="caption" color="text.secondary">To:</Typography>
                        <Typography variant="body2">{toSel.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{toSel.formattedAddress}</Typography>
                      </Box>
                    </Stack>
                    
                    {rideDetails && (
                      <Box mt={3} p={2} bgcolor="primary.50" borderRadius={1}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Distance</Typography>
                            <Typography variant="h6" color="primary">{rideDetails.distance}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Duration</Typography>
                            <Typography variant="h6" color="primary">{rideDetails.duration}</Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {(!fromSel || !toSel) && (
                <Alert severity="info">
                  Please select both pickup and drop-off locations to continue
                </Alert>
              )}

              {/* Ride Type Selection */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Ride Type
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select value={rideType} label="Type" onChange={e => setRideType(e.target.value as 'taxi' | 'rental')}>
                      <MenuItem value="taxi">🚕 Taxi / Private Ride</MenuItem>
                      <MenuItem value="rental">🚗 Car Rental</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>

              {/* Date and Time - Required for both types */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    {rideType === 'taxi' ? 'Ride Schedule' : 'Pickup Schedule'}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Date"
                        value={rideType === 'rental' ? pickupDate : date}
                        onChange={e => rideType === 'rental' ? setPickupDate(e.target.value) : setDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Time"
                        value={rideType === 'rental' ? pickupTime : time}
                        onChange={e => rideType === 'rental' ? setPickupTime(e.target.value) : setTime(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Car Rental Specific Fields */}
              {rideType === 'rental' && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Rental Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Rental Company"
                          placeholder="e.g., Hertz, Enterprise"
                          value={rentalCompany}
                          onChange={e => setRentalCompany(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Voucher Number"
                          placeholder="Optional"
                          value={voucherNumber}
                          onChange={e => setVoucherNumber(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }}>
                          <Chip label="Return Schedule" size="small" />
                        </Divider>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Return Date"
                          value={returnDate}
                          onChange={e => setReturnDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="time"
                          label="Return Time"
                          value={returnTime}
                          onChange={e => setReturnTime(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Taxi/Ride Specific Fields */}
              {rideType === 'taxi' && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Additional Details
                    </Typography>
                    <TextField
                      fullWidth
                      label="Notes"
                      placeholder="Driver name, phone number, or other details..."
                      multiline
                      rows={3}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Transportation Mode & Cost */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Additional Settings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Transportation Mode</InputLabel>
                        <Select value={mode} label="Transportation Mode" onChange={e => setMode(e.target.value)}>
                          <MenuItem value="driving">🚗 Driving</MenuItem>
                          <MenuItem value="walking">🚶 Walking</MenuItem>
                          <MenuItem value="bicycling">🚴 Bicycling</MenuItem>
                          <MenuItem value="transit">🚌 Transit</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Cost"
                        placeholder="Optional"
                        type="number"
                        value={cost}
                        onChange={e => setCost(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Button
                variant="contained"
                size="large"
                disabled={
                  !fromSel || 
                  !toSel || 
                  (rideType === 'rental' ? (!pickupDate || !pickupTime) : (!date || !time)) ||
                  busy
                }
                onClick={add}
                endIcon={busy && <CircularProgress size={20} />}
              >
                {busy ? 'Adding Ride…' : `Add ${rideType === 'rental' ? 'Car Rental' : 'Ride'} to Trip`}
              </Button>
            </Stack>
          )}
          
          {!fromSel && !toSel && !loadingDetails && (
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="center" 
              height={400}
              border={1}
              borderColor="divider"
              borderRadius={2}
              bgcolor="grey.50"
            >
              <Stack alignItems="center" spacing={1}>
                <DirectionsCar sx={{ fontSize: 48, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary">
                  Select pickup and drop-off locations to begin
                </Typography>
              </Stack>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}

export function AddAttractionForm({ tripId, onUpdated, onDone }: { tripId: string, onUpdated: (t: Trip)=>void, onDone?: ()=>void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [sel, setSel] = useState<any | null>(null)
  const [placeDetail, setPlaceDetail] = useState<any | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [cost, setCost] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Debounced search for attractions
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([])
      return
    }
    let active = true
    const timer = setTimeout(async () => {
      try {
        const r = await placesAutocomplete(searchQuery.trim())
        if (active) setSearchResults(r.suggestions || [])
      } catch (e) {
        console.error('Place search error:', e)
      }
    }, 500)
    return () => { active = false; clearTimeout(timer) }
  }, [searchQuery])

  // Fetch place details when selected
  async function handleSelectPlace(place: any) {
    setSel(place)
    setLoadingDetails(true)
    try {
      const det = await placeDetails(place.placeId)
      setPlaceDetail(det.place)
    } catch (e) {
      console.error('Error fetching place details:', e)
      setPlaceDetail(null)
    } finally {
      setLoadingDetails(false)
    }
  }

  async function add() {
    if (!sel || !date) return
    setErr(null); setBusy(true)
    try {
      const payload = {
        placeId: sel.placeId,
        name: placeDetail?.name || sel.name,
        address: placeDetail?.formattedAddress || sel.formattedAddress,
        scheduledDate: date,
        scheduledTime: time || undefined,
        rating: placeDetail?.rating || null,
        cost: cost ? Number(cost) : undefined,
      }
      const updated = await addAttractionToTrip(tripId, payload as any)
      onUpdated(updated)
      setSearchQuery(''); setSearchResults([]); setSel(null); setPlaceDetail(null); setDate(''); setTime(''); setCost('')
      onDone?.()
    } catch (e:any) { setErr(e?.response?.data?.message || e.message) } finally { setBusy(false) }
  }

  return (
    <Box>
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      
      <Grid container spacing={3}>
        {/* Left side - Search */}
        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Search Attractions"
              placeholder="e.g., Burj Khalifa, restaurants, parks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
            
            {searchResults.length > 0 && (
              <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Stack divider={<Divider />}>
                  {searchResults.map((place) => (
                    <Box
                      key={place.placeId}
                      onClick={() => handleSelectPlace(place)}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        bgcolor: sel?.placeId === place.placeId ? 'action.selected' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">
                        {place.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {place.formattedAddress}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}
            
            {searchQuery.length >= 3 && searchResults.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                No places found. Try a different search.
              </Typography>
            )}
          </Stack>
        </Grid>

        {/* Right side - Attraction Details & Schedule */}
        <Grid item xs={12} md={7}>
          {loadingDetails && (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          )}
          
          {!loadingDetails && sel && (
            <Stack spacing={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {placeDetail?.name || sel.name}
                  </Typography>
                  
                  {placeDetail?.rating && (
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Typography variant="body2" color="text.secondary">Rating:</Typography>
                      <Box display="flex" alignItems="center">
                        <Typography variant="subtitle2" fontWeight="bold" color="primary">
                          {placeDetail.rating}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" ml={0.5}>
                          / 5 ⭐
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Address:</strong>
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {placeDetail?.formattedAddress || sel.formattedAddress}
                  </Typography>
                  
                  {placeDetail?.types && (
                    <Box mt={2}>
                      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                        Categories:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {placeDetail.types.slice(0, 5).map((type: string) => (
                          <Chip key={type} label={type.replace(/_/g, ' ')} size="small" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Visit Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Time"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Cost"
                        placeholder="Optional"
                        type="number"
                        value={cost}
                        onChange={e => setCost(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Button
                variant="contained"
                size="large"
                disabled={!sel || !date || busy}
                onClick={add}
                endIcon={busy && <CircularProgress size={20} />}
              >
                {busy ? 'Adding Attraction…' : 'Add Attraction to Trip'}
              </Button>
            </Stack>
          )}
          
          {!sel && !loadingDetails && (
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="center" 
              height={300}
              border={1}
              borderColor="divider"
              borderRadius={2}
              bgcolor="grey.50"
            >
              <Typography variant="body2" color="text.secondary">
                Search and select an attraction to see details
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}

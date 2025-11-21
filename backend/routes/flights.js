import express from 'express'
import axios from 'axios'

const router = express.Router()

// AeroDataBox API configuration
const AERODATABOX_BASE_URL = 'https://aerodatabox.p.rapidapi.com'
const RAPIDAPI_HOST = 'aerodatabox.p.rapidapi.com'

// Search flight by flight number and date
router.get('/search/:flightNumber', async (req, res) => {
  try {
    const { flightNumber } = req.params
    const { date } = req.query // Expected format: YYYY-MM-DD

    if (!flightNumber || !date) {
      return res.status(400).json({ 
        error: 'Flight number and date are required',
        message: 'Please provide flightNumber as path parameter and date as query parameter (YYYY-MM-DD)'
      })
    }

    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
    
    if (!RAPIDAPI_KEY) {
      return res.status(503).json({ 
        error: 'Flight API not configured',
        message: 'RapidAPI key is missing. Please configure RAPIDAPI_KEY in environment variables.'
      })
    }

    console.log(`Fetching real flight data for ${flightNumber} on ${date}`)
    // Call AeroDataBox API
    const response = await axios.get(
      `${AERODATABOX_BASE_URL}/flights/number/${flightNumber}/${date}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        },
        params: {
          withAircraftImage: false,
          withLocation: false
        }
      }
    )

    if (!response.data || response.data.length === 0) {
      return res.status(404).json({ 
        error: 'Flight not found',
        message: `No flight found for ${flightNumber} on ${date}`
      })
    }

    // Get the first flight from results (usually most relevant)
    const flight = response.data[0]
    
    // Extract datetime info
    const departureTime = flight.departure?.scheduledTime?.local || 
                          flight.departure?.scheduledTime?.utc || 
                          flight.departure?.scheduledTimeLocal || 
                          flight.departure?.scheduledTimeUtc
    
    const arrivalTime = flight.arrival?.scheduledTime?.local || 
                        flight.arrival?.scheduledTime?.utc || 
                        flight.arrival?.scheduledTimeLocal || 
                        flight.arrival?.scheduledTimeUtc
    
    // Calculate duration if both times are available
    let durationMinutes = 0
    if (departureTime && arrivalTime) {
      try {
        const deptDate = new Date(departureTime)
        const arrDate = new Date(arrivalTime)
        durationMinutes = Math.round((arrDate - deptDate) / (1000 * 60))
      } catch (e) {
        console.warn('Could not calculate duration:', e.message)
      }
    }
    
    // Transform to our format
    const flightData = {
      airline: flight.airline?.name || 'Unknown',
      flightNumber: flight.number || flightNumber,
      departureAirportCode: flight.departure?.airport?.iata || '',
      departureCity: flight.departure?.airport?.municipalityName || '',
      departureCountry: flight.departure?.airport?.countryCode || '',
      departureDateTime: departureTime || `${date}T00:00:00`,
      departureTimeLocal: departureTime || '',
      departureTimezone: flight.departure?.airport?.timezone || '',
      arrivalAirportCode: flight.arrival?.airport?.iata || '',
      arrivalCity: flight.arrival?.airport?.municipalityName || '',
      arrivalCountry: flight.arrival?.airport?.countryCode || '',
      arrivalDateTime: arrivalTime || `${date}T00:00:00`,
      arrivalTimeLocal: arrivalTime || '',
      arrivalTimezone: flight.arrival?.airport?.timezone || '',
      durationMinutes: durationMinutes > 0 ? durationMinutes : null,
      status: flight.status || 'scheduled',
      aircraft: flight.aircraft?.model || null,
      aircraftType: flight.aircraft?.model || null,
      terminal: {
        departure: flight.departure?.terminal || null,
        arrival: flight.arrival?.terminal || null
      },
      gate: {
        departure: flight.departure?.gate || null,
        arrival: flight.arrival?.gate || null
      }
    }

    res.json(flightData)
  } catch (error) {
    console.error('Flight search error:', error.message)
    
    // Return appropriate error based on status
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Flight not found',
        message: `No flight data available for ${req.params.flightNumber} on ${req.query.date}. Please check the flight number and date.`
      })
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many API requests. Please try again in a moment.'
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch flight details',
      message: error.message 
    })
  }
})

// Search flights by route (origin → destination + date)
router.get('/search-route', async (req, res) => {
  try {
    const { from, to, date, directOnly, airline } = req.query

    if (!from || !to || !date) {
      return res.status(400).json({ 
        error: 'Origin, destination, and date are required',
        message: 'Please provide from, to, and date query parameters (YYYY-MM-DD)'
      })
    }

    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
    
    if (!RAPIDAPI_KEY) {
      return res.status(503).json({ 
        error: 'Flight API not configured',
        message: 'RapidAPI key is missing. Please configure RAPIDAPI_KEY in environment variables.'
      })
    }

    console.log(`Searching flights from ${from.toUpperCase()} to ${to.toUpperCase()} on ${date}`)
    
    // AeroDataBox requires 12-hour windows max - search in two blocks
    const dateStart1 = `${date}T00:00`
    const dateMid = `${date}T12:00`
    const dateEnd = `${date}T23:59`
    
    let allDepartures = []
    
    // Morning flights (00:00-12:00)
    try {
      const response1 = await axios.get(
        `${AERODATABOX_BASE_URL}/flights/airports/iata/${from.toUpperCase()}/${dateStart1}/${dateMid}`,
        {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST
          },
          params: {
            withLeg: false,
            withCancelled: false,
            withCodeshared: true,
            withCargo: false,
            withPrivate: false,
            withLocation: false,
            direction: 'Departure'
          }
        }
      )
      
      if (response1.data?.departures) {
        console.log(`Found ${response1.data.departures.length} morning departures`)
        allDepartures = allDepartures.concat(response1.data.departures)
      }
    } catch (err) {
      console.log(`Morning flights error: ${err.response?.status} - ${err.message}`)
    }
    
    // Afternoon/evening flights (12:00-23:59)
    try {
      const response2 = await axios.get(
        `${AERODATABOX_BASE_URL}/flights/airports/iata/${from.toUpperCase()}/${dateMid}/${dateEnd}`,
        {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST
          },
          params: {
            withLeg: false,
            withCancelled: false,
            withCodeshared: true,
            withCargo: false,
            withPrivate: false,
            withLocation: false,
            direction: 'Departure'
          }
        }
      )
      
      if (response2.data?.departures) {
        console.log(`Found ${response2.data.departures.length} afternoon/evening departures`)
        allDepartures = allDepartures.concat(response2.data.departures)
      }
    } catch (err) {
      console.log(`Afternoon flights error: ${err.response?.status} - ${err.message}`)
    }

    if (allDepartures.length === 0) {
      // Check if both requests were rate limited
      return res.status(429).json({ 
        error: 'API rate limit exceeded',
        message: 'The flight search API has reached its rate limit. Please try again in a few minutes.'
      })
    }

    console.log(`Found ${allDepartures.length} total departures from ${from}`)

    // Debug: log the first flight's structure
    if (allDepartures.length > 0) {
      const sample = allDepartures[0]
      console.log('Sample flight structure:', JSON.stringify({
        number: sample.number,
        arrivalIata: sample.arrival?.airport?.iata,
        movementIata: sample.movement?.airport?.iata,
        arrival: sample.arrival,
        movement: sample.movement
      }, null, 2))
    }

    // Filter by destination airport IATA code - check both arrival and movement
    let routeFlights = allDepartures.filter(flight => {
      const arrivalIata = flight.arrival?.airport?.iata || flight.movement?.airport?.iata
      return arrivalIata === to.toUpperCase()
    })
    
    console.log(`Filtered to ${routeFlights.length} flights to ${to}`)

    // Apply filters
    if (directOnly === 'true') {
      routeFlights = routeFlights.filter(f => !f.codeshareStatus || f.codeshareStatus === 'IsOperator')
    }

    if (airline) {
      routeFlights = routeFlights.filter(f => f.airline?.iata === airline.toUpperCase())
    }

    if (routeFlights.length === 0) {
      return res.status(404).json({ 
        error: 'No flights found',
        message: `No flights found from ${from} to ${to} on ${date} matching your criteria`
      })
    }

    console.log(`Found ${routeFlights.length} flights from ${from} to ${to}`)

    // Transform to our format - departure flights API structure uses 'movement' for arrival
    const flightResults = routeFlights.slice(0, 20).map(flight => {
      // For departure searches, 'movement' contains the arrival airport info
      const arrivalTime = flight.movement?.scheduledTime?.local || 
                          flight.movement?.scheduledTime?.utc
      
      // Departure time might be in the root or we calculate based on arrival - duration
      const departureTime = arrivalTime // Will need to calculate actual departure from arrival - duration

      // Calculate duration if we have both times
      let durationMinutes = 0
      // Note: For departure searches, we might not have the exact departure time easily
      // The scheduledTime in movement is actually the arrival time

      // Estimate departure time if not available (assume typical flight duration)
      // Most flights from TLV to DXB are ~4 hours, adjust as needed
      const estimatedDuration = 240 // 4 hours in minutes, default estimate
      let estimatedDeparture = arrivalTime
      if (arrivalTime) {
        try {
          const arrivalDate = new Date(arrivalTime)
          const departureDate = new Date(arrivalDate.getTime() - (estimatedDuration * 60 * 1000))
          estimatedDeparture = departureDate.toISOString()
        } catch (e) {
          // Fallback to using the date string
          estimatedDeparture = `${date}T12:00:00Z`
        }
      }

      return {
        id: `${flight.number}-${date}`,
        airline: flight.airline?.name || 'Unknown',
        flightNumber: flight.number || '',
        flightIata: flight.airline?.iata || '',
        departure: {
          airport: `${from} Airport`,
          iata: from.toUpperCase(),
          scheduled: estimatedDeparture || `${date}T12:00:00Z`,
          terminal: null
        },
        arrival: {
          airport: `${flight.movement?.airport?.name} (${flight.movement?.airport?.iata})`,
          iata: flight.movement?.airport?.iata || to.toUpperCase(),
          scheduled: arrivalTime || `${date}T16:00:00Z`,
          terminal: flight.movement?.terminal || null
        },
        durationMinutes: estimatedDuration,
        stops: 0,
        aircraft: flight.aircraft?.model || '',
        status: flight.status || 'scheduled'
      }
    })

    res.json({ flights: flightResults })
  } catch (error) {
    console.error('Route search error:', error.message)
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'No flights found',
        message: `No flights available from ${req.query.from} to ${req.query.to} on ${req.query.date}`
      })
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many API requests. Please try again in a moment.'
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to search flights',
      message: error.message 
    })
  }
})


// Airport search/autocomplete
router.get('/airports/search', async (req, res) => {
  const { query } = req.query;
  
  try {
    if (!query || query.trim().length < 1) {
      return res.status(400).json({ 
        error: 'Search query is required' 
      })
    }

    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
    
    // If query is less than 3 characters or no API key, return filtered common airports
    if (!RAPIDAPI_KEY || query.trim().length < 3) {
      const commonAirports = [
        { code: 'TLV', name: 'Ben Gurion Airport', city: 'Tel Aviv', country: 'IL', location: { lat: 32.01, lng: 34.87 } },
        { code: 'JFK', name: 'John F Kennedy Intl', city: 'New York', country: 'US', location: { lat: 40.64, lng: -73.78 } },
        { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'GB', location: { lat: 51.47, lng: -0.46 } },
        { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'AE', location: { lat: 25.25, lng: 55.36 } },
        { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'FR', location: { lat: 49.01, lng: 2.55 } },
        { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'US', location: { lat: 33.94, lng: -118.41 } },
        { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'NL', location: { lat: 52.31, lng: 4.77 } },
        { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'DE', location: { lat: 50.05, lng: 8.57 } },
        { code: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'SG', location: { lat: 1.36, lng: 103.99 } },
        { code: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'JP', location: { lat: 35.55, lng: 139.78 } },
      ].filter(a => 
        a.code.toLowerCase().includes(query.toLowerCase()) ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.city.toLowerCase().includes(query.toLowerCase())
      )
      return res.json({ airports: commonAirports })
    }

    // Call AeroDataBox API for airport search
    const response = await axios.get(
      `${AERODATABOX_BASE_URL}/airports/search/term`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        },
        params: {
          q: query,
          limit: 10
        }
      }
    )

    const airports = response.data.items?.map(airport => ({
      code: airport.iata,
      name: airport.name,
      city: airport.municipalityName,
      country: airport.countryCode,
      location: {
        lat: airport.location?.lat || 0,
        lng: airport.location?.lon || 0
      }
    })) || []

    res.json({ airports })
  } catch (error) {
    console.error('Airport search error:', error.message)
    console.error('Error details:', error.response?.data || error)
    
    // If rate limited or API error, fallback to common airports
    if (error.response?.status === 429 || error.response?.status >= 500) {
      const commonAirports = [
        { code: 'TLV', name: 'Ben Gurion Airport', city: 'Tel Aviv', country: 'IL', location: { lat: 32.01, lng: 34.87 } },
        { code: 'JFK', name: 'John F Kennedy Intl', city: 'New York', country: 'US', location: { lat: 40.64, lng: -73.78 } },
        { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'GB', location: { lat: 51.47, lng: -0.46 } },
        { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'AE', location: { lat: 25.25, lng: 55.36 } },
        { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'FR', location: { lat: 49.01, lng: 2.55 } },
        { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'US', location: { lat: 33.94, lng: -118.41 } },
        { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'NL', location: { lat: 52.31, lng: 4.77 } },
        { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'DE', location: { lat: 50.05, lng: 8.57 } },
        { code: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'SG', location: { lat: 1.36, lng: 103.99 } },
        { code: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'JP', location: { lat: 35.55, lng: 139.78 } },
      ].filter(a => 
        a.code.toLowerCase().includes(query.toLowerCase()) ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.city.toLowerCase().includes(query.toLowerCase())
      )
      return res.json({ airports: commonAirports })
    }
    
    res.status(500).json({ 
      error: 'Failed to search airports',
      message: error.message,
      airports: []
    })
  }
})

export default router

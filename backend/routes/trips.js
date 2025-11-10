import express from 'express'
import { getDatabase } from '../config/database.js'
import { memoryStore } from '../config/memoryStore.js'

const router = express.Router()

// Get trips collection (MongoDB or fallback to memory)
function getTripsCollection() {
  const db = getDatabase()
  return db ? db.collection('trips') : null
}

// Helpers
async function getTripOr404(req, res) {
  const collection = getTripsCollection()
  
  let trip
  if (collection) {
    // Use MongoDB
    trip = await collection.findOne({ id: req.params.id })
  } else {
    // Fallback to memory store
    trip = memoryStore.trips.findById(req.params.id)
  }
  
  if (!trip) {
    res.status(404).json({ error: 'Trip not found' })
    return null
  }
  // Ensure arrays exist
  trip.flights = Array.isArray(trip.flights) ? trip.flights : []
  trip.hotels = Array.isArray(trip.hotels) ? trip.hotels : []
  trip.rides = Array.isArray(trip.rides) ? trip.rides : []
  trip.attractions = Array.isArray(trip.attractions) ? trip.attractions : []
  return trip
}

// Get all trips
router.get('/', async (req, res) => {
  try {
    const collection = getTripsCollection()
    
    let trips
    if (collection) {
      // Use MongoDB
      trips = await collection.find({}).sort({ createdAt: -1 }).toArray()
    } else {
      // Fallback to memory store
      trips = memoryStore.trips.find()
    }
    
    res.json(trips)
  } catch (error) {
    console.error('Error fetching trips:', error)
    res.status(500).json({ error: 'Failed to fetch trips' })
  }
})

// Get a single trip by ID
router.get('/:id', async (req, res) => {
  try {
    const collection = getTripsCollection()
    
    let trip
    if (collection) {
      // Use MongoDB
      trip = await collection.findOne({ id: req.params.id })
    } else {
      // Fallback to memory store
      trip = memoryStore.trips.findById(req.params.id)
    }
    
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }
    
    res.json(trip)
  } catch (error) {
    console.error('Error fetching trip:', error)
    res.status(500).json({ error: 'Failed to fetch trip' })
  }
})

// Create a new trip
router.post('/', async (req, res) => {
  try {
    const tripData = req.body
    const collection = getTripsCollection()
    
    let createdTrip
    if (collection) {
      // Use MongoDB
      const newTrip = {
        ...tripData,
        id: tripData.id || `trip-${Date.now()}`,
        flights: tripData.flights || [],
        hotels: tripData.hotels || [],
        rides: tripData.rides || [],
        attractions: tripData.attractions || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      await collection.insertOne(newTrip)
      createdTrip = newTrip
      console.log('✓ Trip saved to MongoDB:', createdTrip.id, '-', createdTrip.name)
    } else {
      // Fallback to memory store
      createdTrip = memoryStore.trips.create(tripData)
      console.log('✓ Trip saved to memory:', createdTrip.id, '-', createdTrip.name)
    }
    
    res.status(201).json(createdTrip)
  } catch (error) {
    console.error('Error creating trip:', error)
    res.status(500).json({ error: 'Failed to create trip', message: error.message })
  }
})

// Update a trip
router.put('/:id', async (req, res) => {
  try {
    const collection = getTripsCollection()
    
    let updated
    if (collection) {
      // Use MongoDB
      const updateData = {
        ...req.body,
        updatedAt: new Date().toISOString()
      }
      delete updateData._id // Remove MongoDB _id if present
      
      const result = await collection.findOneAndUpdate(
        { id: req.params.id },
        { $set: updateData },
        { returnDocument: 'after' }
      )
      
      if (!result) {
        return res.status(404).json({ error: 'Trip not found' })
      }
      updated = result
      console.log('✓ Trip updated in MongoDB:', req.params.id)
    } else {
      // Fallback to memory store
      updated = memoryStore.trips.update(req.params.id, req.body)
      if (!updated) {
        return res.status(404).json({ error: 'Trip not found' })
      }
      console.log('✓ Trip updated in memory:', req.params.id)
    }
    
    res.json(updated)
  } catch (error) {
    console.error('Error updating trip:', error)
    res.status(500).json({ error: 'Failed to update trip', message: error.message })
  }
})

// Delete a trip
router.delete('/:id', async (req, res) => {
  try {
    const collection = getTripsCollection()
    
    let deleted
    if (collection) {
      // Use MongoDB
      const result = await collection.deleteOne({ id: req.params.id })
      deleted = result.deletedCount > 0
      if (deleted) {
        console.log('✓ Trip deleted from MongoDB:', req.params.id)
      }
    } else {
      // Fallback to memory store
      deleted = memoryStore.trips.delete(req.params.id)
      if (deleted) {
        console.log('✓ Trip deleted from memory:', req.params.id)
      }
    }
    
    if (!deleted) {
      return res.status(404).json({ error: 'Trip not found' })
    }
    
    res.json({ success: true, message: 'Trip deleted successfully' })
  } catch (error) {
    console.error('Error deleting trip:', error)
    res.status(500).json({ error: 'Failed to delete trip', message: error.message })
  }
})

export default router

/**
 * Trip Sub-resources API
 * --------------------------------------
 * POST /api/trips/:id/flights       -> add a flight segment
 * POST /api/trips/:id/hotels        -> add a hotel booking
 * POST /api/trips/:id/rides         -> add a ride leg
 * POST /api/trips/:id/attractions   -> add an attraction visit
 * DELETE /api/trips/:id/:type/:idx  -> remove by index (type in flights|hotels|rides|attractions)
 */

router.post('/:id/flights', async (req, res) => {
  const trip = await getTripOr404(req, res)
  if (!trip) return
  const flight = req.body || {}
  // minimal validation
  if (!flight.flightNumber || !flight.departureDateTime || !flight.arrivalDateTime) {
    return res.status(400).json({ error: 'flightNumber, departureDateTime and arrivalDateTime are required' })
  }
  trip.flights.push(flight)
  
  const collection = getTripsCollection()
  let updated
  if (collection) {
    await collection.updateOne({ id: trip.id }, { $set: { flights: trip.flights, updatedAt: new Date().toISOString() } })
    updated = await collection.findOne({ id: trip.id })
  } else {
    updated = memoryStore.trips.update(trip.id, { flights: trip.flights })
  }
  
  res.status(201).json(updated)
})

router.post('/:id/hotels', async (req, res) => {
  const trip = await getTripOr404(req, res)
  if (!trip) return
  const hotel = req.body || {}
  if (!hotel.name || !hotel.checkIn || !hotel.checkOut) {
    return res.status(400).json({ error: 'name, checkIn and checkOut are required' })
  }
  trip.hotels.push(hotel)
  
  const collection = getTripsCollection()
  let updated
  if (collection) {
    await collection.updateOne({ id: trip.id }, { $set: { hotels: trip.hotels, updatedAt: new Date().toISOString() } })
    updated = await collection.findOne({ id: trip.id })
  } else {
    updated = memoryStore.trips.update(trip.id, { hotels: trip.hotels })
  }
  
  res.status(201).json(updated)
})

router.post('/:id/rides', async (req, res) => {
  const trip = await getTripOr404(req, res)
  if (!trip) return
  const ride = req.body || {}
  if (!ride.pickup || !ride.dropoff) {
    return res.status(400).json({ error: 'pickup and dropoff are required' })
  }
  trip.rides.push(ride)
  
  const collection = getTripsCollection()
  let updated
  if (collection) {
    await collection.updateOne({ id: trip.id }, { $set: { rides: trip.rides, updatedAt: new Date().toISOString() } })
    updated = await collection.findOne({ id: trip.id })
  } else {
    updated = memoryStore.trips.update(trip.id, { rides: trip.rides })
  }
  
  res.status(201).json(updated)
})

router.post('/:id/attractions', async (req, res) => {
  const trip = await getTripOr404(req, res)
  if (!trip) return
  const attraction = req.body || {}
  if (!attraction.name || !attraction.scheduledDate) {
    return res.status(400).json({ error: 'name and scheduledDate are required' })
  }
  trip.attractions.push(attraction)
  
  const collection = getTripsCollection()
  let updated
  if (collection) {
    await collection.updateOne({ id: trip.id }, { $set: { attractions: trip.attractions, updatedAt: new Date().toISOString() } })
    updated = await collection.findOne({ id: trip.id })
  } else {
    updated = memoryStore.trips.update(trip.id, { attractions: trip.attractions })
  }
  
  res.status(201).json(updated)
})

router.delete('/:id/:type/:idx', async (req, res) => {
  const trip = await getTripOr404(req, res)
  if (!trip) return
  const { type, idx } = req.params
  const valid = ['flights','hotels','rides','attractions']
  if (!valid.includes(type)) return res.status(400).json({ error: 'Invalid type' })
  const i = parseInt(idx, 10)
  if (Number.isNaN(i) || i < 0 || i >= trip[type].length) return res.status(400).json({ error: 'Invalid index' })
  trip[type].splice(i, 1)
  
  const collection = getTripsCollection()
  let updated
  if (collection) {
    await collection.updateOne({ id: trip.id }, { $set: { [type]: trip[type], updatedAt: new Date().toISOString() } })
    updated = await collection.findOne({ id: trip.id })
  } else {
    updated = memoryStore.trips.update(trip.id, { [type]: trip[type] })
  }
  
  res.json(updated)
})

export interface FlightSegment {
  airline: string
  flightNumber: string
  departureAirportCode: string
  arrivalAirportCode: string
  departureDateTime: string
  arrivalDateTime: string
  durationMinutes?: number
  aircraftType?: string
  terminal?: { departure: string | null, arrival: string | null }
  gate?: { departure: string | null, arrival: string | null }
  cost?: number
  carryOn?: boolean
  checkedBag?: boolean
  bookingNumber?: string
  bookingAgency?: string
}

export interface HotelBooking {
  placeId: string
  name: string
  address: string
  checkIn: string
  checkOut: string
  nights: number
  cost?: number
  rating?: number | null
  distanceFromAirport?: string
  travelTimeFromAirport?: string
}

export interface RideLeg {
  type?: 'taxi' | 'rental'
  pickup: string
  dropoff: string
  pickupPlaceId?: string
  dropoffPlaceId?: string
  distance?: string
  duration?: string
  mode?: string
  date?: string
  time?: string
  dateTime?: string
  cost?: number
  // Taxi/Ride specific
  notes?: string
  // Car Rental specific
  voucherNumber?: string
  rentalCompany?: string
  pickupDate?: string
  pickupTime?: string
  returnDate?: string
  returnTime?: string
}

export interface AttractionVisit {
  placeId: string
  name: string
  address: string
  scheduledDate: string
  scheduledTime?: string
  rating?: number | null
  website?: string
  cost?: number
}

export interface Trip {
  id: string
  name: string
  destinations: string[]
  startDate: string
  endDate: string
  flights: FlightSegment[]
  hotels: HotelBooking[]
  rides: RideLeg[]
  attractions: AttractionVisit[]
  createdAt?: string
  updatedAt?: string
}

export interface DayBucket {
  date: string
  flights: FlightSegment[]
  hotels: HotelBooking[]
  rides: RideLeg[]
  attractions: AttractionVisit[]
}

export function groupTripByDay(trip: Trip): DayBucket[] {
  const dayMap: Record<string, DayBucket> = {}
  const range = dateRange(trip.startDate, trip.endDate)
  range.forEach(d => dayMap[d] = { date: d, flights: [], hotels: [], rides: [], attractions: [] })

  const add = (date: string, kind: keyof DayBucket, item: any) => {
    if (!dayMap[date]) dayMap[date] = { date, flights: [], hotels: [], rides: [], attractions: [] }
    ;(dayMap[date][kind] as any[]).push(item)
  }

  trip.flights.forEach(f => add(f.departureDateTime.slice(0,10), 'flights', f))
  trip.hotels.forEach(h => add(h.checkIn.slice(0,10), 'hotels', h))
  trip.rides.forEach(r => {
    const rideDate = r.date || r.dateTime?.slice(0,10) || r.pickupDate
    if (rideDate) add(rideDate, 'rides', r)
  })
  trip.attractions.forEach(a => add(a.scheduledDate, 'attractions', a))

  return Object.values(dayMap).sort((a,b) => a.date.localeCompare(b.date))
}

export function dateRange(start: string, end: string): string[] {
  const result: string[] = []
  // Parse dates as local dates to avoid timezone issues
  const [startY, startM, startD] = start.split('-').map(Number)
  const [endY, endM, endD] = end.split('-').map(Number)
  const cur = new Date(startY, startM - 1, startD)
  const endDate = new Date(endY, endM - 1, endD)
  
  while (cur <= endDate) {
    const year = cur.getFullYear()
    const month = String(cur.getMonth() + 1).padStart(2, '0')
    const day = String(cur.getDate()).padStart(2, '0')
    result.push(`${year}-${month}-${day}`)
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

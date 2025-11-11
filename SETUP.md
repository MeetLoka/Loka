# Meet Loka - Travel Management System

## Backend Setup

The backend has been set up in the `backend/` folder with Google APIs integration for Hotels, Rides, and Attractions.

### Installation

1. Navigate to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Add your Google API key to `.env`:

```
GOOGLE_API_KEY=your_actual_google_api_key_here
PORT=3001
```

### Running the Backend

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The server will run on `http://localhost:3001`

### API Endpoints

#### Hotels

- `GET /api/hotels/autocomplete?input={query}` - Search for hotels
- `GET /api/hotels/details?place_id={id}` - Get hotel details
- `GET /api/hotels/distance-from-airport?hotel_place_id={id}&airport_code={code}` - Calculate distance from airport

#### Rides

- `GET /api/rides/location-autocomplete?input={query}` - Search for locations
- `GET /api/rides/location-details?place_id={id}` - Get location details
- `GET /api/rides/distance?from={origin}&to={destination}&mode={mode}` - Calculate distance
- `POST /api/rides/estimate` - Get ride estimates with multiple modes

#### Places/Attractions

- `GET /api/places/autocomplete?input={query}&types={types}` - Search for attractions
- `GET /api/places/details?place_id={id}` - Get place details
- `GET /api/places/nearby?lat={lat}&lng={lng}&radius={radius}&type={type}` - Search nearby places
- `GET /api/places/search-by-category?lat={lat}&lng={lng}&category={category}&radius={radius}` - Search by category

## Frontend Setup

The frontend React components have been created/updated:

- `RideSearch.tsx` - Component for searching and adding rides
- `AttractionSearch.tsx` - Component for searching and adding attractions
- `HotelSearch.tsx` - Existing component for hotel search
- `TripWizard/TripHotelStep.tsx` - Hotel selection step
- `TripWizard/TripTransportationStep.tsx` - Transportation/Ride selection step
- `TripWizard/TripAttractionsStep.tsx` - Attractions selection step

### Running the Frontend

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Google APIs Required

Make sure to enable the following APIs in your Google Cloud Console:

1. **Places API**
2. **Distance Matrix API**
3. **Geocoding API** (optional, for better location data)

## Features

### Hotel Management

- Autocomplete search powered by Google Places
- View hotel details (name, address, rating, photos, reviews)
- Calculate distance and travel time from nearest airport
- Add hotels to trip itinerary

### Ride/Transportation Management

- Search pickup and dropoff locations
- Calculate distance and estimated travel time
- Support for multiple transportation modes (driving, transit)
- Add cost and datetime information
- Visual distance/duration display

### Attractions & Activities

- Search for attractions, restaurants, museums, parks
- View detailed information (rating, opening hours, website)
- Categorize attractions (sight, restaurant, shopping, entertainment, etc.)
- Set visit date/time and duration
- Add to trip timeline

### Trip Creation Flow

1. **Basic Info** - Trip name, dates, destinations
2. **Flights** - Add flight details
3. **Hotels** - Search and add accommodations
4. **Transportation** - Add rides/taxis between locations
5. **Attractions** - Add places to visit
6. **Review** - Review complete itinerary with costs and timeline

## Troubleshooting

### Backend not connecting

- Ensure the backend server is running on port 3001
- Check that GOOGLE_API_KEY is properly set in `.env`
- Verify the API key has the required APIs enabled

### Google API errors

- Check API key permissions in Google Cloud Console
- Verify billing is enabled (required for Distance Matrix API)
- Check API quotas and usage limits

### CORS issues

- Backend is configured with CORS enabled for all origins
- If issues persist, check your browser console for specific errors

## Next Steps

1. Set up backend server with Google API key
2. Test hotel search functionality
3. Test ride distance calculation
4. Test attraction search
5. Complete a full trip creation flow
6. Add data persistence (database integration)
7. Implement trip editing and deletion
8. Add trip details view with map integration

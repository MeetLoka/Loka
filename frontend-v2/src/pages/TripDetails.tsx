import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getTrip,
  GOOGLE_MAPS_API_KEY,
  deleteTrip,
  deleteFlightFromTrip,
  deleteHotelFromTrip,
  deleteRideFromTrip,
  deleteAttractionFromTrip,
  updateTrip,
  addFlightToTrip,
  addHotelToTrip,
  addRideToTrip,
  addAttractionToTrip,
} from '../services/api';
import type { Trip } from '../types/domain';
import { groupTripByDay } from '../types/domain';
import {
  AddFlightForm,
  AddHotelForm,
  AddRideForm,
  AddAttractionForm,
} from '../components/AddItemForms';
import GenerateRide from '../components/GenerateRide';
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
  Polyline,
  DirectionsService,
  DirectionsRenderer,
} from '@react-google-maps/api';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Divider,
  Collapse,
  CardActionArea,
  TextField,
  DialogActions,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Flight as FlightIcon,
  Hotel as HotelIcon,
  DirectionsCar,
  AttractionsOutlined,
  Restaurant as RestaurantIcon,
  CalendarMonth,
  Close,
  AccessTime,
  ViewList,
  Timeline as TimelineIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Map as MapIcon,
  ExpandMore,
  ExpandLess,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import ShareTripDialog from '../components/ShareTripDialog';

type FilterCategory = 'all' | 'flights' | 'hotels' | 'rides' | 'attractions';
type ViewMode = 'list' | 'timeline' | 'map';

// Small embedded map component for ride routes
function RideMapEmbed({ ride }: { ride: any }) {
  const [directions, setDirections] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const mapContainerStyle = {
    width: '100%',
    height: '250px',
    borderRadius: '8px',
  };

  const directionsCallback = (result: any, status: any) => {
    if (status === 'OK' && result) {
      setDirections(result);
      setError(null);
    } else {
      setError(`Unable to calculate route: ${status}`);
    }
  };

  const onLoad = () => {
    setIsLoaded(true);
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Google Maps API key is not configured.
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} onLoad={onLoad}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={{ lat: 0, lng: 0 }}
          zoom={13}
        >
          {isLoaded && !directions && ride.pickup && ride.dropoff && (
            <DirectionsService
              options={{
                origin: ride.pickup,
                destination: ride.dropoff,
                travelMode:
                  window.google?.maps?.TravelMode?.DRIVING ||
                  ('DRIVING' as any),
              }}
              callback={directionsCallback}
            />
          )}
          {directions && (
            <DirectionsRenderer
              options={{
                directions: directions,
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      {directions && (
        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          <Chip
            size="small"
            label={`Distance: ${directions.routes[0]?.legs[0]?.distance?.text}`}
            variant="outlined"
          />
          <Chip
            size="small"
            label={`Duration: ${directions.routes[0]?.legs[0]?.duration?.text}`}
            variant="outlined"
          />
        </Stack>
      )}
    </Box>
  );
}

// Map component to display trip locations
function TripMapView({ trip }: { trip: Trip }) {
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  const [mapZoom, setMapZoom] = useState(4);

  useEffect(() => {
    // Calculate center based on hotels and attractions
    const locations: { lat: number; lng: number }[] = [];

    // For now, we'll use a default center
    // In a real implementation, you'd geocode hotel addresses
    if (trip.hotels.length > 0 || trip.attractions.length > 0) {
      // Default to a world view, or you could geocode the destinations
      setMapCenter({ lat: 20, lng: 0 });
      setMapZoom(2);
    }
  }, [trip]);

  const mapContainerStyle = {
    width: '100%',
    height: '600px',
  };

  // Collect all markers
  const markers: Array<{
    id: string;
    position: { lat: number; lng: number };
    type: string;
    data: any;
  }> = [];

  // Note: Hotels and attractions need geocoding to show on map
  // This is a placeholder implementation

  return (
    <Card>
      <CardContent>
        {!GOOGLE_MAPS_API_KEY ? (
          <Alert severity="warning">
            Google Maps API key is not configured. Please add
            VITE_GOOGLE_MAPS_API_KEY to your .env file.
          </Alert>
        ) : (
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={mapZoom}
            >
              {markers.map((marker) => (
                <Marker
                  key={marker.id}
                  position={marker.position}
                  onClick={() => setSelectedMarker(marker)}
                />
              ))}

              {selectedMarker && (
                <InfoWindow
                  position={selectedMarker.position}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {selectedMarker.data.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedMarker.type}
                    </Typography>
                  </Box>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Map Integration Status
          </Typography>
          <Typography variant="caption" display="block">
            ✅ Google Maps API configured (
            {GOOGLE_MAPS_API_KEY ? 'Key found' : 'Key missing'})
          </Typography>
          <Typography variant="caption" display="block">
            ⚠️ Hotel and attraction locations need geocoding to display on the
            map
          </Typography>
          <Typography variant="caption" display="block">
            📍 To show locations, addresses need to be converted to
            latitude/longitude coordinates
          </Typography>
        </Alert>

        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Your Trip Data:
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            • {trip.hotels.length} hotels
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            • {trip.attractions.length} attractions
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            • {trip.flights.length} flights
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            • {trip.rides.length} rides
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function TripDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [expandedItem, setExpandedItem] = useState<{
    type: string;
    index: number;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: 'trip' | 'flight' | 'hotel' | 'ride' | 'attraction' | null;
    index?: number;
  }>({ open: false, type: null });
  const [editTrip, setEditTrip] = useState<{
    open: boolean;
    name: string;
    destinations: string;
    startDate: string;
    endDate: string;
  }>({
    open: false,
    name: '',
    destinations: '',
    startDate: '',
    endDate: '',
  });
  const [editItem, setEditItem] = useState<{
    open: boolean;
    type: 'flight' | 'hotel' | 'ride' | 'attraction' | null;
    index: number;
    data: any;
  }>({
    open: false,
    type: null,
    index: -1,
    data: null,
  });
  const [showGenerateRide, setShowGenerateRide] = useState(false);
  const [selectedItems, setSelectedItems] = useState<
    Array<{
      type: string;
      index: number;
      name: string;
      address: string;
      date?: string;
      time?: string;
    }>
  >([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const isOwner = trip?.isOwner !== false; // Default to true if not specified
  const isShared = trip?.isShared === true;

  useEffect(() => {
    if (id)
      getTrip(id)
        .then(setTrip)
        .catch((e) => setError(e.message));
  }, [id]);

  const refreshTrip = async () => {
    if (id) {
      try {
        const updated = await getTrip(id);
        setTrip(updated);
      } catch (e: any) {
        setError(e.message);
      }
    }
  };

  // Helper function to extract time from datetime string (handles both formats)
  const extractTime = (dateTimeStr: string): string => {
    if (!dateTimeStr) return '';
    // Handle both ISO format (2025-11-13T10:20:00) and space format (2025-11-13 10:20+02:00)
    const parts = dateTimeStr.includes('T')
      ? dateTimeStr.split('T')
      : dateTimeStr.split(' ');
    return parts[1]?.slice(0, 5) || '';
  };

  // Helper function to format datetime for datetime-local input (handles both formats)
  const formatDateTimeForInput = (dateTimeStr: string): string => {
    if (!dateTimeStr) return '';
    // Handle both ISO format (2025-11-13T10:20:00) and space format (2025-11-13 10:20+02:00)
    const parts = dateTimeStr.includes('T')
      ? dateTimeStr.split('T')
      : dateTimeStr.split(' ');
    const datePart = parts[0];
    const timePart = parts[1]?.slice(0, 5) || '00:00';
    return `${datePart}T${timePart}`;
  };

  const handleDeleteTrip = async () => {
    if (!id) return;
    try {
      await deleteTrip(id);
      navigate('/');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleteConfirm({ open: false, type: null });
    }
  };

  const handleDeleteItem = async (
    type: 'flight' | 'hotel' | 'ride' | 'attraction',
    index: number
  ) => {
    if (!id) return;
    try {
      let updated: Trip;
      if (type === 'flight') updated = await deleteFlightFromTrip(id, index);
      else if (type === 'hotel') updated = await deleteHotelFromTrip(id, index);
      else if (type === 'ride') updated = await deleteRideFromTrip(id, index);
      else updated = await deleteAttractionFromTrip(id, index);

      setTrip(updated);
      setExpandedItem(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleteConfirm({ open: false, type: null });
    }
  };

  const handleEditTripOpen = () => {
    if (!trip) return;
    setEditTrip({
      open: true,
      name: trip.name,
      destinations: trip.destinations.join(', '),
      startDate: trip.startDate,
      endDate: trip.endDate,
    });
  };

  const handleEditTripSave = async () => {
    if (!id || !trip) return;
    try {
      const updated = await updateTrip(id, {
        name: editTrip.name,
        destinations: editTrip.destinations
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean),
        startDate: editTrip.startDate,
        endDate: editTrip.endDate,
      });
      setTrip(updated);
      setEditTrip({
        open: false,
        name: '',
        destinations: '',
        startDate: '',
        endDate: '',
      });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleEditItemOpen = (
    type: 'flight' | 'hotel' | 'ride' | 'attraction',
    index: number,
    data: any
  ) => {
    setEditItem({ open: true, type, index, data: { ...data } });
  };

  const handleItemSelect = (type: string, index: number, item: any) => {
    // Adjust type for flights first (before checking if selected)
    let adjustedType = type;
    if (type === 'flight') {
      adjustedType = 'flight-arr';
    }

    const itemId = `${adjustedType}-${index}`;
    const existingIndex = selectedItems.findIndex(
      (sel) => `${sel.type}-${sel.index}` === itemId
    );

    if (existingIndex >= 0) {
      // Deselect
      setSelectedItems(selectedItems.filter((_, i) => i !== existingIndex));
    } else if (selectedItems.length < 2) {
      // Select (max 2 items)
      let name = '';
      let address = '';
      let date = '';
      let time = '';

      if (type === 'flight') {
        // For flights, use arrival airport location (where you land)
        name = `${item.arrivalAirportCode} Airport`;
        address = item.arrivalAirportCode;
        // Handle both ISO format (2025-11-13T05:15:00) and space format (2025-11-13 05:15+02:00)
        const dateTimeParts = item.arrivalDateTime.includes('T')
          ? item.arrivalDateTime.split('T')
          : item.arrivalDateTime.split(' ');
        date = dateTimeParts[0];
        time = dateTimeParts[1]?.slice(0, 5);
      } else if (type === 'hotel') {
        name = item.name;
        address = item.address;
        date = item.checkIn.split('T')[0];
      } else if (type === 'attraction') {
        name = item.name;
        address = item.address;
        date = item.scheduledDate.split('T')[0];
        time = item.scheduledTime;
      }

      setSelectedItems([
        ...selectedItems,
        { type: adjustedType, index, name, address, date, time },
      ]);
    }
  };

  const handleCreateRideFromSelection = () => {
    if (selectedItems.length === 2) {
      setShowGenerateRide(true);
    }
  };

  const handleEditItemSave = async () => {
    if (!id || !editItem.type || editItem.index === -1) return;
    try {
      // Delete old item and add updated one
      let updated: Trip;
      if (editItem.type === 'flight') {
        updated = await deleteFlightFromTrip(id, editItem.index);
        updated = await addFlightToTrip(id, editItem.data);
      } else if (editItem.type === 'hotel') {
        updated = await deleteHotelFromTrip(id, editItem.index);
        updated = await addHotelToTrip(id, editItem.data);
      } else if (editItem.type === 'ride') {
        updated = await deleteRideFromTrip(id, editItem.index);
        updated = await addRideToTrip(id, editItem.data);
      } else {
        updated = await deleteAttractionFromTrip(id, editItem.index);
        updated = await addAttractionToTrip(id, editItem.data);
      }

      setTrip(updated);
      setEditItem({ open: false, type: null, index: -1, data: null });
      setExpandedItem(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!trip)
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );

  const buckets = groupTripByDay(trip);
  const totalCost = [
    ...trip.flights.map((f) => f.cost || 0),
    ...trip.hotels.map((h) => h.cost || 0),
    ...trip.rides.map((r) => r.cost || 0),
    ...trip.attractions.map((a) => a.cost || 0),
  ].reduce((a, b) => a + b, 0);

  // Filter helper function
  const shouldShowCategory = (category: string) => {
    return filter === 'all' || filter === category;
  };

  // Filter days to show filtered items for each category
  // Keep all days in the range, even if empty
  const filteredBuckets = buckets.map((day) => ({
    ...day,
    flights: shouldShowCategory('flights') ? day.flights : [],
    hotels: shouldShowCategory('hotels') ? day.hotels : [],
    rides: shouldShowCategory('rides') ? day.rides : [],
    attractions: shouldShowCategory('attractions') ? day.attractions : [],
  }));

  return (
    <Box>
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          bgcolor: 'primary.main',
          color: 'white',
          borderRadius: 3,
          background:
            'linear-gradient(135deg, --color-primary 0%, --color-primary 100%)',
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Button
            component={Link}
            to="/"
            startIcon={<ArrowBack />}
            sx={{
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            Back to Trips
          </Button>
          <Stack direction="row" spacing={1}>
            {isShared && (
              <Chip
                icon={<VisibilityIcon />}
                label="View Only"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            )}
            {isOwner && (
              <>
                <Button
                  startIcon={<ShareIcon />}
                  onClick={() => setShareDialogOpen(true)}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.2)',
                      borderColor: 'rgba(255,255,255,0.8)',
                    },
                  }}
                  variant="outlined"
                >
                  Share
                </Button>
                <Button
                  startIcon={<DirectionsCar />}
                  onClick={() => setShowGenerateRide(true)}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.2)',
                      borderColor: 'rgba(255,255,255,0.8)',
                    },
                  }}
                  variant="outlined"
                >
                  Generate Ride
                </Button>
                <Button
                  startIcon={<EditIcon />}
                  onClick={handleEditTripOpen}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.2)',
                      borderColor: 'rgba(255,255,255,0.8)',
                    },
                  }}
                  variant="outlined"
                >
                  Edit Trip
                </Button>
                <Button
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteConfirm({ open: true, type: 'trip' })}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': {
                      bgcolor: 'rgba(255,0,0,0.2)',
                      borderColor: 'rgba(255,255,255,0.8)',
                    },
                  }}
                  variant="outlined"
                >
                  Delete Trip
                </Button>
              </>
            )}
          </Stack>
        </Stack>

        <Typography variant="h3" fontWeight={700} gutterBottom>
          {trip.name}
        </Typography>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
          <Chip
            icon={<CalendarMonth sx={{ color: 'white !important' }} />}
            label={`${new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → ${new Date(
              trip.endDate
            ).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}`}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'white' },
            }}
          />
          {trip.destinations?.length > 0 && (
            <Typography variant="h6" sx={{ opacity: 0.95, fontWeight: 500 }}>
              📍 {trip.destinations.join(', ')}
            </Typography>
          )}
        </Stack>

        {/* Trip Summary Stats */}
        <Stack direction="row" spacing={4} mt={3} flexWrap="wrap">
          {trip.flights?.length > 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <FlightIcon />
              <Typography variant="h6" fontWeight={600}>
                {trip.flights.length}{' '}
                {trip.flights.length === 1 ? 'Flight' : 'Flights'}
              </Typography>
            </Stack>
          )}
          {trip.hotels?.length > 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <HotelIcon />
              <Typography variant="h6" fontWeight={600}>
                {trip.hotels.length}{' '}
                {trip.hotels.length === 1 ? 'Hotel' : 'Hotels'}
              </Typography>
            </Stack>
          )}
          {trip.rides?.length > 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <DirectionsCar />
              <Typography variant="h6" fontWeight={600}>
                {trip.rides.length} {trip.rides.length === 1 ? 'Ride' : 'Rides'}
              </Typography>
            </Stack>
          )}
          {trip.attractions?.length > 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <AttractionsOutlined />
              <Typography variant="h6" fontWeight={600}>
                {trip.attractions.length}{' '}
                {trip.attractions.length === 1 ? 'Attraction' : 'Attractions'}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Action Bar */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <AddItemModalLauncher trip={trip} onUpdated={setTrip} />

        <Stack direction="row" spacing={2} alignItems="center">
          {/* View Mode Toggle */}
          <Paper
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <Stack direction="row">
              <Button
                size="small"
                startIcon={<ViewList />}
                onClick={() => setViewMode('list')}
                sx={{
                  borderRadius: 0,
                  borderRight: '1px solid',
                  borderColor: 'divider',
                  bgcolor: viewMode === 'list' ? 'primary.main' : 'transparent',
                  color: viewMode === 'list' ? 'white' : 'text.primary',
                  '&:hover': {
                    bgcolor:
                      viewMode === 'list' ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                List
              </Button>
              <Button
                size="small"
                startIcon={<TimelineIcon />}
                onClick={() => setViewMode('timeline')}
                sx={{
                  borderRadius: 0,
                  borderRight: '1px solid',
                  borderColor: 'divider',
                  bgcolor:
                    viewMode === 'timeline' ? 'primary.main' : 'transparent',
                  color: viewMode === 'timeline' ? 'white' : 'text.primary',
                  '&:hover': {
                    bgcolor:
                      viewMode === 'timeline' ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                Timeline
              </Button>
              <Button
                size="small"
                startIcon={<MapIcon />}
                onClick={() => setViewMode('map')}
                sx={{
                  borderRadius: 0,
                  bgcolor: viewMode === 'map' ? 'primary.main' : 'transparent',
                  color: viewMode === 'map' ? 'white' : 'text.primary',
                  '&:hover': {
                    bgcolor:
                      viewMode === 'map' ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                Map
              </Button>
            </Stack>
          </Paper>

          {totalCost > 0 && (
            <Paper
              elevation={0}
              sx={{
                px: 3,
                py: 1.5,
                bgcolor: 'success.lighter',
                border: '2px solid',
                borderColor: 'success.main',
                borderRadius: 2,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    Total Budget
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    color="success.main"
                  >
                    ${totalCost.toFixed(2)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Stack>

      {/* Filter Bar */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={filter}
          onChange={(_, newValue) => setFilter(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 64 },
          }}
        >
          <Tab
            value="all"
            label="All"
            icon={<CalendarMonth />}
            iconPosition="start"
          />
          <Tab
            value="flights"
            label={`Flights (${trip.flights.length})`}
            icon={<FlightIcon />}
            iconPosition="start"
          />
          <Tab
            value="hotels"
            label={`Hotels (${trip.hotels.length})`}
            icon={<HotelIcon />}
            iconPosition="start"
          />
          <Tab
            value="rides"
            label={`Rides (${trip.rides.length})`}
            icon={<DirectionsCar />}
            iconPosition="start"
          />
          <Tab
            value="attractions"
            label={`Attractions (${trip.attractions.length})`}
            icon={<AttractionsOutlined />}
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <Stack spacing={2}>
          {/* Show message if filtering and no items of that type exist */}
          {filter !== 'all' &&
            trip.flights.length === 0 &&
            filter === 'flights' && (
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    py={6}
                  >
                    <FlightIcon
                      sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
                    />
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      gutterBottom
                    >
                      No flights found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      No flights have been added to this trip yet.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          {filter !== 'all' &&
            trip.hotels.length === 0 &&
            filter === 'hotels' && (
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    py={6}
                  >
                    <HotelIcon
                      sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
                    />
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      gutterBottom
                    >
                      No hotels found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      No hotels have been added to this trip yet.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          {filter !== 'all' &&
            trip.rides.length === 0 &&
            filter === 'rides' && (
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    py={6}
                  >
                    <DirectionsCar
                      sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
                    />
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      gutterBottom
                    >
                      No rides found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      No rides have been added to this trip yet.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          {filter !== 'all' &&
            trip.attractions.length === 0 &&
            filter === 'attractions' && (
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    py={6}
                  >
                    <AttractionsOutlined
                      sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
                    />
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      gutterBottom
                    >
                      No attractions found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      No attractions have been added to this trip yet.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

          {filteredBuckets.map((day, index) => {
            const dayNumber = index + 1;
            const [year, month, dayOfMonth] = day.date.split('-');
            const formattedDate = `${dayOfMonth}-${month}-${year}`;

            return (
              <Card key={day.date}>
                <CardContent sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" fontWeight="bold">
                    DAY {dayNumber} - {formattedDate}
                  </Typography>
                </CardContent>
                <CardContent>
                  <Stack spacing={2}>
                    {day.flights.length > 0 && (
                      <Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          mb={1}
                        >
                          <FlightIcon fontSize="small" color="primary" />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Flights
                          </Typography>
                        </Stack>
                        {day.flights.map((f, i) => {
                          // Find global index of this flight in trip.flights
                          const globalIndex = trip.flights.findIndex(
                            (flight) =>
                              flight.flightNumber === f.flightNumber &&
                              flight.departureDateTime === f.departureDateTime
                          );
                          const isExpanded =
                            expandedItem?.type === 'flight' &&
                            expandedItem?.index === globalIndex;
                          const isSelected = selectedItems.some(
                            (sel) =>
                              sel.type === 'flight-arr' &&
                              sel.index === globalIndex
                          );
                          return (
                            <Paper
                              key={i}
                              variant="outlined"
                              sx={{
                                mb: 1,
                                overflow: 'hidden',
                                bgcolor: isSelected
                                  ? 'action.selected'
                                  : 'inherit',
                              }}
                            >
                              <CardActionArea
                                onClick={() =>
                                  setExpandedItem(
                                    isExpanded
                                      ? null
                                      : { type: 'flight', index: globalIndex }
                                  )
                                }
                                sx={{ p: 1.5 }}
                              >
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="center"
                                >
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    flex={1}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleItemSelect(
                                          'flight',
                                          globalIndex,
                                          f
                                        );
                                      }}
                                      disabled={
                                        selectedItems.length >= 2 && !isSelected
                                      }
                                    />
                                    <Box>
                                      <Typography variant="body2">
                                        <strong>{f.flightNumber}</strong>{' '}
                                        {f.departureAirportCode}→
                                        {f.arrivalAirportCode}
                                      </Typography>
                                      <Stack
                                        direction="row"
                                        spacing={2}
                                        mt={0.5}
                                      >
                                        <Chip
                                          icon={<AccessTime />}
                                          size="small"
                                          label={`${extractTime(f.departureDateTime)} - ${extractTime(f.arrivalDateTime)}`}
                                        />
                                        {f.cost && (
                                          <Chip
                                            size="small"
                                            label={`$${f.cost}`}
                                            color="success"
                                          />
                                        )}
                                      </Stack>
                                    </Box>
                                  </Stack>
                                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                </Stack>
                              </CardActionArea>
                              <Collapse in={isExpanded}>
                                <Box
                                  sx={{
                                    px: 1.5,
                                    pb: 1.5,
                                    pt: 0.5,
                                    borderTop: 1,
                                    borderColor: 'divider',
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    mb={0.5}
                                  >
                                    <strong>Flight Details</strong>
                                  </Typography>
                                  {f.terminal?.departure && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Departure Terminal: {f.terminal.departure}
                                    </Typography>
                                  )}
                                  {f.gate?.departure && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Departure Gate: {f.gate.departure}
                                    </Typography>
                                  )}
                                  {f.terminal?.arrival && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Arrival Terminal: {f.terminal.arrival}
                                    </Typography>
                                  )}
                                  {f.gate?.arrival && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Arrival Gate: {f.gate.arrival}
                                    </Typography>
                                  )}
                                  {f.durationMinutes && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Duration:{' '}
                                      {Math.floor(f.durationMinutes / 60)}h{' '}
                                      {f.durationMinutes % 60}m
                                    </Typography>
                                  )}
                                  {f.aircraftType && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Aircraft: {f.aircraftType}
                                    </Typography>
                                  )}
                                  {(f.bookingNumber ||
                                    f.bookingAgency ||
                                    f.carryOn !== undefined ||
                                    f.checkedBag !== undefined) && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                      mt={1}
                                    >
                                      <strong>Booking Info</strong>
                                    </Typography>
                                  )}
                                  {f.bookingNumber && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Booking Number: {f.bookingNumber}
                                    </Typography>
                                  )}
                                  {f.bookingAgency && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Agency: {f.bookingAgency}
                                    </Typography>
                                  )}
                                  {f.carryOn !== undefined && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Carry-on:{' '}
                                      {f.carryOn ? 'Included' : 'Not included'}
                                    </Typography>
                                  )}
                                  {f.checkedBag !== undefined && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Checked Bag:{' '}
                                      {f.checkedBag
                                        ? 'Included'
                                        : 'Not included'}
                                    </Typography>
                                  )}
                                  {f.numberOfTickets && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                      mt={1}
                                    >
                                      <strong>Tickets:</strong>{' '}
                                      {f.numberOfTickets}{' '}
                                      {f.numberOfTickets === 1
                                        ? 'ticket'
                                        : 'tickets'}
                                      {f.cost && f.costType && (
                                        <span>
                                          {' • '}
                                          {f.costType === 'per-ticket'
                                            ? `$${f.cost} per ticket (Total: $${f.cost * f.numberOfTickets})`
                                            : `Total: $${f.cost}`}
                                        </span>
                                      )}
                                    </Typography>
                                  )}
                                  {isOwner && (
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      sx={{ mt: 1 }}
                                    >
                                      <Button
                                        size="small"
                                        color="primary"
                                        startIcon={<EditIcon />}
                                        onClick={() =>
                                          handleEditItemOpen('flight', i, f)
                                        }
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="small"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() =>
                                          setDeleteConfirm({
                                            open: true,
                                            type: 'flight',
                                            index: i,
                                          })
                                        }
                                      >
                                        Delete
                                      </Button>
                                    </Stack>
                                  )}
                                </Box>
                              </Collapse>
                            </Paper>
                          );
                        })}
                      </Box>
                    )}
                    {day.hotels.length > 0 && (
                      <Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          mb={1}
                        >
                          <HotelIcon fontSize="small" color="primary" />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Hotels
                          </Typography>
                        </Stack>
                        {day.hotels.map((h, i) => {
                          // Find global index of this hotel in trip.hotels
                          const globalIndex = trip.hotels.findIndex(
                            (hotel) =>
                              hotel.name === h.name &&
                              hotel.address === h.address &&
                              hotel.checkIn === h.checkIn
                          );
                          const isExpanded =
                            expandedItem?.type === 'hotel' &&
                            expandedItem?.index === globalIndex;
                          const isSelected = selectedItems.some(
                            (sel) =>
                              sel.type === 'hotel' && sel.index === globalIndex
                          );
                          return (
                            <Paper
                              key={i}
                              variant="outlined"
                              sx={{
                                mb: 1,
                                overflow: 'hidden',
                                bgcolor: isSelected
                                  ? 'action.selected'
                                  : 'inherit',
                              }}
                            >
                              <CardActionArea
                                onClick={() =>
                                  setExpandedItem(
                                    isExpanded
                                      ? null
                                      : { type: 'hotel', index: globalIndex }
                                  )
                                }
                                sx={{ p: 1.5 }}
                              >
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="center"
                                >
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    flex={1}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleItemSelect(
                                          'hotel',
                                          globalIndex,
                                          h
                                        );
                                      }}
                                      disabled={
                                        selectedItems.length >= 2 && !isSelected
                                      }
                                    />
                                    <Box>
                                      <Typography variant="body2">
                                        <strong>{h.name}</strong>
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                      >
                                        Check-in: {h.checkIn}
                                      </Typography>
                                      {h.cost && (
                                        <Chip
                                          size="small"
                                          label={`$${h.cost}`}
                                          color="success"
                                          sx={{ mt: 0.5 }}
                                        />
                                      )}
                                    </Box>
                                  </Stack>
                                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                </Stack>
                              </CardActionArea>
                              <Collapse in={isExpanded}>
                                <Box
                                  sx={{
                                    px: 1.5,
                                    pb: 1.5,
                                    pt: 0.5,
                                    borderTop: 1,
                                    borderColor: 'divider',
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    mb={0.5}
                                  >
                                    <strong>Hotel Details</strong>
                                  </Typography>
                                  {h.address && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Address: {h.address}
                                    </Typography>
                                  )}
                                  {h.checkOut && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Check-out: {h.checkOut}
                                    </Typography>
                                  )}
                                  {h.nights && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Nights: {h.nights}
                                    </Typography>
                                  )}
                                  {h.rating && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Rating: {h.rating} ⭐
                                    </Typography>
                                  )}
                                  {h.distanceFromAirport && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Distance from airport:{' '}
                                      {h.distanceFromAirport}
                                    </Typography>
                                  )}
                                  {h.travelTimeFromAirport && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Travel time from airport:{' '}
                                      {h.travelTimeFromAirport}
                                    </Typography>
                                  )}
                                  {isOwner && (
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      sx={{ mt: 1 }}
                                    >
                                      <Button
                                        size="small"
                                        color="primary"
                                        startIcon={<EditIcon />}
                                        onClick={() =>
                                          handleEditItemOpen('hotel', i, h)
                                        }
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="small"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() =>
                                          setDeleteConfirm({
                                            open: true,
                                            type: 'hotel',
                                            index: i,
                                          })
                                        }
                                      >
                                        Delete
                                      </Button>
                                    </Stack>
                                  )}
                                </Box>
                              </Collapse>
                            </Paper>
                          );
                        })}
                      </Box>
                    )}
                    {day.rides.length > 0 && (
                      <Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          mb={1}
                        >
                          <DirectionsCar fontSize="small" color="primary" />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Transportation
                          </Typography>
                        </Stack>
                        {day.rides.map((r: any, i) => {
                          const isExpanded =
                            expandedItem?.type === 'ride' &&
                            expandedItem?.index === i;
                          return (
                            <Paper
                              key={i}
                              variant="outlined"
                              sx={{ mb: 1, overflow: 'hidden' }}
                            >
                              <CardActionArea
                                onClick={() =>
                                  setExpandedItem(
                                    isExpanded
                                      ? null
                                      : { type: 'ride', index: i }
                                  )
                                }
                                sx={{ p: 1.5 }}
                              >
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="flex-start"
                                >
                                  <Box flex={1}>
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      alignItems="center"
                                      mb={0.5}
                                      flexWrap="wrap"
                                    >
                                      <Chip
                                        label={
                                          r.type === 'rental'
                                            ? '🚗 Car Rental'
                                            : '🚕 Taxi/Ride'
                                        }
                                        size="small"
                                        color={
                                          r.type === 'rental'
                                            ? 'primary'
                                            : 'secondary'
                                        }
                                      />
                                      {r.time && (
                                        <Chip
                                          icon={<AccessTime />}
                                          size="small"
                                          label={r.time}
                                        />
                                      )}
                                      {r.cost && (
                                        <Chip
                                          size="small"
                                          label={`$${r.cost}`}
                                          color="success"
                                        />
                                      )}
                                    </Stack>
                                    <Typography
                                      variant="body2"
                                      fontWeight="medium"
                                    >
                                      {r.pickup} → {r.dropoff}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      {r.distance && `${r.distance} • `}
                                      {r.duration || ''}
                                    </Typography>
                                  </Box>
                                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                </Stack>
                              </CardActionArea>
                              <Collapse in={isExpanded}>
                                <Box
                                  sx={{
                                    px: 1.5,
                                    pb: 1.5,
                                    pt: 0.5,
                                    borderTop: 1,
                                    borderColor: 'divider',
                                  }}
                                >
                                  {r.type === 'rental' && (
                                    <>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                        mb={0.5}
                                      >
                                        <strong>Rental Details</strong>
                                      </Typography>
                                      {r.rentalCompany && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Company: {r.rentalCompany}
                                        </Typography>
                                      )}
                                      {r.voucherNumber && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Voucher: {r.voucherNumber}
                                        </Typography>
                                      )}
                                      {r.pickupDate && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Pickup Date: {r.pickupDate}
                                        </Typography>
                                      )}
                                      {r.pickupTime && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Pickup Time: {r.pickupTime}
                                        </Typography>
                                      )}
                                      {r.returnDate && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Return Date: {r.returnDate}
                                        </Typography>
                                      )}
                                      {r.returnTime && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Return Time: {r.returnTime}
                                        </Typography>
                                      )}
                                      {r.returnLocation && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Return Location: {r.returnLocation}
                                        </Typography>
                                      )}
                                    </>
                                  )}
                                  {r.type === 'taxi' && r.notes && (
                                    <>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                        mb={0.5}
                                      >
                                        <strong>Additional Info</strong>
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                      >
                                        Notes: {r.notes}
                                      </Typography>
                                    </>
                                  )}
                                  {r.mode && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                      mt={
                                        r.type === 'rental' || r.notes ? 1 : 0
                                      }
                                    >
                                      Mode: {r.mode}
                                    </Typography>
                                  )}
                                  <RideMapEmbed ride={r} />
                                  {isOwner && (
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      sx={{ mt: 1 }}
                                    >
                                      <Button
                                        size="small"
                                        color="primary"
                                        startIcon={<EditIcon />}
                                        onClick={() =>
                                          handleEditItemOpen('ride', i, r)
                                        }
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="small"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() =>
                                          setDeleteConfirm({
                                            open: true,
                                            type: 'ride',
                                            index: i,
                                          })
                                        }
                                      >
                                        Delete
                                      </Button>
                                    </Stack>
                                  )}
                                </Box>
                              </Collapse>
                            </Paper>
                          );
                        })}
                      </Box>
                    )}
                    {day.attractions.length > 0 && (
                      <Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          mb={1}
                        >
                          <AttractionsOutlined
                            fontSize="small"
                            color="primary"
                          />
                          <Typography variant="subtitle2" fontWeight="bold">
                            Attractions
                          </Typography>
                        </Stack>
                        {day.attractions.map((a, i) => {
                          // Find global index of this attraction in trip.attractions
                          const globalIndex = trip.attractions.findIndex(
                            (attr) =>
                              attr.name === a.name &&
                              attr.address === a.address &&
                              attr.scheduledDate === a.scheduledDate
                          );
                          const isExpanded =
                            expandedItem?.type === 'attraction' &&
                            expandedItem?.index === globalIndex;
                          const isSelected = selectedItems.some(
                            (sel) =>
                              sel.type === 'attraction' &&
                              sel.index === globalIndex
                          );
                          return (
                            <Paper
                              key={i}
                              variant="outlined"
                              sx={{
                                mb: 1,
                                overflow: 'hidden',
                                bgcolor: isSelected
                                  ? 'action.selected'
                                  : 'inherit',
                              }}
                            >
                              <CardActionArea
                                onClick={() =>
                                  setExpandedItem(
                                    isExpanded
                                      ? null
                                      : {
                                          type: 'attraction',
                                          index: globalIndex,
                                        }
                                  )
                                }
                                sx={{ p: 1.5 }}
                              >
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="center"
                                >
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    flex={1}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleItemSelect(
                                          'attraction',
                                          globalIndex,
                                          a
                                        );
                                      }}
                                      disabled={
                                        selectedItems.length >= 2 && !isSelected
                                      }
                                    />
                                    <Box>
                                      <Typography variant="body2">
                                        <strong>{a.name}</strong>
                                      </Typography>
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        mt={0.5}
                                        flexWrap="wrap"
                                      >
                                        {a.scheduledTime && (
                                          <Chip
                                            icon={<AccessTime />}
                                            size="small"
                                            label={a.scheduledTime}
                                          />
                                        )}
                                        {a.cost && (
                                          <Chip
                                            size="small"
                                            label={`$${a.cost}`}
                                            color="success"
                                          />
                                        )}
                                      </Stack>
                                    </Box>
                                  </Stack>
                                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                </Stack>
                              </CardActionArea>
                              <Collapse in={isExpanded}>
                                <Box
                                  sx={{
                                    px: 1.5,
                                    pb: 1.5,
                                    pt: 0.5,
                                    borderTop: 1,
                                    borderColor: 'divider',
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    mb={0.5}
                                  >
                                    <strong>Attraction Details</strong>
                                  </Typography>
                                  {a.address && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Address: {a.address}
                                    </Typography>
                                  )}
                                  {a.rating && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Rating: {a.rating} ⭐
                                    </Typography>
                                  )}
                                  {a.website && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Website:{' '}
                                      <a
                                        href={a.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'inherit' }}
                                      >
                                        {a.website}
                                      </a>
                                    </Typography>
                                  )}
                                  {a.scheduledDate && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Scheduled: {a.scheduledDate}{' '}
                                      {a.scheduledTime &&
                                        `at ${a.scheduledTime}`}
                                    </Typography>
                                  )}
                                  {a.numberOfTickets && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      <strong>Tickets:</strong>{' '}
                                      {a.numberOfTickets}{' '}
                                      {a.numberOfTickets === 1
                                        ? 'ticket'
                                        : 'tickets'}
                                      {a.cost && a.costType && (
                                        <span>
                                          {' • '}
                                          {a.costType === 'per-ticket'
                                            ? `$${a.cost} per ticket (Total: $${a.cost * a.numberOfTickets})`
                                            : `Total: $${a.cost}`}
                                        </span>
                                      )}
                                    </Typography>
                                  )}
                                  {isOwner && (
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      sx={{ mt: 1 }}
                                    >
                                      <Button
                                        size="small"
                                        color="primary"
                                        startIcon={<EditIcon />}
                                        onClick={() =>
                                          handleEditItemOpen('attraction', i, a)
                                        }
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="small"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() =>
                                          setDeleteConfirm({
                                            open: true,
                                            type: 'attraction',
                                            index: i,
                                          })
                                        }
                                      >
                                        Delete
                                      </Button>
                                    </Stack>
                                  )}
                                </Box>
                              </Collapse>
                            </Paper>
                          );
                        })}
                      </Box>
                    )}
                    {day.flights.length === 0 &&
                      day.hotels.length === 0 &&
                      day.rides.length === 0 &&
                      day.attractions.length === 0 && (
                        <Box sx={{ py: 2, textAlign: 'center' }}>
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            fontStyle="italic"
                          >
                            No activity
                          </Typography>
                        </Box>
                      )}
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <Box>
          {filteredBuckets.map((day, dayIndex) => {
            const dayNumber = dayIndex + 1;
            const [year, month, dayOfMonth] = day.date.split('-');
            const formattedDate = `${dayOfMonth}-${month}-${year}`;
            const allItems = [
              ...day.flights.map((f, i) => ({
                type: 'flight',
                data: f,
                time: extractTime(f.departureDateTime),
                originalIndex: i,
              })),
              ...day.hotels.map((h, i) => ({
                type: 'hotel',
                data: h,
                time: 'Check-in',
                originalIndex: i,
              })),
              ...day.rides.map((r, i) => ({
                type: 'ride',
                data: r,
                time: r.time || r.pickupTime || '',
                originalIndex: i,
              })),
              ...day.attractions.map((a, i) => ({
                type: 'attraction',
                data: a,
                time: a.scheduledTime || '',
                originalIndex: i,
              })),
              ...day.meals.map((m, i) => ({
                type: 'meal',
                data: m,
                time: m.time,
                originalIndex: i,
              })),
            ].sort((a, b) => {
              // Sort chronologically by time
              const timeA = a.time === 'Check-in' ? '15:00' : a.time || '00:00';
              const timeB = b.time === 'Check-in' ? '15:00' : b.time || '00:00';
              return timeA.localeCompare(timeB);
            });

            if (allItems.length === 0 && filter === 'all') {
              return (
                <Card key={day.date} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      DAY {dayNumber} - {formattedDate}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontStyle="italic"
                      sx={{ textAlign: 'center', py: 2 }}
                    >
                      No activity
                    </Typography>
                  </CardContent>
                </Card>
              );
            }

            if (allItems.length === 0) return null;

            return (
              <Card key={day.date} sx={{ mb: 2 }}>
                <CardContent
                  sx={{
                    bgcolor: 'grey.50',
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="h6" fontWeight={600}>
                    DAY {dayNumber} - {formattedDate}
                  </Typography>
                </CardContent>
                <CardContent>
                  <Box sx={{ position: 'relative', pl: 4 }}>
                    {/* Vertical Line */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 15,
                        top: 0,
                        bottom: 0,
                        width: 2,
                        bgcolor: 'divider',
                      }}
                    />

                    <Stack spacing={3}>
                      {allItems.map((item, idx) => {
                        const isExpanded =
                          expandedItem?.type === item.type &&
                          expandedItem?.index === item.originalIndex;
                        return (
                          <Box key={idx} sx={{ position: 'relative' }}>
                            {/* Timeline Dot */}
                            <Box
                              sx={{
                                position: 'absolute',
                                left: -27,
                                top: 4,
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor:
                                  item.type === 'flight'
                                    ? 'primary.main'
                                    : item.type === 'hotel'
                                      ? 'secondary.main'
                                      : item.type === 'ride'
                                        ? 'info.main'
                                        : item.type === 'meal'
                                          ? 'warning.main'
                                          : 'success.main',
                                border: '3px solid white',
                                boxShadow: 1,
                              }}
                            />

                            <Paper
                              elevation={0}
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                overflow: 'hidden',
                              }}
                            >
                              <CardActionArea
                                onClick={() =>
                                  setExpandedItem(
                                    isExpanded
                                      ? null
                                      : {
                                          type: item.type,
                                          index: item.originalIndex,
                                        }
                                  )
                                }
                                sx={{ p: 2 }}
                              >
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="flex-start"
                                >
                                  <Box sx={{ flex: 1 }}>
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      alignItems="center"
                                      mb={1}
                                    >
                                      {item.type === 'flight' && (
                                        <FlightIcon
                                          fontSize="small"
                                          color="primary"
                                        />
                                      )}
                                      {item.type === 'hotel' && (
                                        <HotelIcon
                                          fontSize="small"
                                          color="secondary"
                                        />
                                      )}
                                      {item.type === 'ride' && (
                                        <DirectionsCar
                                          fontSize="small"
                                          color="info"
                                        />
                                      )}
                                      {item.type === 'attraction' && (
                                        <AttractionsOutlined
                                          fontSize="small"
                                          color="success"
                                        />
                                      )}
                                      {item.type === 'meal' && (
                                        <RestaurantIcon
                                          fontSize="small"
                                          color="warning"
                                        />
                                      )}
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        fontWeight={600}
                                      >
                                        {item.type.toUpperCase()}
                                      </Typography>
                                    </Stack>

                                    {item.type === 'flight' && (
                                      <Box>
                                        <Typography
                                          variant="body1"
                                          fontWeight={600}
                                        >
                                          {(item.data as any).flightNumber}{' '}
                                          {
                                            (item.data as any)
                                              .departureAirportCode
                                          }
                                          →
                                          {
                                            (item.data as any)
                                              .arrivalAirportCode
                                          }
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          {extractTime(
                                            (item.data as any).departureDateTime
                                          )}{' '}
                                          -{' '}
                                          {extractTime(
                                            (item.data as any).arrivalDateTime
                                          )}
                                        </Typography>
                                      </Box>
                                    )}

                                    {item.type === 'hotel' && (
                                      <Box>
                                        <Typography
                                          variant="body1"
                                          fontWeight={600}
                                        >
                                          {(item.data as any).name}
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          Check-in: {(item.data as any).checkIn}
                                        </Typography>
                                      </Box>
                                    )}

                                    {item.type === 'ride' && (
                                      <Box>
                                        <Typography
                                          variant="body1"
                                          fontWeight={600}
                                        >
                                          {(item.data as any).pickup} →{' '}
                                          {(item.data as any).dropoff}
                                        </Typography>
                                        {(item.data as any).distance && (
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            {(item.data as any).distance} •{' '}
                                            {(item.data as any).duration}
                                          </Typography>
                                        )}
                                      </Box>
                                    )}

                                    {item.type === 'attraction' && (
                                      <Box>
                                        <Typography
                                          variant="body1"
                                          fontWeight={600}
                                        >
                                          {(item.data as any).name}
                                        </Typography>
                                        {(item.data as any).scheduledTime && (
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            {(item.data as any).scheduledTime}
                                          </Typography>
                                        )}
                                      </Box>
                                    )}

                                    {item.type === 'meal' && (
                                      <Box>
                                        <Typography
                                          variant="body1"
                                          fontWeight={600}
                                        >
                                          {(item.data as any).type.charAt(0).toUpperCase() + (item.data as any).type.slice(1)} at {(item.data as any).hotelName}
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          {(item.data as any).time}
                                        </Typography>
                                        {(item.data as any).isAutoGenerated && (
                                          <Chip
                                            size="small"
                                            label="Auto-generated"
                                            variant="outlined"
                                            sx={{ mt: 0.5 }}
                                          />
                                        )}
                                      </Box>
                                    )}

                                    {item.type !== 'meal' && (item.data as any).cost && (
                                      <Chip
                                        size="small"
                                        label={`$${(item.data as any).cost}`}
                                        color="success"
                                        sx={{ mt: 1 }}
                                      />
                                    )}
                                  </Box>

                                  <Stack spacing={1} alignItems="flex-end">
                                    {item.time && (
                                      <Chip
                                        size="small"
                                        label={item.time}
                                        variant="outlined"
                                      />
                                    )}
                                    {isExpanded ? (
                                      <ExpandLess />
                                    ) : (
                                      <ExpandMore />
                                    )}
                                  </Stack>
                                </Stack>
                              </CardActionArea>

                              <Collapse in={isExpanded}>
                                <Box
                                  sx={{
                                    px: 2,
                                    pb: 2,
                                    pt: 0.5,
                                    borderTop: 1,
                                    borderColor: 'divider',
                                  }}
                                >
                                  {item.type === 'flight' && (
                                    <>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                        mb={0.5}
                                      >
                                        <strong>Flight Details</strong>
                                      </Typography>
                                      {(item.data as any).terminal
                                        ?.departure && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Departure Terminal:{' '}
                                          {
                                            (item.data as any).terminal
                                              .departure
                                          }
                                        </Typography>
                                      )}
                                      {(item.data as any).gate?.departure && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Departure Gate:{' '}
                                          {(item.data as any).gate.departure}
                                        </Typography>
                                      )}
                                      {(item.data as any).terminal?.arrival && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Arrival Terminal:{' '}
                                          {(item.data as any).terminal.arrival}
                                        </Typography>
                                      )}
                                      {(item.data as any).gate?.arrival && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Arrival Gate:{' '}
                                          {(item.data as any).gate.arrival}
                                        </Typography>
                                      )}
                                      {(item.data as any).durationMinutes && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Duration:{' '}
                                          {Math.floor(
                                            (item.data as any).durationMinutes /
                                              60
                                          )}
                                          h{' '}
                                          {(item.data as any).durationMinutes %
                                            60}
                                          m
                                        </Typography>
                                      )}
                                      {(item.data as any).aircraftType && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Aircraft:{' '}
                                          {(item.data as any).aircraftType}
                                        </Typography>
                                      )}
                                      {((item.data as any).bookingNumber ||
                                        (item.data as any).bookingAgency) && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                          mt={1}
                                        >
                                          <strong>Booking Info</strong>
                                        </Typography>
                                      )}
                                      {(item.data as any).bookingNumber && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Booking Number:{' '}
                                          {(item.data as any).bookingNumber}
                                        </Typography>
                                      )}
                                      {(item.data as any).bookingAgency && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Agency:{' '}
                                          {(item.data as any).bookingAgency}
                                        </Typography>
                                      )}
                                      {(item.data as any).carryOn !==
                                        undefined && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Carry-on:{' '}
                                          {(item.data as any).carryOn
                                            ? 'Included'
                                            : 'Not included'}
                                        </Typography>
                                      )}
                                      {(item.data as any).checkedBag !==
                                        undefined && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Checked Bag:{' '}
                                          {(item.data as any).checkedBag
                                            ? 'Included'
                                            : 'Not included'}
                                        </Typography>
                                      )}
                                    </>
                                  )}

                                  {item.type === 'hotel' && (
                                    <>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                        mb={0.5}
                                      >
                                        <strong>Hotel Details</strong>
                                      </Typography>
                                      {(item.data as any).address && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Address: {(item.data as any).address}
                                        </Typography>
                                      )}
                                      {(item.data as any).checkOut && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Check-out:{' '}
                                          {(item.data as any).checkOut}
                                        </Typography>
                                      )}
                                      {(item.data as any).nights && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Nights: {(item.data as any).nights}
                                        </Typography>
                                      )}
                                      {(item.data as any).rating && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Rating: {(item.data as any).rating} ⭐
                                        </Typography>
                                      )}
                                      {(item.data as any)
                                        .distanceFromAirport && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Distance from airport:{' '}
                                          {
                                            (item.data as any)
                                              .distanceFromAirport
                                          }
                                        </Typography>
                                      )}
                                      {(item.data as any)
                                        .travelTimeFromAirport && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Travel time from airport:{' '}
                                          {
                                            (item.data as any)
                                              .travelTimeFromAirport
                                          }
                                        </Typography>
                                      )}
                                      {((item.data as any).numberOfRooms ||
                                        (item.data as any).reservationNames ||
                                        (item.data as any).bookedFrom ||
                                        (item.data as any).includesMeals) && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                          mt={1}
                                        >
                                          <strong>Booking Details</strong>
                                        </Typography>
                                      )}
                                      {(item.data as any).numberOfRooms && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Rooms: {(item.data as any).numberOfRooms}
                                        </Typography>
                                      )}
                                      {(item.data as any).reservationNames && (item.data as any).reservationNames.length > 0 && (
                                        <>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            display="block"
                                          >
                                            Reservations:
                                          </Typography>
                                          {(item.data as any).reservationNames.map((name: string, idx: number) => (
                                            <Typography
                                              key={idx}
                                              variant="caption"
                                              color="text.secondary"
                                              display="block"
                                              sx={{ pl: 1 }}
                                            >
                                              • Room {idx + 1}: {name}
                                            </Typography>
                                          ))}
                                        </>
                                      )}
                                      {(item.data as any).bookedFrom && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Booked from: {(item.data as any).bookedFrom}
                                        </Typography>
                                      )}
                                      {(item.data as any).includesMeals && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Meal Plan:{' '}
                                          {(item.data as any).mealPlan === 'breakfast' && 'Breakfast'}
                                          {(item.data as any).mealPlan === 'half-board' && 'Half-Board (Breakfast + Dinner)'}
                                          {(item.data as any).mealPlan === 'all-inclusive' && 'All-Inclusive'}
                                        </Typography>
                                      )}
                                    </>
                                  )}

                                  {item.type === 'ride' && (
                                    <>
                                      {(item.data as any).type === 'rental' && (
                                        <>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            display="block"
                                            mb={0.5}
                                          >
                                            <strong>Rental Details</strong>
                                          </Typography>
                                          {(item.data as any).rentalCompany && (
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              display="block"
                                            >
                                              Company:{' '}
                                              {(item.data as any).rentalCompany}
                                            </Typography>
                                          )}
                                          {(item.data as any).voucherNumber && (
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              display="block"
                                            >
                                              Voucher:{' '}
                                              {(item.data as any).voucherNumber}
                                            </Typography>
                                          )}
                                          {(item.data as any).pickupDate && (
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              display="block"
                                            >
                                              Pickup Date:{' '}
                                              {(item.data as any).pickupDate}
                                            </Typography>
                                          )}
                                          {(item.data as any).returnDate && (
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              display="block"
                                            >
                                              Return Date:{' '}
                                              {(item.data as any).returnDate}
                                            </Typography>
                                          )}
                                        </>
                                      )}
                                      {(item.data as any).type === 'taxi' &&
                                        (item.data as any).notes && (
                                          <>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              display="block"
                                              mb={0.5}
                                            >
                                              <strong>Additional Info</strong>
                                            </Typography>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              display="block"
                                            >
                                              Notes: {(item.data as any).notes}
                                            </Typography>
                                          </>
                                        )}
                                      <RideMapEmbed ride={item.data} />
                                    </>
                                  )}

                                  {item.type === 'attraction' && (
                                    <>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                        mb={0.5}
                                      >
                                        <strong>Attraction Details</strong>
                                      </Typography>
                                      {(item.data as any).address && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Address: {(item.data as any).address}
                                        </Typography>
                                      )}
                                      {(item.data as any).rating && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Rating: {(item.data as any).rating} ⭐
                                        </Typography>
                                      )}
                                      {(item.data as any).website && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                        >
                                          Website:{' '}
                                          <a
                                            href={(item.data as any).website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'inherit' }}
                                          >
                                            {(item.data as any).website}
                                          </a>
                                        </Typography>
                                      )}
                                    </>
                                  )}

                                  {item.type === 'meal' && (
                                    <>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                        mb={0.5}
                                      >
                                        <strong>Meal Details</strong>
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                      >
                                        Location: {(item.data as any).hotelName}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                      >
                                        Address: {(item.data as any).hotelAddress}
                                      </Typography>
                                      {(item.data as any).isAutoGenerated && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                          fontStyle="italic"
                                          mt={0.5}
                                        >
                                          This meal is automatically included with your hotel booking
                                        </Typography>
                                      )}
                                    </>
                                  )}
                                </Box>
                              </Collapse>
                            </Paper>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* MAP VIEW */}
      {viewMode === 'map' && <TripMapView trip={trip} />}

      {/* Floating Action Button for Create Ride from Selection */}
      {selectedItems.length === 2 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          <Stack spacing={1} alignItems="flex-end">
            <Paper
              elevation={4}
              sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <DirectionsCar />
                <Typography variant="body2">2 locations selected</Typography>
              </Stack>
            </Paper>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => setSelectedItems([])}
                sx={{ bgcolor: 'white' }}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                startIcon={<DirectionsCar />}
                onClick={handleCreateRideFromSelection}
                size="large"
              >
                Create Ride
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}

      {/* Edit Trip Dialog */}
      <Dialog
        open={editTrip.open}
        onClose={() => setEditTrip({ ...editTrip, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Trip</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Trip Name"
              value={editTrip.name}
              onChange={(e) =>
                setEditTrip({ ...editTrip, name: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Destinations"
              value={editTrip.destinations}
              onChange={(e) =>
                setEditTrip({ ...editTrip, destinations: e.target.value })
              }
              helperText="Comma-separated list of destinations"
            />
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={editTrip.startDate}
              onChange={(e) =>
                setEditTrip({ ...editTrip, startDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={editTrip.endDate}
              onChange={(e) =>
                setEditTrip({ ...editTrip, endDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTrip({ ...editTrip, open: false })}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleEditTripSave}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, type: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteConfirm.type === 'trip'
              ? 'Are you sure you want to delete this entire trip? This action cannot be undone.'
              : `Are you sure you want to delete this ${deleteConfirm.type}?`}
          </Typography>
          <Stack direction="row" spacing={2} mt={3} justifyContent="flex-end">
            <Button
              onClick={() => setDeleteConfirm({ open: false, type: null })}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                if (deleteConfirm.type === 'trip') {
                  handleDeleteTrip();
                } else if (
                  deleteConfirm.type &&
                  deleteConfirm.index !== undefined
                ) {
                  handleDeleteItem(
                    deleteConfirm.type as any,
                    deleteConfirm.index
                  );
                }
              }}
            >
              Delete
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Edit Flight Dialog */}
      {editItem.open && editItem.type === 'flight' && (
        <Dialog
          open
          onClose={() => setEditItem({ ...editItem, open: false })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Flight</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Airline"
                value={editItem.data.airline || ''}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    data: { ...editItem.data, airline: e.target.value },
                  })
                }
              />
              <TextField
                fullWidth
                label="Flight Number"
                value={editItem.data.flightNumber || ''}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    data: { ...editItem.data, flightNumber: e.target.value },
                  })
                }
              />
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  label="Departure Airport Code"
                  value={editItem.data.departureAirportCode || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: {
                        ...editItem.data,
                        departureAirportCode: e.target.value,
                      },
                    })
                  }
                />
                <TextField
                  fullWidth
                  label="Arrival Airport Code"
                  value={editItem.data.arrivalAirportCode || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: {
                        ...editItem.data,
                        arrivalAirportCode: e.target.value,
                      },
                    })
                  }
                />
              </Box>
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Departure Date & Time"
                  value={formatDateTimeForInput(
                    editItem.data.departureDateTime || ''
                  )}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: {
                        ...editItem.data,
                        departureDateTime: e.target.value,
                      },
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Arrival Date & Time"
                  value={formatDateTimeForInput(
                    editItem.data.arrivalDateTime || ''
                  )}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: {
                        ...editItem.data,
                        arrivalDateTime: e.target.value,
                      },
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Number of Tickets"
                  value={editItem.data.numberOfTickets || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: {
                        ...editItem.data,
                        numberOfTickets: Number(e.target.value),
                      },
                    })
                  }
                  inputProps={{ min: 1 }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Cost"
                  value={editItem.data.cost || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, cost: Number(e.target.value) },
                    })
                  }
                />
                <FormControl fullWidth>
                  <InputLabel>Cost Type</InputLabel>
                  <Select
                    value={editItem.data.costType || 'total'}
                    label="Cost Type"
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        data: { ...editItem.data, costType: e.target.value },
                      })
                    }
                  >
                    <MenuItem value="per-ticket">Per Ticket</MenuItem>
                    <MenuItem value="total">Total</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  label="Booking Number"
                  value={editItem.data.bookingNumber || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, bookingNumber: e.target.value },
                    })
                  }
                />
                <TextField
                  fullWidth
                  label="Booking Agency"
                  value={editItem.data.bookingAgency || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, bookingAgency: e.target.value },
                    })
                  }
                />
              </Box>
              <Box display="flex" gap={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editItem.data.carryOn || false}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          data: { ...editItem.data, carryOn: e.target.checked },
                        })
                      }
                    />
                  }
                  label="Carry-on Included"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editItem.data.checkedBag || false}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          data: {
                            ...editItem.data,
                            checkedBag: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Checked Bag Included"
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditItem({ ...editItem, open: false })}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleEditItemSave}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Edit Hotel Dialog */}
      {editItem.open && editItem.type === 'hotel' && (
        <Dialog
          open
          onClose={() => setEditItem({ ...editItem, open: false })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Hotel</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Hotel Name"
                value={editItem.data.name || ''}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    data: { ...editItem.data, name: e.target.value },
                  })
                }
              />
              <TextField
                fullWidth
                label="Address"
                value={editItem.data.address || ''}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    data: { ...editItem.data, address: e.target.value },
                  })
                }
              />
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Check-in Date"
                  value={editItem.data.checkIn?.slice(0, 10) || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, checkIn: e.target.value },
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  type="date"
                  label="Check-out Date"
                  value={editItem.data.checkOut?.slice(0, 10) || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, checkOut: e.target.value },
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Nights"
                  value={editItem.data.nights || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: {
                        ...editItem.data,
                        nights: Number(e.target.value),
                      },
                    })
                  }
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Cost"
                  value={editItem.data.cost || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, cost: Number(e.target.value) },
                    })
                  }
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Rating"
                  value={editItem.data.rating || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: {
                        ...editItem.data,
                        rating: Number(e.target.value),
                      },
                    })
                  }
                  inputProps={{ min: 0, max: 5, step: 0.1 }}
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditItem({ ...editItem, open: false })}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleEditItemSave}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Edit Ride Dialog */}
      {editItem.open && editItem.type === 'ride' && (
        <Dialog
          open
          onClose={() => setEditItem({ ...editItem, open: false })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Ride</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Ride Type</InputLabel>
                <Select
                  value={editItem.data.type || ''}
                  label="Ride Type"
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, type: e.target.value },
                    })
                  }
                >
                  <MenuItem value="taxi">Taxi/Ride</MenuItem>
                  <MenuItem value="rental">Car Rental</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Pickup Location"
                value={editItem.data.pickup || ''}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    data: { ...editItem.data, pickup: e.target.value },
                  })
                }
              />
              <TextField
                fullWidth
                label="Dropoff Location"
                value={editItem.data.dropoff || ''}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    data: { ...editItem.data, dropoff: e.target.value },
                  })
                }
              />
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  label="Distance"
                  value={editItem.data.distance || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, distance: e.target.value },
                    })
                  }
                />
                <TextField
                  fullWidth
                  label="Duration"
                  value={editItem.data.duration || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, duration: e.target.value },
                    })
                  }
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Cost"
                  value={editItem.data.cost || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, cost: Number(e.target.value) },
                    })
                  }
                />
              </Box>

              {editItem.data.type === 'rental' && (
                <>
                  <TextField
                    fullWidth
                    label="Rental Company"
                    value={editItem.data.rentalCompany || ''}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        data: {
                          ...editItem.data,
                          rentalCompany: e.target.value,
                        },
                      })
                    }
                  />
                  <TextField
                    fullWidth
                    label="Voucher Number"
                    value={editItem.data.voucherNumber || ''}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        data: {
                          ...editItem.data,
                          voucherNumber: e.target.value,
                        },
                      })
                    }
                  />
                  <Box display="flex" gap={2}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Pickup Date"
                      value={editItem.data.pickupDate || ''}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          data: {
                            ...editItem.data,
                            pickupDate: e.target.value,
                          },
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      type="time"
                      label="Pickup Time"
                      value={editItem.data.pickupTime || ''}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          data: {
                            ...editItem.data,
                            pickupTime: e.target.value,
                          },
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                  <Box display="flex" gap={2}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Return Date"
                      value={editItem.data.returnDate || ''}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          data: {
                            ...editItem.data,
                            returnDate: e.target.value,
                          },
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      type="time"
                      label="Return Time"
                      value={editItem.data.returnTime || ''}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          data: {
                            ...editItem.data,
                            returnTime: e.target.value,
                          },
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </>
              )}

              {editItem.data.type === 'taxi' && (
                <>
                  <Box display="flex" gap={2}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Date"
                      value={editItem.data.date || ''}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          data: { ...editItem.data, date: e.target.value },
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      type="time"
                      label="Time"
                      value={editItem.data.time || ''}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          data: { ...editItem.data, time: e.target.value },
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={2}
                    value={editItem.data.notes || ''}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        data: { ...editItem.data, notes: e.target.value },
                      })
                    }
                  />
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditItem({ ...editItem, open: false })}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleEditItemSave}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Edit Attraction Dialog */}
      {editItem.open && editItem.type === 'attraction' && (
        <Dialog
          open
          onClose={() => setEditItem({ ...editItem, open: false })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Attraction</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Attraction Name"
                value={editItem.data.name || ''}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    data: { ...editItem.data, name: e.target.value },
                  })
                }
              />
              <TextField
                fullWidth
                label="Address"
                value={editItem.data.address || ''}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    data: { ...editItem.data, address: e.target.value },
                  })
                }
              />
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Scheduled Date"
                  value={editItem.data.scheduledDate?.slice(0, 10) || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, scheduledDate: e.target.value },
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  type="time"
                  label="Scheduled Time"
                  value={editItem.data.scheduledTime || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, scheduledTime: e.target.value },
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Number of Tickets"
                  value={editItem.data.numberOfTickets || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: {
                        ...editItem.data,
                        numberOfTickets: Number(e.target.value),
                      },
                    })
                  }
                  inputProps={{ min: 1 }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Cost"
                  value={editItem.data.cost || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, cost: Number(e.target.value) },
                    })
                  }
                />
                <FormControl fullWidth>
                  <InputLabel>Cost Type</InputLabel>
                  <Select
                    value={editItem.data.costType || 'total'}
                    label="Cost Type"
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        data: { ...editItem.data, costType: e.target.value },
                      })
                    }
                  >
                    <MenuItem value="per-ticket">Per Ticket</MenuItem>
                    <MenuItem value="total">Total</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Rating"
                  value={editItem.data.rating || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: {
                        ...editItem.data,
                        rating: Number(e.target.value),
                      },
                    })
                  }
                  inputProps={{ min: 0, max: 5, step: 0.1 }}
                />
                <TextField
                  fullWidth
                  label="Website"
                  value={editItem.data.website || ''}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      data: { ...editItem.data, website: e.target.value },
                    })
                  }
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditItem({ ...editItem, open: false })}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleEditItemSave}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Generate Ride Dialog */}
      <Dialog
        open={showGenerateRide}
        onClose={() => setShowGenerateRide(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              Generate Ride Between Locations
            </Typography>
            <IconButton onClick={() => setShowGenerateRide(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <GenerateRide
            trip={trip}
            onRideAdded={(updatedTrip) => {
              setTrip(updatedTrip);
              setShowGenerateRide(false);
              setSelectedItems([]);
            }}
            onClose={() => {
              setShowGenerateRide(false);
              setSelectedItems([]);
            }}
            initialSelection={
              selectedItems.length === 2 ? selectedItems : undefined
            }
          />
        </DialogContent>
      </Dialog>

      {/* Share Trip Dialog */}
      {isOwner && (
        <ShareTripDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          tripId={trip.id}
          tripName={trip.name}
          sharedWith={trip.sharedWith || []}
          onUpdate={refreshTrip}
        />
      )}
    </Box>
  );
}

function AddItemModalLauncher({
  trip,
  onUpdated,
}: {
  trip: Trip;
  onUpdated: (t: Trip) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);

  const handleClose = () => setOpen(false);

  const isOwner = trip?.isOwner !== false;

  // Don't show Add button for shared trips
  if (!isOwner) {
    return null;
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => setOpen(true)}
        size="large"
      >
        Add Item
      </Button>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Add Item to {trip.name}</Typography>
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <Divider />
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
        >
          <Tab icon={<FlightIcon />} label="Flight" />
          <Tab icon={<HotelIcon />} label="Hotel" />
          <Tab icon={<DirectionsCar />} label="Ride" />
          <Tab icon={<AttractionsOutlined />} label="Attraction" />
        </Tabs>
        <DialogContent sx={{ pt: 3 }}>
          {tab === 0 && (
            <AddFlightForm
              tripId={trip.id}
              onUpdated={onUpdated}
              onDone={handleClose}
            />
          )}
          {tab === 1 && (
            <AddHotelForm
              tripId={trip.id}
              onUpdated={onUpdated}
              onDone={handleClose}
            />
          )}
          {tab === 2 && (
            <AddRideForm
              tripId={trip.id}
              onUpdated={onUpdated}
              onDone={handleClose}
            />
          )}
          {tab === 3 && (
            <AddAttractionForm
              tripId={trip.id}
              onUpdated={onUpdated}
              onDone={handleClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

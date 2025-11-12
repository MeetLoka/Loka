import { useState, useEffect } from 'react';
import { createTrip } from '../services/api';
import type { Trip } from '../types/domain';
import { useNavigate, Link } from 'react-router-dom';
import {
  AddFlightForm,
  AddHotelForm,
  AddRideForm,
  AddAttractionForm,
} from '../components/AddItemForms';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Check,
  Flight as FlightIcon,
  Hotel as HotelIcon,
  DirectionsCar,
  AttractionsOutlined,
  Info,
} from '@mui/icons-material';

interface BasicInfo {
  name: string;
  destinations: string;
  startDate: string;
  endDate: string;
}

const steps = [
  'Basic Info',
  'Flights',
  'Hotels',
  'Rides',
  'Attractions',
  'Review',
] as const;

export default function NewTripWizard() {
  const [step, setStep] = useState<number>(0);
  const [basic, setBasic] = useState<BasicInfo>({
    name: '',
    destinations: '',
    startDate: '',
    endDate: '',
  });
  const [creating, setCreating] = useState(false);
  const [trip, setTrip] = useState<Trip | null>(null);
  const navigate = useNavigate();

  // Reset wizard when component mounts (new trip creation)
  useEffect(() => {
    setStep(0);
    setBasic({ name: '', destinations: '', startDate: '', endDate: '' });
    setTrip(null);
    setCreating(false);
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  async function createBasicTrip() {
    if (!basic.name || !basic.startDate || !basic.endDate) return;
    setCreating(true);
    try {
      const newTrip = await createTrip({
        name: basic.name,
        destinations: basic.destinations
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean),
        startDate: basic.startDate,
        endDate: basic.endDate,
        flights: [],
        hotels: [],
        rides: [],
        attractions: [],
      } as any);
      setTrip(newTrip);
      next();
    } catch (e: any) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setCreating(false);
    }
  }

  const canFinish = !!trip;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          bgcolor: 'primary.main',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Button
            type="button"
            onClick={() => {
              window.location.href = '/';
            }}
            startIcon={<ArrowBack />}
            sx={{
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            Cancel
          </Button>
        </Stack>
        <Typography variant="h4" fontWeight={700}>
          Create New Trip
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
          Plan your perfect journey in just a few steps
        </Typography>
      </Paper>

      {/* Stepper */}
      <Paper
        elevation={0}
        sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}
      >
        <Stepper activeStep={step} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step 0: Basic Info */}
      {step === 0 && (
        <Paper
          elevation={0}
          sx={{ p: 4, border: '1px solid', borderColor: 'divider' }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Basic Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Let's start with the essential details about your trip
              </Typography>
            </Box>

            <TextField
              label="Trip Name"
              placeholder="e.g., Summer Vacation 2025"
              value={basic.name}
              onChange={(e) => setBasic({ ...basic, name: e.target.value })}
              fullWidth
              required
              helperText="Give your trip a memorable name"
            />

            <TextField
              label="Destinations"
              placeholder="e.g., Paris, Rome, Barcelona"
              value={basic.destinations}
              onChange={(e) =>
                setBasic({ ...basic, destinations: e.target.value })
              }
              fullWidth
              helperText="Separate multiple destinations with commas"
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={basic.startDate}
                  onChange={(e) =>
                    setBasic({ ...basic, startDate: e.target.value })
                  }
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="End Date"
                  type="date"
                  value={basic.endDate}
                  onChange={(e) =>
                    setBasic({ ...basic, endDate: e.target.value })
                  }
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  error={
                    !!(
                      basic.startDate &&
                      basic.endDate &&
                      basic.endDate < basic.startDate
                    )
                  }
                  helperText={
                    basic.startDate &&
                    basic.endDate &&
                    basic.endDate < basic.startDate
                      ? 'End date must be after start date'
                      : undefined
                  }
                />
              </Grid>
            </Grid>

            <Divider />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="contained"
                size="large"
                onClick={createBasicTrip}
                disabled={
                  !basic.name ||
                  !basic.startDate ||
                  !basic.endDate ||
                  creating ||
                  basic.endDate < basic.startDate
                }
                startIcon={
                  creating ? <CircularProgress size={20} /> : <Check />
                }
              >
                {creating
                  ? 'Creating Trip...'
                  : trip
                    ? 'Update & Continue'
                    : 'Create Trip & Continue'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Flights step */}
      {step === 1 && (
        <StepCard
          title="Add Flights"
          subtitle={
            trip ? `Trip: ${trip.name}` : 'Create the trip first to add items.'
          }
        >
          {trip ? (
            <div className="space-y-4">
              <AddFlightForm
                key={`flight-${trip.id}`}
                tripId={trip.id}
                onUpdated={setTrip}
              />
              {trip.flights.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-1">Flights added</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    {trip.flights.map((f, i) => (
                      <li key={i}>
                        {f.flightNumber} {f.departureAirportCode}→
                        {f.arrivalAirportCode} (
                        {(f.departureDateTime || '').slice(0, 10)})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <WizardNav onBack={prev} onNext={next} />
            </div>
          ) : (
            <WizardNav onBack={prev} onNext={next} nextDisabled />
          )}
        </StepCard>
      )}

      {/* Hotels step */}
      {step === 2 && (
        <StepCard
          title="Add Hotels"
          subtitle={
            trip ? `Trip: ${trip.name}` : 'Create the trip first to add items.'
          }
        >
          {trip ? (
            <div className="space-y-4">
              <AddHotelForm
                key={`hotel-${trip.id}`}
                tripId={trip.id}
                onUpdated={setTrip}
              />
              {trip.hotels.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-1">Hotels added</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    {trip.hotels.map((h, i) => (
                      <li key={i}>
                        {h.name} ({h.checkIn} → {h.checkOut})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <WizardNav onBack={prev} onNext={next} />
            </div>
          ) : (
            <WizardNav onBack={prev} onNext={next} nextDisabled />
          )}
        </StepCard>
      )}

      {/* Rides step */}
      {step === 3 && (
        <StepCard
          title="Add Rides"
          subtitle={
            trip ? `Trip: ${trip.name}` : 'Create the trip first to add items.'
          }
        >
          {trip ? (
            <div className="space-y-4">
              <AddRideForm
                key={`ride-${trip.id}`}
                tripId={trip.id}
                onUpdated={setTrip}
              />
              {trip.rides.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-1">Rides added</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    {trip.rides.map((r, i) => (
                      <li key={i}>
                        {r.pickup} → {r.dropoff}{' '}
                        {r.distance ? `(${r.distance})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <WizardNav onBack={prev} onNext={next} />
            </div>
          ) : (
            <WizardNav onBack={prev} onNext={next} nextDisabled />
          )}
        </StepCard>
      )}

      {/* Attractions step */}
      {step === 4 && (
        <StepCard
          title="Add Attractions"
          subtitle={
            trip ? `Trip: ${trip.name}` : 'Create the trip first to add items.'
          }
        >
          {trip ? (
            <div className="space-y-4">
              <AddAttractionForm
                key={`attraction-${trip.id}`}
                tripId={trip.id}
                onUpdated={setTrip}
              />
              {trip.attractions.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-1">
                    Attractions added
                  </div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    {trip.attractions.map((a, i) => (
                      <li key={i}>
                        {a.name}{' '}
                        {a.scheduledDate
                          ? `(${a.scheduledDate}${
                              a.scheduledTime ? ' ' + a.scheduledTime : ''
                            })`
                          : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <WizardNav onBack={prev} onNext={next} />
            </div>
          ) : (
            <WizardNav onBack={prev} onNext={next} nextDisabled />
          )}
        </StepCard>
      )}

      {/* Review step */}
      {step === 5 && (
        <StepCard
          title="Review & Finish"
          subtitle={trip ? `Your trip is ready!` : 'Create the trip first.'}
        >
          {trip ? (
            <Stack spacing={3}>
              <Card
                elevation={0}
                sx={{
                  bgcolor: 'success.lighter',
                  border: '2px solid',
                  borderColor: 'success.main',
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <Check sx={{ color: 'success.main', fontSize: 32 }} />
                    <Typography variant="h6" fontWeight={600}>
                      Trip Created Successfully!
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Your trip "{trip.name}" has been created. Review the summary
                    below and click Finish to view your complete itinerary.
                  </Typography>
                </CardContent>
              </Card>

              <Paper
                elevation={0}
                sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}
              >
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Trip Summary
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Dates
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {new Date(trip.startDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                      })}{' '}
                      →{' '}
                      {new Date(trip.endDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Typography>
                  </Grid>
                  {trip.destinations?.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Destinations
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        gap={1}
                        mt={0.5}
                      >
                        {trip.destinations.map((dest, i) => (
                          <Chip key={i} label={dest} size="small" />
                        ))}
                      </Stack>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FlightIcon color="primary" />
                      <Box>
                        <Typography variant="h5" fontWeight={600}>
                          {trip.flights.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Flights
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <HotelIcon color="secondary" />
                      <Box>
                        <Typography variant="h5" fontWeight={600}>
                          {trip.hotels.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Hotels
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <DirectionsCar color="info" />
                      <Box>
                        <Typography variant="h5" fontWeight={600}>
                          {trip.rides.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Rides
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AttractionsOutlined color="success" />
                      <Box>
                        <Typography variant="h5" fontWeight={600}>
                          {trip.attractions.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Attractions
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>

              <Stack direction="row" spacing={2} justifyContent="space-between">
                <Button
                  onClick={prev}
                  variant="outlined"
                  startIcon={<ArrowBack />}
                >
                  Back
                </Button>
                <Button
                  disabled={!canFinish}
                  onClick={() => navigate(`/trips/${trip!.id}`)}
                  variant="contained"
                  size="large"
                  endIcon={<Check />}
                >
                  Finish & View Trip
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Alert severity="warning" icon={<Info />}>
                Please create a trip first by completing the Basic Info step.
              </Alert>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  onClick={prev}
                  variant="outlined"
                  startIcon={<ArrowBack />}
                >
                  Back
                </Button>
                <Button disabled variant="contained">
                  Finish
                </Button>
              </Stack>
            </Stack>
          )}
        </StepCard>
      )}
    </Box>
  );
}

function StepCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{ p: 4, border: '1px solid', borderColor: 'divider' }}
    >
      <Box mb={3}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box>{children}</Box>
    </Paper>
  );
}

function WizardNav({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
      <Button onClick={onBack} variant="outlined" startIcon={<ArrowBack />}>
        Back
      </Button>
      <Button
        onClick={onNext}
        disabled={!!nextDisabled}
        variant="contained"
        endIcon={<ArrowForward />}
      >
        Next
      </Button>
    </Stack>
  );
}

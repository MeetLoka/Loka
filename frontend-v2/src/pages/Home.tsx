import { useEffect, useState } from 'react'
import { listTrips } from '../services/api'
import { Link } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Container,
  Paper,
  Fade,
  Skeleton
} from '@mui/material'
import { Add, CalendarMonth, Flight, TravelExplore, Hotel, Attractions, Visibility as VisibilityIcon } from '@mui/icons-material'

export default function Home() {
  const [trips, setTrips] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listTrips().then(setTrips).catch(e => setError(e.message))
  }, [])

  const ownedTrips = trips?.filter(t => t.isOwner) || []
  const sharedTrips = trips?.filter(t => t.isShared) || []

  return (
    <Box>
      {/* Hero Section */}
      <Paper 
        elevation={0}
        sx={{ 
          bgcolor: 'primary.main',
          color: 'white',
          borderRadius: 3,
          mb: 4,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.9) 0%, rgba(21, 101, 192, 0.95) 100%)',
            py: 6,
            px: 4
          }}
        >
          <Container maxWidth="lg">
            <Stack spacing={3} alignItems="center" textAlign="center">
              <TravelExplore sx={{ fontSize: 64, opacity: 0.9 }} />
              <Typography variant="h3" component="h1" fontWeight={700}>
                Plan Your Perfect Trip
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.95, maxWidth: 600 }}>
                Organize flights, hotels, attractions, and transportation all in one place
              </Typography>
              <Button
                component={Link}
                to="/trip/new"
                variant="contained"
                size="large"
                startIcon={<Add />}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  mt: 2,
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'grey.100',
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Create New Trip
              </Button>
            </Stack>
          </Container>
        </Box>
      </Paper>

      {/* Owned Trips Section Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2" fontWeight={600}>
          Your Trips
        </Typography>
        {trips && ownedTrips.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            {ownedTrips.length} {ownedTrips.length === 1 ? 'trip' : 'trips'}
          </Typography>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!trips && !error && (
        <Grid container spacing={3}>
          {[1, 2, 3].map((n) => (
            <Grid item xs={12} sm={6} md={4} key={n}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="80%" height={24} sx={{ mt: 2 }} />
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Skeleton variant="rounded" width={80} height={24} />
                    <Skeleton variant="rounded" width={80} height={24} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {trips && ownedTrips.length === 0 && sharedTrips.length === 0 && (
        <Fade in timeout={800}>
          <Card 
            elevation={0} 
            sx={{ 
              textAlign: 'center', 
              py: 8, 
              bgcolor: 'grey.50',
              border: '2px dashed',
              borderColor: 'grey.300'
            }}
          >
            <CardContent>
              <Flight sx={{ fontSize: 72, color: 'primary.main', mb: 2, opacity: 0.7 }} />
              <Typography variant="h5" fontWeight={600} gutterBottom>
                No trips yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Start planning your next adventure by creating your first trip
              </Typography>
              <Button
                component={Link}
                to="/trip/new"
                variant="contained"
                size="large"
                startIcon={<Add />}
              >
                Create Your First Trip
              </Button>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Owned Trips Grid */}
      <Grid container spacing={3}>
        {ownedTrips.map((t, index) => (
          <Grid item xs={12} sm={6} md={4} key={t.id}>
            <Fade in timeout={500 + index * 100}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                    borderColor: 'primary.main'
                  }
                }}
              >
                <CardActionArea 
                  component={Link} 
                  to={`/trips/${t.id}`}
                  sx={{ height: '100%' }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {t.name || 'Untitled Trip'}
                    </Typography>
                    
                    {t.startDate && t.endDate && (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2, mb: 2 }}>
                        <CalendarMonth fontSize="small" sx={{ color: 'primary.main' }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          {new Date(t.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                          {' → '}
                          {new Date(t.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Typography>
                      </Stack>
                    )}

                    <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" gap={1}>
                      {t.flights?.length > 0 && (
                        <Chip 
                          size="small" 
                          icon={<Flight sx={{ fontSize: 16 }} />}
                          label={`${t.flights.length}`}
                          variant="outlined"
                          color="primary"
                        />
                      )}
                      {t.hotels?.length > 0 && (
                        <Chip 
                          size="small" 
                          icon={<Hotel sx={{ fontSize: 16 }} />}
                          label={`${t.hotels.length}`}
                          variant="outlined"
                          color="secondary"
                        />
                      )}
                      {t.attractions?.length > 0 && (
                        <Chip 
                          size="small" 
                          icon={<Attractions sx={{ fontSize: 16 }} />}
                          label={`${t.attractions.length}`}
                          variant="outlined"
                          color="success"
                        />
                      )}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {/* Shared Trips Section */}
      {sharedTrips.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h5" component="h2" fontWeight={600}>
                Shared with You
              </Typography>
              <Chip 
                icon={<VisibilityIcon />} 
                label="View Only" 
                size="small"
                color="info"
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {sharedTrips.length} {sharedTrips.length === 1 ? 'trip' : 'trips'}
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            {sharedTrips.map((t, index) => (
              <Grid item xs={12} sm={6} md={4} key={t.id}>
                <Fade in timeout={500 + index * 100}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      height: '100%',
                      border: '1px solid',
                      borderColor: 'info.light',
                      bgcolor: 'info.50',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        borderColor: 'info.main'
                      }
                    }}
                  >
                    <CardActionArea 
                      component={Link} 
                      to={`/trips/${t.id}`}
                      sx={{ height: '100%' }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                          <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                            {t.name || 'Untitled Trip'}
                          </Typography>
                          <Chip 
                            icon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                            label="View Only"
                            size="small"
                            color="info"
                            sx={{ ml: 1 }}
                          />
                        </Stack>
                        
                        {t.startDate && t.endDate && (
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            <CalendarMonth fontSize="small" sx={{ color: 'info.main' }} />
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                              {new Date(t.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                              {' → '}
                              {new Date(t.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Typography>
                          </Stack>
                        )}

                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                          {t.flights?.length > 0 && (
                            <Chip 
                              size="small" 
                              icon={<Flight sx={{ fontSize: 16 }} />}
                              label={`${t.flights.length}`}
                              variant="outlined"
                              color="primary"
                            />
                          )}
                          {t.hotels?.length > 0 && (
                            <Chip 
                              size="small" 
                              icon={<Hotel sx={{ fontSize: 16 }} />}
                              label={`${t.hotels.length}`}
                              variant="outlined"
                              color="secondary"
                            />
                          )}
                          {t.attractions?.length > 0 && (
                            <Chip 
                              size="small" 
                              icon={<Attractions sx={{ fontSize: 16 }} />}
                              label={`${t.attractions.length}`}
                              variant="outlined"
                              color="success"
                            />
                          )}
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  )
}

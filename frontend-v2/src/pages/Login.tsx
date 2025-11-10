import { Box, Card, CardContent, Typography, Container, TextField, Button, Divider, Alert, Tabs, Tab } from '@mui/material'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff'

export default function Login() {
  const { login, loginWithEmail, register, isAuthenticated, error } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLocalError(null)
    try {
      await loginWithEmail(email, password)
    } catch (err: any) {
      setLocalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLocalError(null)
    try {
      await register(email, password, name)
    } catch (err: any) {
      setLocalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Card sx={{ width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <FlightTakeoffIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom fontWeight="bold">
                MeetLoca
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Plan your perfect trip
              </Typography>
            </Box>

            {(error || localError) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error || localError}
              </Alert>
            )}

            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} centered sx={{ mb: 3 }}>
              <Tab label="Login" />
              <Tab label="Register" />
            </Tabs>

            {activeTab === 0 && (
              <Box component="form" onSubmit={handleEmailLogin}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 2, mb: 2 }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Box>
            )}

            {activeTab === 1 && (
              <Box component="form" onSubmit={handleRegister}>
                <TextField
                  fullWidth
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  helperText="Minimum 6 characters"
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 2, mb: 2 }}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </Box>
            )}

            <Divider sx={{ my: 3 }}>OR</Divider>
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={login}
                onError={() => {
                  setLocalError('Google login failed')
                }}
              />
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block', textAlign: 'center' }}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

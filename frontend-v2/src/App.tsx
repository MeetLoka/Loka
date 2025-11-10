import { Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import { Layout } from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import NewTripWizard from './pages/NewTripWizard'
import TripDetails from './pages/TripDetails'
import Login from './pages/Login'

const GOOGLE_CLIENT_ID = '505365576143-5r5n1sk575v1gjkmvr42gfpr89r8u9cd.apps.googleusercontent.com'

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/trip/new" element={
            <ProtectedRoute>
              <Layout>
                <NewTripWizard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/trips/:id" element={
            <ProtectedRoute>
              <Layout>
                <TripDetails />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

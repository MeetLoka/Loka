import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function verifyGoogleToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7)
    
    // Try JWT first (our own tokens)
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture || null
      }
      return next()
    } catch (jwtError) {
      // If JWT fails, try Google token
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        })
        
        const payload = ticket.getPayload()
        
        req.user = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture
        }
        
        return next()
      } catch (googleError) {
        console.error('Both JWT and Google token verification failed')
        return res.status(401).json({ error: 'Invalid token' })
      }
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    return res.status(401).json({ error: 'Invalid token' })
  }
}

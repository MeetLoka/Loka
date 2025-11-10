import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material'
import { Close as CloseIcon, PersonRemove as RemoveIcon, Share as ShareIcon } from '@mui/icons-material'
import { shareTrip, revokeAccess } from '../services/api'

interface SharedUser {
  userId: string
  email: string
  name: string
  sharedAt: string
}

interface ShareTripDialogProps {
  open: boolean
  onClose: () => void
  tripId: string
  tripName: string
  sharedWith: SharedUser[]
  onUpdate: () => void
}

export default function ShareTripDialog({ 
  open, 
  onClose, 
  tripId, 
  tripName, 
  sharedWith = [],
  onUpdate 
}: ShareTripDialogProps) {
  const [email, setEmail] = useState('')
  const [emails, setEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAddEmail = () => {
    const trimmedEmail = email.trim().toLowerCase()
    
    if (!trimmedEmail) return
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address')
      return
    }
    
    if (emails.includes(trimmedEmail)) {
      setError('Email already added')
      return
    }
    
    setEmails([...emails, trimmedEmail])
    setEmail('')
    setError('')
  }

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter(e => e !== emailToRemove))
  }

  const handleShare = async () => {
    if (emails.length === 0) {
      setError('Please add at least one email address')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await shareTrip(tripId, emails)
      setSuccess(result.message)
      setEmails([])
      onUpdate()
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to share trip')
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (userId: string, userName: string) => {
    if (!confirm(`Remove access for ${userName}?`)) return

    setLoading(true)
    setError('')

    try {
      await revokeAccess(tripId, userId)
      setSuccess('Access revoked successfully')
      onUpdate()
      
      setTimeout(() => {
        setSuccess('')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to revoke access')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddEmail()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <ShareIcon />
            <span>Share Trip</span>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="subtitle2" gutterBottom>
          Trip: <strong>{tripName}</strong>
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Add people by email
          </Typography>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <Button 
              variant="contained" 
              onClick={handleAddEmail}
              disabled={loading || !email.trim()}
            >
              Add
            </Button>
          </Box>
          
          {emails.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {emails.map((e) => (
                <Chip
                  key={e}
                  label={e}
                  size="small"
                  onDelete={() => handleRemoveEmail(e)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </Box>

        {sharedWith.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              People with access ({sharedWith.length})
            </Typography>
            <List dense>
              {sharedWith.map((user) => (
                <ListItem key={user.userId} divider>
                  <ListItemText
                    primary={user.name || user.email}
                    secondary={
                      <>
                        {user.email}
                        <Typography variant="caption" display="block" color="text.secondary">
                          Shared {new Date(user.sharedAt).toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRevoke(user.userId, user.name || user.email)}
                      disabled={loading}
                      color="error"
                      size="small"
                    >
                      <RemoveIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {sharedWith.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No one has access yet. Add emails above to share this trip.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
        {emails.length > 0 && (
          <Button 
            onClick={handleShare} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <ShareIcon />}
          >
            Share with {emails.length} {emails.length === 1 ? 'person' : 'people'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { Flight, Dashboard, Logout } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import CloudsBackground from './CloudsBackground';
import logo from '../svgs/logo.svg';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* Cloud background sits behind the whole layout. You can tweak count/opacity here. */}
      <CloudsBackground count={200} />
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: 'common.white', color: 'text.primary' }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 0,
              mr: 4,
              textDecoration: 'none',
              color: 'primary.main',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <img
              src={logo}
              alt="Loka Logo"
              style={{ height: 40, marginRight: 16 }}
            />
            Meet Loka
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component={NavLink}
              to="/"
              startIcon={<Dashboard />}
              sx={({ palette }) => ({
                color: 'text.secondary',
                '&.active': {
                  color: 'primary.main',
                  bgcolor: 'primary.50',
                  fontWeight: 600,
                },
              })}
            >
              Dashboard
            </Button>
            <Button
              component={NavLink}
              to="/trip/new"
              startIcon={<Flight />}
              sx={({ palette }) => ({
                color: 'text.secondary',
                '&.active': {
                  color: 'primary.main',
                  bgcolor: 'primary.50',
                  fontWeight: 700,
                },
              })}
            >
              New Trip
            </Button>
          </Box>
          <Box
            sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}
          >
            <Chip label="v2" size="small" variant="outlined" color="primary" />
            {user && (
              <>
                <Typography variant="body2" color="text.secondary">
                  {user.name}
                </Typography>
                <IconButton onClick={handleMenuOpen} size="small">
                  <Avatar
                    src={user.picture}
                    alt={user.name}
                    sx={{ width: 32, height: 32 }}
                  />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem onClick={handleLogout}>
                    <Logout sx={{ mr: 1 }} fontSize="small" />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Container
        maxWidth="xl"
        component="main"
        sx={{
          flexGrow: 1,
          py: 4,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Container>
    </Box>
  );
}

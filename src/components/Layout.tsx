import type { ReactNode } from 'react';
import { AppBar, Box, Container, Toolbar, Typography, Button, Stack } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

interface LayoutProps {
	children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
	const navigate = useNavigate();
	const location = useLocation();

	const navItems = [
		{ path: '/', label: 'Home', icon: null },
		{ path: '/trips', label: 'My Trips', icon: <ListAltIcon /> },
		{ path: '/trip/new', label: 'New Trip', icon: <AddCircleOutlineIcon />, highlight: true },
	];

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<AppBar
				position="sticky"
				elevation={0}
				sx={{
					bgcolor: 'white',
					color: 'text.primary',
					borderBottom: '1px solid',
					borderColor: 'grey.200',
				}}
			>
				<Container maxWidth="lg">
					<Toolbar disableGutters sx={{ py: 1 }}>
						<Box
							component={Link}
							to="/"
							sx={{
								display: 'flex',
								alignItems: 'center',
								textDecoration: 'none',
								color: 'text.primary',
								flexGrow: 1,
								'&:hover': {
									textDecoration: 'none',
								},
							}}
						>
							<FlightTakeoffIcon
								sx={{
									fontSize: 32,
									color: 'primary.main !important',
									mr: 1.5,
								}}
							/>
							<Typography variant="h6" fontWeight={700} color="primary.main">
								Meet Loka
							</Typography>
						</Box>

						<Stack direction="row" spacing={1}>
							{navItems.map((item) => (
								<Button
									key={item.path}
									onClick={() => navigate(item.path)}
									startIcon={item.icon}
									variant={item.highlight ? 'contained' : location.pathname === item.path ? 'outlined' : 'text'}
									sx={{
										px: 3,
										...(item.highlight && {
											background: 'linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)',
										}),
									}}
								>
									{item.label}
								</Button>
							))}
						</Stack>
					</Toolbar>
				</Container>
			</AppBar>

			<Box
				component="main"
				sx={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					bgcolor: 'background.default',
					color: 'text.primary',
				}}
			>
				{children}
			</Box>

			<Box
				component="footer"
				sx={{
					py: 4,
					px: 2,
					mt: 'auto',
					bgcolor: '#f8fafc',
					borderTop: '1px solid',
					borderColor: 'grey.200',
				}}
			>
				<Container maxWidth="lg">
					<Typography variant="body2" color="text.secondary" align="center">
						© {new Date().getFullYear()} Meet Loka - Your Travel Planning Companion
					</Typography>
				</Container>
			</Box>
		</Box>
	);
};

export default Layout;

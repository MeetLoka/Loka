import { Container, AppBar, Toolbar, Typography, Button, Stack, Box } from '@mui/material';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Trips from './pages/Trips';
import TripDetails from './pages/TripDetails';
import NewTrip from './pages/NewTrip';

export default function App() {
	const navigate = useNavigate();
	return (
		<Box display="flex" flexDirection="column" minHeight="100%">
			<AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', color: 'text.primary', borderBottom: '1px solid', borderColor: 'grey.200' }}>
				<Container maxWidth="lg">
					<Toolbar disableGutters sx={{ py: 1 }}>
						<Typography component={Link} to="/" variant="h6" fontWeight={700} color="primary.main" sx={{ textDecoration: 'none', flexGrow: 1 }}>
							Meet Loka v1
						</Typography>
						<Stack direction="row" spacing={1}>
							<Button onClick={() => navigate('/trips')} variant="text">
								Trips
							</Button>
							<Button onClick={() => navigate('/trip/new')} variant="contained">
								New Trip
							</Button>
						</Stack>
					</Toolbar>
				</Container>
			</AppBar>
			<Container maxWidth="lg" sx={{ py: 3, flex: 1 }}>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/trips" element={<Trips />} />
					<Route path="/trip/new" element={<NewTrip />} />
					<Route path="/trips/:id" element={<TripDetails />} />
				</Routes>
			</Container>
		</Box>
	);
}

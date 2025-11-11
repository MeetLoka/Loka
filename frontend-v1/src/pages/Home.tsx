import { Card, CardContent, Typography, Stack, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export default function Home() {
	return (
		<Stack spacing={2}>
			<Typography variant="h4" fontWeight={700}>
				Welcome to Meet Loka v1
			</Typography>
			<Typography color="text.secondary">This is a minimal UI built for reliability against the existing backend.</Typography>
			<Stack direction="row" spacing={2}>
				<Button variant="contained" component={Link} to="/trips">
					View Trips
				</Button>
				<Button variant="outlined" component={Link} to="/trip/new">
					Create Trip
				</Button>
			</Stack>
			<Card>
				<CardContent>
					<Typography variant="body2">
						Backend base URL proxied at <code>/api</code>. Health: <code>/api/health</code>.
					</Typography>
				</CardContent>
			</Card>
		</Stack>
	);
}

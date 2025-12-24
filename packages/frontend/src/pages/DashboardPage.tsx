import { Container, Box, Button, Stack, Grid, Card, CardContent, CardActions, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../hooks/useAuth';
import { SyncStatusIndicator } from '../components/SyncStatusIndicator';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #ddd',
        }}
      >
        <h1>Character Creator</h1>
        {user && (
          <Stack direction="row" spacing={2} alignItems="center">
            <span>Welcome, {user.displayName}</span>
            <SyncStatusIndicator />
            <Button variant="outlined" onClick={() => navigate('/characters')}>
              My Characters
            </Button>
            <Button variant="outlined" onClick={() => navigate('/parties')}>
              My Parties
            </Button>
            <Button variant="contained" onClick={handleLogout}>
              Logout
            </Button>
          </Stack>
        )}
      </Box>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
            Welcome to Character Creator! Manage your D&D characters and adventuring parties.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                    <Typography variant="h5">Characters</Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Create and manage your D&D characters. Track ability scores, hit points,
                    equipment, and backstories. Export character sheets as PDF.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate('/characters')}>
                    View Characters
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GroupsIcon sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                    <Typography variant="h5">Parties</Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Organize your characters into adventuring parties. Group characters
                    by campaign, share party notes, and manage shared inventory.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate('/parties')}>
                    View Parties
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SettingsIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                    <Typography variant="h5">System Configuration</Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Manage RPG system configurations. Create, edit, and customize game systems
                    including D&D 5e, Pathfinder 2e, Starfinder, and Call of Cthulhu.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate('/systems')}>
                    Manage Systems
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </>
  );
};

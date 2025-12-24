import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import { useParty } from '../hooks/useParty';

export const PartiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { parties, loading, error, fetchParties, createParty, clearError } = useParty();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign_name: '',
    is_public: false,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchParties();
  }, []);

  const handleCreate = async () => {
    if (!formData.name.trim()) return;

    setCreating(true);
    try {
      const result = await createParty(formData).unwrap();
      setCreateDialogOpen(false);
      setFormData({ name: '', description: '', campaign_name: '', is_public: false });
      navigate(`/parties/${result.id}`);
    } catch {
      // Error handled by Redux
    } finally {
      setCreating(false);
    }
  };

  if (loading && parties.length === 0) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          <GroupsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          My Parties
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Party
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {parties.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <GroupsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No parties yet
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Create a party to group your characters for a campaign.
          </Typography>
          <Button variant="contained" onClick={() => setCreateDialogOpen(true)}>
            Create Your First Party
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {parties.map((party) => (
            <Grid item xs={12} sm={6} md={4} key={party.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {party.name}
                  </Typography>
                  {party.campaignName && (
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Campaign: {party.campaignName}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      size="small"
                      label={`${party.memberCount} member${party.memberCount !== 1 ? 's' : ''}`}
                    />
                    {party.isPublic && <Chip size="small" color="success" label="Public" />}
                  </Box>
                  {party.description && (
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mt: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {party.description}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(`/parties/${party.id}`)}>
                    View
                  </Button>
                  <Button size="small" onClick={() => navigate(`/parties/${party.id}/edit`)}>
                    Edit
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Party Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Party</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Party Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="Campaign Name"
              value={formData.campaign_name}
              onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
              fullWidth
              placeholder="e.g., Curse of Strahd"
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                />
              }
              label="Make this party public"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={creating || !formData.name.trim()}
          >
            {creating ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

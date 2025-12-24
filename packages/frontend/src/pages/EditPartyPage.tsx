import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useParty } from '../hooks/useParty';
import { InventoryItem } from '../store/partySlice';

export const EditPartyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedParty, loading, error, fetchPartyById, updateParty } = useParty();

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign_name: '',
    is_public: false,
    notes: '',
    shared_gold: 0,
    shared_inventory: [] as InventoryItem[],
  });

  const [newItem, setNewItem] = useState({ name: '', quantity: 1, description: '' });

  useEffect(() => {
    if (id) {
      fetchPartyById(id);
    }
  }, [id]);

  useEffect(() => {
    if (selectedParty) {
      setFormData({
        name: selectedParty.name,
        description: selectedParty.description || '',
        campaign_name: selectedParty.campaignName || '',
        is_public: selectedParty.isPublic,
        notes: selectedParty.notes || '',
        shared_gold: selectedParty.sharedGold || 0,
        shared_inventory: selectedParty.sharedInventory || [],
      });
    }
  }, [selectedParty]);

  const handleAddItem = () => {
    if (newItem.name.trim()) {
      setFormData({
        ...formData,
        shared_inventory: [...formData.shared_inventory, { ...newItem }],
      });
      setNewItem({ name: '', quantity: 1, description: '' });
    }
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      shared_inventory: formData.shared_inventory.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateParty(id, formData).unwrap();
      setSaveSuccess(true);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !selectedParty) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/parties')}>
          Back to Parties
        </Button>
      </Container>
    );
  }

  if (!selectedParty) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">Party not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/parties')} sx={{ mt: 2 }}>
          Back to Parties
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/parties/${id}`)}>
          Back to Party
        </Button>
        <Typography variant="h5">Editing: {selectedParty.name}</Typography>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveSuccess(false)}>
          Party saved successfully!
        </Alert>
      )}
      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="Party Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
            disabled={saving}
          />

          <TextField
            label="Campaign Name"
            value={formData.campaign_name}
            onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
            fullWidth
            disabled={saving}
            placeholder="e.g., Curse of Strahd"
          />

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            multiline
            rows={3}
            disabled={saving}
          />

          <TextField
            label="Party Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            fullWidth
            multiline
            rows={4}
            disabled={saving}
            placeholder="Session notes, loot tracking, quest objectives, etc."
            helperText="Use this space to keep track of important party information"
          />

          <Divider />

          {/* Shared Resources Section */}
          <Typography variant="h6">Shared Resources</Typography>

          <TextField
            label="Party Gold"
            type="number"
            value={formData.shared_gold}
            onChange={(e) => setFormData({ ...formData, shared_gold: Math.max(0, parseInt(e.target.value) || 0) })}
            fullWidth
            disabled={saving}
            inputProps={{ min: 0 }}
          />

          <Typography variant="subtitle1">Shared Inventory</Typography>

          {formData.shared_inventory.length > 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell align="center" sx={{ width: 80 }}>Qty</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="center" sx={{ width: 50 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.shared_inventory.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(index)}
                          disabled={saving}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              label="Item Name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              size="small"
              disabled={saving}
              sx={{ flex: 2 }}
            />
            <TextField
              label="Qty"
              type="number"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
              size="small"
              disabled={saving}
              inputProps={{ min: 1 }}
              sx={{ width: 80 }}
            />
            <TextField
              label="Description (optional)"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              size="small"
              disabled={saving}
              sx={{ flex: 2 }}
            />
            <Button
              variant="outlined"
              onClick={handleAddItem}
              disabled={saving || !newItem.name.trim()}
              startIcon={<AddIcon />}
              sx={{ minWidth: 100, height: 40 }}
            >
              Add
            </Button>
          </Box>

          <Divider />

          <FormControlLabel
            control={
              <Switch
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                disabled={saving}
              />
            }
            label="Make this party public (visible to other users)"
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate(`/parties/${id}`)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={saving || !formData.name.trim()}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

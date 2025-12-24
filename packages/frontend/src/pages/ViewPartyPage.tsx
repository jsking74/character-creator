import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import NotesIcon from '@mui/icons-material/Notes';
import InventoryIcon from '@mui/icons-material/Inventory';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { useParty } from '../hooks/useParty';
import { useCharacter } from '../hooks/useCharacter';

export const ViewPartyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedParty, loading, error, fetchPartyById, deleteParty, addMember, removeMember } = useParty();
  const { characters, fetchCharacters } = useCharacter();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPartyById(id);
      fetchCharacters();
    }
  }, [id]);

  const handleDelete = async () => {
    if (id) {
      try {
        await deleteParty(id).unwrap();
        navigate('/parties');
      } catch {
        // Error handled by Redux
      }
    }
    setDeleteDialogOpen(false);
  };

  const handleAddMember = async () => {
    if (id && selectedCharacterId) {
      setActionLoading(true);
      try {
        await addMember(id, selectedCharacterId).unwrap();
        setAddMemberDialogOpen(false);
        setSelectedCharacterId('');
      } catch {
        // Error handled by Redux
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleRemoveMember = async (characterId: string) => {
    if (id) {
      setActionLoading(true);
      try {
        await removeMember(id, characterId).unwrap();
      } catch {
        // Error handled by Redux
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Filter out characters that are already members
  const availableCharacters = characters.filter(
    (char) => !selectedParty?.members.some((m) => m.id === char.id)
  );

  if (loading) {
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

  const party = selectedParty;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/parties')}>
          Back to Parties
        </Button>
        <Box>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/parties/${id}/edit`)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <IconButton color="error" onClick={() => setDeleteDialogOpen(true)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Party Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {party.name}
            </Typography>
            {party.campaignName && (
              <Typography variant="h6" color="textSecondary">
                Campaign: {party.campaignName}
              </Typography>
            )}
          </Box>
          <Box>
            {party.isPublic && <Chip label="Public" color="success" />}
          </Box>
        </Box>
        {party.description && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            {party.description}
          </Typography>
        )}
      </Paper>

      {/* Shared Resources */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InventoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="h6">Shared Resources</Typography>
        </Box>

        {/* Shared Gold */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MonetizationOnIcon sx={{ mr: 1, color: 'warning.main' }} />
          <Typography variant="body1">
            Party Gold: <strong>{party.sharedGold || 0} gp</strong>
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Shared Inventory */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Shared Inventory
        </Typography>
        {(!party.sharedInventory || party.sharedInventory.length === 0) ? (
          <Typography variant="body2" color="textSecondary">
            No shared items. Edit the party to add items to the shared inventory.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="center">Qty</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {party.sharedInventory.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="center">{item.quantity}</TableCell>
                    <TableCell>{item.description || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Party Notes */}
      {party.notes && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <NotesIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="h6">Party Notes</Typography>
          </Box>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {party.notes}
          </Typography>
        </Paper>
      )}

      {/* Members */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Party Members ({party.memberCount})
          </Typography>
          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            onClick={() => setAddMemberDialogOpen(true)}
            disabled={availableCharacters.length === 0}
          >
            Add Member
          </Button>
        </Box>

        {party.members.length === 0 ? (
          <Alert severity="info">
            No members yet. Add characters to your party!
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {party.members.map((member) => (
              <Grid item xs={12} sm={6} md={4} key={member.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">{member.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Level {member.level} {member.race} {member.class}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate(`/characters/${member.id}`)}>
                      View
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={actionLoading}
                    >
                      <PersonRemoveIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Metadata */}
      <Box sx={{ mt: 3, textAlign: 'right' }}>
        <Typography variant="caption" color="textSecondary">
          Created: {new Date(party.createdAt).toLocaleDateString()}
          {' | '}
          Updated: {new Date(party.updatedAt).toLocaleDateString()}
        </Typography>
      </Box>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Party</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{party.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onClose={() => setAddMemberDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Member to Party</DialogTitle>
        <DialogContent>
          {availableCharacters.length === 0 ? (
            <Alert severity="info" sx={{ mt: 1 }}>
              All your characters are already in this party, or you have no characters.
            </Alert>
          ) : (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Character</InputLabel>
              <Select
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                label="Select Character"
              >
                {availableCharacters.map((char) => (
                  <MenuItem key={char.id} value={char.id}>
                    {char.name} - Level {char.level} {char.race} {char.class}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMemberDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddMember}
            variant="contained"
            disabled={!selectedCharacterId || actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

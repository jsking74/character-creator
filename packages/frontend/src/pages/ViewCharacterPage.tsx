import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  SelectChangeEvent,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CodeIcon from '@mui/icons-material/Code';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useCharacter } from '../hooks/useCharacter';
import { axiosInstance } from '../services/authService';
import { DiceRoller } from '../components/DiceRoller';
import { useAppDispatch } from '../store/hooks';
import { generateShareToken, getShareTokenInfo, revokeShareToken, ShareTokenInfo } from '../store/characterSlice';

const AbilityScoreCard: React.FC<{ name: string; score: number; modifier: number }> = ({
  name,
  score,
  modifier,
}) => (
  <Card sx={{ textAlign: 'center', minWidth: 80 }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase' }}>
        {name.slice(0, 3)}
      </Typography>
      <Typography variant="h5" fontWeight="bold">
        {score}
      </Typography>
      <Typography variant="body2" color={modifier >= 0 ? 'success.main' : 'error.main'}>
        {modifier >= 0 ? '+' : ''}{modifier}
      </Typography>
    </CardContent>
  </Card>
);

export const ViewCharacterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedCharacter, loading, error, fetchCharacterById, deleteCharacter } = useCharacter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareTokenInfo, setShareTokenInfo] = useState<ShareTokenInfo | null>(null);
  const [shareExpiration, setShareExpiration] = useState<string>('never');
  const [shareLoading, setShareLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (id) {
      fetchCharacterById(id);
    }
  }, [id]);

  useEffect(() => {
    // Fetch existing share token info when dialog opens
    if (shareDialogOpen && id) {
      dispatch(getShareTokenInfo(id))
        .unwrap()
        .then((info) => setShareTokenInfo(info))
        .catch(() => setShareTokenInfo(null));
    }
  }, [shareDialogOpen, id, dispatch]);

  const handleDelete = async () => {
    if (id) {
      try {
        await deleteCharacter(id).unwrap();
        navigate('/characters');
      } catch {
        // Error handled by Redux
      }
    }
    setDeleteDialogOpen(false);
  };

  const handleExportPdf = async () => {
    if (!id || !selectedCharacter) return;

    setPdfLoading(true);
    try {
      const response = await axiosInstance.get(`/api/characters/${id}/pdf`, {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedCharacter.name.replace(/[^a-zA-Z0-9]/g, '_')}_character_sheet.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportJson = async () => {
    if (!id || !selectedCharacter) return;

    setJsonLoading(true);
    try {
      const response = await axiosInstance.get(`/api/characters/${id}/json`, {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedCharacter.name.replace(/[^a-zA-Z0-9]/g, '_')}_character.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export JSON:', err);
    } finally {
      setJsonLoading(false);
    }
  };

  const handleGenerateShareLink = async () => {
    if (!id) return;

    setShareLoading(true);
    try {
      const expiresInDays = shareExpiration === 'never' ? null : parseInt(shareExpiration);
      const result = await dispatch(generateShareToken({ characterId: id, expiresInDays })).unwrap();
      setShareTokenInfo(result);
      setSnackbarMessage('Share link generated!');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage('Failed to generate share link');
      setSnackbarOpen(true);
    } finally {
      setShareLoading(false);
    }
  };

  const handleRevokeShareLink = async () => {
    if (!id) return;

    setShareLoading(true);
    try {
      await dispatch(revokeShareToken(id)).unwrap();
      setShareTokenInfo(null);
      setSnackbarMessage('Share link revoked');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage('Failed to revoke share link');
      setSnackbarOpen(true);
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyShareLink = () => {
    if (shareTokenInfo) {
      const fullUrl = `${window.location.origin}/shared/${shareTokenInfo.token}`;
      navigator.clipboard.writeText(fullUrl).then(() => {
        setSnackbarMessage('Link copied to clipboard!');
        setSnackbarOpen(true);
      });
    }
  };

  const handleExpirationChange = (event: SelectChangeEvent) => {
    setShareExpiration(event.target.value);
  };

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
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/characters')}>
          Back to Characters
        </Button>
      </Container>
    );
  }

  if (!selectedCharacter) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">Character not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/characters')} sx={{ mt: 2 }}>
          Back to Characters
        </Button>
      </Container>
    );
  }

  const character = selectedCharacter;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/characters')}>
          Back to Characters
        </Button>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={() => setShareDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Share
          </Button>
          <Button
            variant="outlined"
            startIcon={pdfLoading ? <CircularProgress size={20} /> : <PictureAsPdfIcon />}
            onClick={handleExportPdf}
            disabled={pdfLoading}
            sx={{ mr: 1 }}
          >
            {pdfLoading ? 'Exporting...' : 'Export PDF'}
          </Button>
          <Button
            variant="outlined"
            startIcon={jsonLoading ? <CircularProgress size={20} /> : <CodeIcon />}
            onClick={handleExportJson}
            disabled={jsonLoading}
            sx={{ mr: 1 }}
          >
            {jsonLoading ? 'Exporting...' : 'Export JSON'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/characters/${id}/edit`)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <IconButton color="error" onClick={() => setDeleteDialogOpen(true)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Main Character Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {character.name}
            </Typography>
            <Typography variant="h6" color="textSecondary">
              Level {character.level} {character.race} {character.class}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Chip label={character.system.toUpperCase()} color="primary" sx={{ mb: 1 }} />
            {character.isPublic && <Chip label="Public" color="success" sx={{ ml: 1, mb: 1 }} />}
          </Box>
        </Box>

        {character.alignment && (
          <Typography variant="body1" color="textSecondary">
            Alignment: {character.alignment}
          </Typography>
        )}
        {character.background && (
          <Typography variant="body1" color="textSecondary">
            Background: {character.background}
          </Typography>
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* Ability Scores */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ability Scores
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'space-around' }}>
              <AbilityScoreCard
                name="Strength"
                score={character.abilityScores.strength}
                modifier={character.abilityModifiers.strength}
              />
              <AbilityScoreCard
                name="Dexterity"
                score={character.abilityScores.dexterity}
                modifier={character.abilityModifiers.dexterity}
              />
              <AbilityScoreCard
                name="Constitution"
                score={character.abilityScores.constitution}
                modifier={character.abilityModifiers.constitution}
              />
              <AbilityScoreCard
                name="Intelligence"
                score={character.abilityScores.intelligence}
                modifier={character.abilityModifiers.intelligence}
              />
              <AbilityScoreCard
                name="Wisdom"
                score={character.abilityScores.wisdom}
                modifier={character.abilityModifiers.wisdom}
              />
              <AbilityScoreCard
                name="Charisma"
                score={character.abilityScores.charisma}
                modifier={character.abilityModifiers.charisma}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Health */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Hit Points
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary">
                    Current
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {character.health.currentHitPoints}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary">
                    Maximum
                  </Typography>
                  <Typography variant="h4">
                    {character.health.maxHitPoints}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary">
                    Temporary
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {character.health.temporaryHitPoints}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">Gold</Typography>
              <Typography variant="h6" color="warning.main">
                {character.gold} gp
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Dice Roller */}
        <Grid item xs={12} md={6}>
          <DiceRoller abilityScores={character.abilityScores} />
        </Grid>

        {/* Backstory */}
        {character.backstory && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Backstory
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {character.backstory}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Metadata */}
      <Box sx={{ mt: 3, textAlign: 'right' }}>
        <Typography variant="caption" color="textSecondary">
          Created: {new Date(character.createdAt).toLocaleDateString()}
          {' | '}
          Updated: {new Date(character.updatedAt).toLocaleDateString()}
        </Typography>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Character</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{character.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Character</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Create a shareable link to let others view this character without logging in.
          </DialogContentText>

          {shareTokenInfo ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Share link is active
                {shareTokenInfo.expiresAt && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Expires: {new Date(shareTokenInfo.expiresAt).toLocaleDateString()}
                  </Typography>
                )}
              </Alert>

              <TextField
                fullWidth
                label="Share Link"
                value={`${window.location.origin}/shared/${shareTokenInfo.token}`}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton onClick={handleCopyShareLink}>
                      <ContentCopyIcon />
                    </IconButton>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Button
                variant="outlined"
                color="error"
                onClick={handleRevokeShareLink}
                disabled={shareLoading}
                fullWidth
              >
                {shareLoading ? <CircularProgress size={20} /> : 'Revoke Share Link'}
              </Button>
            </Box>
          ) : (
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Link Expiration</InputLabel>
                <Select
                  value={shareExpiration}
                  label="Link Expiration"
                  onChange={handleExpirationChange}
                >
                  <MenuItem value="never">Never expires</MenuItem>
                  <MenuItem value="1">1 day</MenuItem>
                  <MenuItem value="7">7 days</MenuItem>
                  <MenuItem value="30">30 days</MenuItem>
                  <MenuItem value="90">90 days</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="contained"
                color="primary"
                onClick={handleGenerateShareLink}
                disabled={shareLoading}
                fullWidth
                startIcon={shareLoading ? <CircularProgress size={20} /> : <ShareIcon />}
              >
                Generate Share Link
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

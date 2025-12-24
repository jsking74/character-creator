import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Container,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import WarningIcon from '@mui/icons-material/Warning';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNavigate } from 'react-router-dom';
import { useCharacter } from '../hooks/useCharacter';
import { useAppDispatch } from '../store/hooks';
import { importCharacter } from '../store/characterSlice';

export const CharacterList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { characters, loading, error, fetchCharacters } = useCharacter();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleImportClick = () => {
    setImportDialogOpen(true);
    setImportError(null);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportError(null);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const result = await dispatch(importCharacter(jsonData)).unwrap();
      setImportDialogOpen(false);
      setSnackbarMessage(`Successfully imported "${result.name}"!`);
      setSnackbarOpen(true);
      navigate(`/characters/${result.id}`);
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setImportError('Invalid JSON file. Please select a valid character JSON file.');
      } else {
        setImportError(err?.message || err || 'Failed to import character');
      }
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          My Characters
        </Typography>
        <Button
          variant="outlined"
          startIcon={<UploadFileIcon />}
          onClick={handleImportClick}
        >
          Import JSON
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {characters.length === 0 ? (
        <Alert severity="info">
          No characters yet. Use the form to create your first character!
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {characters.map((character) => (
            <Grid item xs={12} sm={6} md={4} key={character.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" gutterBottom>
                      {character.name}
                    </Typography>
                    {character.syncStatus && character.syncStatus !== 'synced' && (
                      <Chip
                        size="small"
                        icon={character.syncStatus === 'pending' ? <SyncIcon /> : <WarningIcon />}
                        label={character.syncStatus === 'pending' ? 'Pending' : 'Conflict'}
                        color={character.syncStatus === 'pending' ? 'warning' : 'error'}
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography color="textSecondary" gutterBottom>
                    Level {character.level} {character.race} {character.class}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    System: {character.system}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Alignment: {character.alignment}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(`/characters/${character.id}`)}>
                    View
                  </Button>
                  <Button size="small" onClick={() => navigate(`/characters/${character.id}/edit`)}>
                    Edit
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Character from JSON</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Select a character JSON file to import. The file should be a previously exported character from this application.
          </DialogContentText>

          {importError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {importError}
            </Alert>
          )}

          <input
            type="file"
            accept=".json,application/json"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="import-file-input"
          />
          <label htmlFor="import-file-input">
            <Button
              variant="contained"
              component="span"
              fullWidth
              disabled={importLoading}
              startIcon={importLoading ? <CircularProgress size={20} /> : <UploadFileIcon />}
            >
              {importLoading ? 'Importing...' : 'Select JSON File'}
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)} disabled={importLoading}>
            Cancel
          </Button>
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

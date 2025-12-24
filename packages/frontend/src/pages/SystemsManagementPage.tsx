import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchSystems,
  deleteSystem,
  exportSystem,
  importSystem,
  SystemConfigData,
} from '../store/systemSlice';

export const SystemsManagementPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { systems, loading, error } = useAppSelector((state) => state.system);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [systemToDelete, setSystemToDelete] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchSystems());
  }, [dispatch]);

  const handleDelete = async () => {
    if (systemToDelete) {
      await dispatch(deleteSystem(systemToDelete));
      setDeleteDialogOpen(false);
      setSystemToDelete(null);
    }
  };

  const handleExport = async (systemId: string) => {
    const result = await dispatch(exportSystem(systemId));
    if (exportSystem.fulfilled.match(result)) {
      const dataStr = JSON.stringify(result.payload, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${systemId}-${(result.payload as any).version}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const systemData = JSON.parse(content);

        if (!systemData.id || !systemData.name || !systemData.config) {
          setImportError('Invalid system file: missing required fields');
          return;
        }

        const result = await dispatch(
          importSystem({
            id: systemData.id,
            name: systemData.name,
            version: systemData.version || '1.0.0',
            description: systemData.description,
            config: systemData.config as SystemConfigData,
          })
        );

        if (importSystem.fulfilled.match(result)) {
          setImportDialogOpen(false);
          setImportError(null);
        } else if (importSystem.rejected.match(result)) {
          setImportError(result.payload as string);
        }
      } catch (err) {
        setImportError('Failed to parse system file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          System Configuration Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setImportDialogOpen(true)}
          >
            Import System
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            href="/systems/new"
          >
            Create New System
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {systems.map((system) => (
                <TableRow key={system.id}>
                  <TableCell>
                    <code>{system.id}</code>
                  </TableCell>
                  <TableCell>{system.name}</TableCell>
                  <TableCell>{system.version}</TableCell>
                  <TableCell>{system.description || '-'}</TableCell>
                  <TableCell>
                    {system.isDefault && (
                      <Chip label="Default" color="primary" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleExport(system.id)}
                      title="Export"
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      href={`/systems/${system.id}/edit`}
                      title="Edit"
                      disabled={system.isDefault}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSystemToDelete(system.id);
                        setDeleteDialogOpen(true);
                      }}
                      title="Delete"
                      disabled={system.isDefault}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this system configuration? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => {
          setImportDialogOpen(false);
          setImportError(null);
        }}
      >
        <DialogTitle>Import System Configuration</DialogTitle>
        <DialogContent>
          {importError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {importError}
            </Alert>
          )}
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select a JSON file containing the system configuration to import.
          </Typography>
          <Button variant="contained" component="label">
            Choose File
            <input type="file" accept=".json" hidden onChange={handleImportFile} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setImportDialogOpen(false);
              setImportError(null);
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

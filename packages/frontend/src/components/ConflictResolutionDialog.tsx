import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import CloudIcon from '@mui/icons-material/Cloud';
import ComputerIcon from '@mui/icons-material/Computer';
import { ConflictRecord, LocalCharacter } from '../services/indexedDb';

interface ConflictResolutionDialogProps {
  open: boolean;
  conflict: ConflictRecord | null;
  onResolve: (resolution: 'local' | 'server') => void;
  onClose: () => void;
}

export const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  open,
  conflict,
  onResolve,
  onClose,
}) => {
  if (!conflict) return null;

  const localVersion = conflict.localVersion as LocalCharacter;
  const serverVersion = conflict.serverVersion as LocalCharacter;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getChangedFields = () => {
    const fields: Array<{
      field: string;
      local: string | number;
      server: string | number;
    }> = [];

    const compareFields = [
      { key: 'name', label: 'Name' },
      { key: 'level', label: 'Level' },
      { key: 'class', label: 'Class' },
      { key: 'race', label: 'Race' },
      { key: 'alignment', label: 'Alignment' },
      { key: 'gold', label: 'Gold' },
      { key: 'isPublic', label: 'Public' },
    ];

    for (const { key, label } of compareFields) {
      const localVal = localVersion[key as keyof LocalCharacter];
      const serverVal = serverVersion[key as keyof LocalCharacter];
      if (localVal !== serverVal) {
        fields.push({
          field: label,
          local: String(localVal ?? '—'),
          server: String(serverVal ?? '—'),
        });
      }
    }

    // Check ability scores
    const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    for (const ability of abilities) {
      const localVal = localVersion.abilityScores?.[ability as keyof typeof localVersion.abilityScores];
      const serverVal = serverVersion.abilityScores?.[ability as keyof typeof serverVersion.abilityScores];
      if (localVal !== serverVal) {
        fields.push({
          field: ability.charAt(0).toUpperCase() + ability.slice(1),
          local: localVal ?? '—',
          server: serverVal ?? '—',
        });
      }
    }

    // Check health
    if (localVersion.health?.currentHitPoints !== serverVersion.health?.currentHitPoints) {
      fields.push({
        field: 'Current HP',
        local: localVersion.health?.currentHitPoints ?? '—',
        server: serverVersion.health?.currentHitPoints ?? '—',
      });
    }
    if (localVersion.health?.maxHitPoints !== serverVersion.health?.maxHitPoints) {
      fields.push({
        field: 'Max HP',
        local: localVersion.health?.maxHitPoints ?? '—',
        server: serverVersion.health?.maxHitPoints ?? '—',
      });
    }

    return fields;
  };

  const changedFields = getChangedFields();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Conflict Detected: {localVersion.name}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This character was modified both locally and on the server. Please choose which version to keep.
        </Typography>

        <Grid container spacing={2}>
          {/* Local Version */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ComputerIcon color="primary" />
                <Typography variant="h6">Local Version</Typography>
                <Chip label="Your Changes" size="small" color="primary" />
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Modified: {formatDate(localVersion.localUpdatedAt)}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" gutterBottom>
                <strong>Name:</strong> {localVersion.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Level:</strong> {localVersion.level} {localVersion.race} {localVersion.class}
              </Typography>
              {localVersion.alignment && (
                <Typography variant="body2" gutterBottom>
                  <strong>Alignment:</strong> {localVersion.alignment}
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Server Version */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CloudIcon color="secondary" />
                <Typography variant="h6">Server Version</Typography>
                <Chip label="Cloud" size="small" color="secondary" />
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Modified: {formatDate(serverVersion.updatedAt)}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" gutterBottom>
                <strong>Name:</strong> {serverVersion.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Level:</strong> {serverVersion.level} {serverVersion.race} {serverVersion.class}
              </Typography>
              {serverVersion.alignment && (
                <Typography variant="body2" gutterBottom>
                  <strong>Alignment:</strong> {serverVersion.alignment}
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Changed Fields */}
        {changedFields.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Changed Fields
            </Typography>
            <Paper variant="outlined">
              <List dense>
                {changedFields.map((change, index) => (
                  <React.Fragment key={change.field}>
                    <ListItem>
                      <ListItemText
                        primary={change.field}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Typography variant="caption" component="span" color="primary">
                              Local: {change.local}
                            </Typography>
                            <Typography variant="caption" component="span" color="secondary">
                              Server: {change.server}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < changedFields.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={() => onResolve('server')}
          variant="outlined"
          startIcon={<CloudIcon />}
        >
          Use Server Version
        </Button>
        <Button
          onClick={() => onResolve('local')}
          variant="contained"
          startIcon={<ComputerIcon />}
        >
          Use Local Version
        </Button>
      </DialogActions>
    </Dialog>
  );
};

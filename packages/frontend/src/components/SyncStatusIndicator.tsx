import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Badge,
  Typography,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
} from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SyncIcon from '@mui/icons-material/Sync';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useSync } from '../hooks/useSync';

export const SyncStatusIndicator: React.FC = () => {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    conflictCount,
    lastSyncedAt,
    error,
    sync,
  } = useSync();

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSync = async () => {
    await sync();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'sync-status-popover' : undefined;

  const formatLastSync = (timestamp: string | null): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusColor = (): 'success' | 'warning' | 'error' | 'default' => {
    if (!isOnline) return 'default';
    if (error || conflictCount > 0) return 'error';
    if (pendingCount > 0) return 'warning';
    return 'success';
  };

  const getStatusIcon = () => {
    if (isSyncing) {
      return <CircularProgress size={20} />;
    }
    if (!isOnline) {
      return <CloudOffIcon />;
    }
    if (error || conflictCount > 0) {
      return <ErrorIcon color="error" />;
    }
    if (pendingCount > 0) {
      return <SyncIcon color="warning" />;
    }
    return <CloudIcon color="success" />;
  };

  const totalBadgeCount = pendingCount + conflictCount;

  return (
    <>
      <Tooltip title={isOnline ? 'Online' : 'Offline'}>
        <IconButton
          aria-describedby={id}
          onClick={handleClick}
          size="small"
          sx={{ mr: 1 }}
        >
          <Badge
            badgeContent={totalBadgeCount > 0 ? totalBadgeCount : undefined}
            color={getStatusColor()}
            max={99}
          >
            {getStatusIcon()}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, minWidth: 280 }}>
          <Typography variant="h6" gutterBottom>
            Sync Status
          </Typography>

          <List dense>
            <ListItem>
              <ListItemIcon>
                {isOnline ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <CloudOffIcon color="disabled" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={isOnline ? 'Online' : 'Offline'}
                secondary={isOnline ? 'Connected to server' : 'Working locally'}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <SyncIcon color={pendingCount > 0 ? 'warning' : 'success'} />
              </ListItemIcon>
              <ListItemText
                primary={`${pendingCount} pending change${pendingCount !== 1 ? 's' : ''}`}
                secondary={`Last synced: ${formatLastSync(lastSyncedAt)}`}
              />
            </ListItem>

            {conflictCount > 0 && (
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary={`${conflictCount} conflict${conflictCount !== 1 ? 's' : ''}`}
                  secondary="Resolve conflicts to sync"
                />
              </ListItem>
            )}

            {error && (
              <ListItem>
                <ListItemIcon>
                  <ErrorIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="Sync Error"
                  secondary={error}
                  secondaryTypographyProps={{ color: 'error' }}
                />
              </ListItem>
            )}
          </List>

          <Divider sx={{ my: 1 }} />

          <Button
            fullWidth
            variant="outlined"
            startIcon={isSyncing ? <CircularProgress size={16} /> : <SyncIcon />}
            onClick={handleSync}
            disabled={!isOnline || isSyncing}
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </Box>
      </Popover>
    </>
  );
};

// Compact version for inline use
export const SyncStatusChip: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, conflictCount } = useSync();

  const getLabel = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (conflictCount > 0) return `${conflictCount} conflict${conflictCount !== 1 ? 's' : ''}`;
    if (pendingCount > 0) return `${pendingCount} pending`;
    return 'Synced';
  };

  const getColor = (): 'success' | 'warning' | 'error' | 'default' => {
    if (!isOnline) return 'default';
    if (conflictCount > 0) return 'error';
    if (pendingCount > 0) return 'warning';
    return 'success';
  };

  const getIcon = () => {
    if (isSyncing) return <CircularProgress size={14} />;
    if (!isOnline) return <CloudOffIcon fontSize="small" />;
    if (conflictCount > 0) return <WarningIcon fontSize="small" />;
    if (pendingCount > 0) return <SyncIcon fontSize="small" />;
    return <CheckCircleIcon fontSize="small" />;
  };

  return (
    <Chip
      icon={getIcon()}
      label={getLabel()}
      color={getColor()}
      size="small"
      variant="outlined"
    />
  );
};

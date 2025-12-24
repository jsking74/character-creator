import React, { useEffect } from 'react';
import { Container, CircularProgress, Box, Alert } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { SystemEditor } from '../components/SystemEditor';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchSystemById, updateSystem, SystemConfigData } from '../store/systemSlice';

export const EditSystemPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedSystem, loading, error } = useAppSelector((state) => state.system);

  useEffect(() => {
    if (id) {
      dispatch(fetchSystemById(id));
    }
  }, [id, dispatch]);

  const handleSave = async (data: {
    id: string;
    name: string;
    version: string;
    description?: string;
    config: SystemConfigData;
  }) => {
    if (!id) return;
    await dispatch(
      updateSystem({
        id,
        updates: {
          name: data.name,
          version: data.version,
          description: data.description,
          config: data.config,
        },
      })
    ).unwrap();
  };

  const handleCancel = () => {
    navigate('/systems');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!selectedSystem) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">System not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <SystemEditor
        systemId={id}
        initialData={selectedSystem}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </Container>
  );
};

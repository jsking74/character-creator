import React from 'react';
import { Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SystemEditor } from '../components/SystemEditor';
import { useAppDispatch } from '../store/hooks';
import { createSystem, SystemConfigData } from '../store/systemSlice';

export const CreateSystemPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleSave = async (data: {
    id: string;
    name: string;
    version: string;
    description?: string;
    config: SystemConfigData;
  }) => {
    await dispatch(createSystem(data)).unwrap();
  };

  const handleCancel = () => {
    navigate('/systems');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <SystemEditor onSave={handleSave} onCancel={handleCancel} />
    </Container>
  );
};

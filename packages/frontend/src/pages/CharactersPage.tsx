import React from 'react';
import { Container, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CharacterForm } from '../components/CharacterForm';
import { CharacterList } from '../components/CharacterList';

export const CharactersPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <CharacterList />
        </Grid>
        <Grid item xs={12} md={4}>
          <CharacterForm onSuccess={() => navigate('/characters')} />
        </Grid>
      </Grid>
    </Container>
  );
};

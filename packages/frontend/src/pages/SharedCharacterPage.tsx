import React, { useEffect } from 'react';
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
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchSharedCharacter } from '../store/characterSlice';

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

export const SharedCharacterPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedCharacter, loading, error } = useAppSelector((state) => state.character);

  useEffect(() => {
    if (token) {
      dispatch(fetchSharedCharacter(token));
    }
  }, [token, dispatch]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      // Could add a toast notification here
      alert('Link copied to clipboard!');
    });
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
          {error === 'Share link has expired'
            ? 'This share link has expired. Please ask the owner for a new link.'
            : error}
        </Alert>
        <Button onClick={() => navigate('/browse')}>
          Browse Public Characters
        </Button>
      </Container>
    );
  }

  if (!selectedCharacter) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">Character not found or share link is invalid.</Alert>
        <Button onClick={() => navigate('/browse')} sx={{ mt: 2 }}>
          Browse Public Characters
        </Button>
      </Container>
    );
  }

  const character = selectedCharacter;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ShareIcon color="primary" />
          <Typography variant="body1" color="textSecondary">
            Shared Character
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {character.viewCount !== undefined && (
            <Chip
              icon={<VisibilityIcon />}
              label={`${character.viewCount} views`}
              size="small"
              variant="outlined"
            />
          )}
          <Button variant="outlined" startIcon={<ShareIcon />} onClick={handleCopyLink}>
            Copy Link
          </Button>
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

      {/* Footer */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Want to create your own characters?
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/register')}>
          Sign Up Free
        </Button>
      </Box>
    </Container>
  );
};

import React, { useEffect, useState } from 'react';
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
  Pagination,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PublicIcon from '@mui/icons-material/Public';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchPublicCharacters } from '../store/characterSlice';

const ITEMS_PER_PAGE = 12;

export const BrowseCharactersPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { characters, loading, error } = useAppSelector((state) => state.character);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchPublicCharacters({ limit: 100, offset: 0 }));
  }, [dispatch]);

  // Filter characters based on search term
  const filteredCharacters = characters.filter((char) => {
    const search = searchTerm.toLowerCase();
    return (
      char.name.toLowerCase().includes(search) ||
      char.class.toLowerCase().includes(search) ||
      char.race.toLowerCase().includes(search)
    );
  });

  // Paginate filtered characters
  const totalPages = Math.ceil(filteredCharacters.length / ITEMS_PER_PAGE);
  const paginatedCharacters = filteredCharacters.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <PublicIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4">
            Browse Public Characters
          </Typography>
        </Box>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Explore characters shared by the community. Get inspired for your next adventure!
        </Typography>

        <TextField
          fullWidth
          placeholder="Search by name, class, or race..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          sx={{ mt: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {filteredCharacters.length === 0 ? (
        <Alert severity="info">
          {searchTerm
            ? 'No characters match your search. Try different keywords.'
            : 'No public characters available yet. Be the first to share one!'}
        </Alert>
      ) : (
        <>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Showing {paginatedCharacters.length} of {filteredCharacters.length} characters
          </Typography>

          <Grid container spacing={3}>
            {paginatedCharacters.map((character) => (
              <Grid item xs={12} sm={6} md={4} key={character.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="h2">
                        {character.name}
                      </Typography>
                      <Chip
                        label={`Lvl ${character.level}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <Typography color="textSecondary" gutterBottom>
                      {character.race} {character.class}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      <Chip label={character.system} size="small" />
                      {character.alignment && (
                        <Chip label={character.alignment} size="small" variant="outlined" />
                      )}
                    </Box>
                    {character.background && (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Background: {character.background}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/browse/characters/${character.id}`)}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

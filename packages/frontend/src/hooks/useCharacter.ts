import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  fetchCharacters,
  fetchCharacterById,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  fetchPublicCharacters,
  setSelectedCharacter,
  clearError,
} from '../store/characterSlice';

export const useCharacter = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    characters,
    selectedCharacter,
    loading,
    error,
  } = useSelector((state: RootState) => state.character);

  return {
    characters,
    selectedCharacter,
    loading,
    error,
    fetchCharacters: () => dispatch(fetchCharacters()),
    fetchCharacterById: (id: string) => dispatch(fetchCharacterById(id)),
    createCharacter: (input: any) => dispatch(createCharacter(input)),
    updateCharacter: (characterId: string, updates: any) =>
      dispatch(updateCharacter({ characterId, ...updates })),
    deleteCharacter: (id: string) => dispatch(deleteCharacter(id)),
    fetchPublicCharacters: (limit?: number, offset?: number) =>
      dispatch(fetchPublicCharacters({ limit, offset })),
    setSelectedCharacter: (character: any) => dispatch(setSelectedCharacter(character)),
    clearError: () => dispatch(clearError()),
  };
};

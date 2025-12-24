import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  fetchParties,
  fetchPartyById,
  createParty,
  updateParty,
  deleteParty,
  addPartyMember,
  removePartyMember,
  setSelectedParty,
  clearError,
  Party,
} from '../store/partySlice';

export const useParty = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { parties, selectedParty, loading, error } = useSelector(
    (state: RootState) => state.party
  );

  return {
    parties,
    selectedParty,
    loading,
    error,
    fetchParties: () => dispatch(fetchParties()),
    fetchPartyById: (id: string) => dispatch(fetchPartyById(id)),
    createParty: (input: {
      name: string;
      description?: string;
      campaign_name?: string;
      is_public?: boolean;
    }) => dispatch(createParty(input)),
    updateParty: (partyId: string, updates: any) =>
      dispatch(updateParty({ partyId, ...updates })),
    deleteParty: (id: string) => dispatch(deleteParty(id)),
    addMember: (partyId: string, characterId: string) =>
      dispatch(addPartyMember({ partyId, characterId })),
    removeMember: (partyId: string, characterId: string) =>
      dispatch(removePartyMember({ partyId, characterId })),
    setSelectedParty: (party: Party | null) => dispatch(setSelectedParty(party)),
    clearError: () => dispatch(clearError()),
  };
};

import { Repository } from 'typeorm';
import { Party } from '../models/Party.js';
import { Character } from '../models/Character.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreatePartyInput {
  name: string;
  description?: string;
  campaign_name?: string;
  is_public?: boolean;
  notes?: string;
}

export interface UpdatePartyInput {
  name?: string;
  description?: string;
  campaign_name?: string;
  is_public?: boolean;
  notes?: string;
  shared_gold?: number;
  shared_inventory?: { name: string; quantity: number; description?: string }[];
}

export class PartyService {
  constructor(
    private partyRepository: Repository<Party>,
    private characterRepository: Repository<Character>
  ) {}

  async createParty(userId: string, input: CreatePartyInput): Promise<Party> {
    const party = new Party();
    party.id = uuidv4();
    party.owner_id = userId;
    party.name = input.name;
    party.description = input.description;
    party.campaign_name = input.campaign_name;
    party.is_public = input.is_public || false;
    party.notes = input.notes;
    party.members = [];

    return this.partyRepository.save(party);
  }

  async getPartiesByUserId(userId: string): Promise<Party[]> {
    return this.partyRepository.find({
      where: { owner_id: userId },
      relations: ['members'],
      order: { updated_at: 'DESC' },
    });
  }

  async getPartyById(partyId: string, userId?: string): Promise<Party | null> {
    const query = this.partyRepository.createQueryBuilder('party')
      .leftJoinAndSelect('party.members', 'members')
      .where('party.id = :id', { id: partyId });

    if (userId) {
      query.andWhere('(party.owner_id = :userId OR party.is_public = true)', { userId });
    }

    return query.getOne();
  }

  async updateParty(partyId: string, userId: string, input: UpdatePartyInput): Promise<Party> {
    const party = await this.partyRepository.findOne({
      where: { id: partyId, owner_id: userId },
      relations: ['members'],
    });

    if (!party) {
      throw new Error('Party not found');
    }

    if (input.name !== undefined) party.name = input.name;
    if (input.description !== undefined) party.description = input.description;
    if (input.campaign_name !== undefined) party.campaign_name = input.campaign_name;
    if (input.is_public !== undefined) party.is_public = input.is_public;
    if (input.notes !== undefined) party.notes = input.notes;
    if (input.shared_gold !== undefined) party.shared_gold = input.shared_gold;
    if (input.shared_inventory !== undefined) party.shared_inventory = input.shared_inventory;

    return this.partyRepository.save(party);
  }

  async deleteParty(partyId: string, userId: string): Promise<boolean> {
    const party = await this.partyRepository.findOne({
      where: { id: partyId, owner_id: userId },
    });

    if (!party) {
      throw new Error('Party not found');
    }

    await this.partyRepository.remove(party);
    return true;
  }

  async addMember(partyId: string, userId: string, characterId: string): Promise<Party> {
    const party = await this.partyRepository.findOne({
      where: { id: partyId, owner_id: userId },
      relations: ['members'],
    });

    if (!party) {
      throw new Error('Party not found');
    }

    // Check if character exists and belongs to user
    const character = await this.characterRepository.findOne({
      where: { id: characterId, user_id: userId },
    });

    if (!character) {
      throw new Error('Character not found');
    }

    // Check if already a member
    if (party.members.some(m => m.id === characterId)) {
      throw new Error('Character is already a member of this party');
    }

    party.members.push(character);
    return this.partyRepository.save(party);
  }

  async removeMember(partyId: string, userId: string, characterId: string): Promise<Party> {
    const party = await this.partyRepository.findOne({
      where: { id: partyId, owner_id: userId },
      relations: ['members'],
    });

    if (!party) {
      throw new Error('Party not found');
    }

    const memberIndex = party.members.findIndex(m => m.id === characterId);
    if (memberIndex === -1) {
      throw new Error('Character is not a member of this party');
    }

    party.members.splice(memberIndex, 1);
    return this.partyRepository.save(party);
  }

  async getPublicParties(limit = 20, offset = 0): Promise<Party[]> {
    return this.partyRepository.find({
      where: { is_public: true },
      relations: ['members'],
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  exportAsJSON(party: Party): object {
    return {
      id: party.id,
      name: party.name,
      description: party.description,
      campaignName: party.campaign_name,
      isPublic: party.is_public,
      notes: party.notes,
      sharedGold: party.shared_gold,
      sharedInventory: party.shared_inventory || [],
      memberCount: party.members?.length || 0,
      members: party.members?.map(member => ({
        id: member.id,
        name: member.name,
        class: member.character_data.basics.class,
        race: member.character_data.basics.race,
        level: member.character_data.basics.level,
      })) || [],
      createdAt: party.created_at,
      updatedAt: party.updated_at,
    };
  }
}

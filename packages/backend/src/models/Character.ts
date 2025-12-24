import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.js';
import { CharacterData } from '@character-creator/shared';

@Entity('characters')
@Index(['user_id', 'system_id'])
export class Character {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'varchar', length: 50 })
  system_id: string; // e.g., 'd&d5e', 'pathfinder'

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'simple-json' }) // Maps to 'jsonb' for PostgreSQL, 'text' for SQLite
  character_data: CharacterData;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url?: string;

  // Metadata
  @Column({ type: 'boolean', default: false })
  is_public: boolean;

  // Share token for private sharing via link
  @Column({ type: 'varchar', length: 16, nullable: true, unique: true })
  share_token?: string;

  @Column({ type: 'datetime', nullable: true })
  share_token_expires_at?: Date;

  @Column({ type: 'int', default: 0 })
  view_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  constructor() {
    this.id = '';
    this.user_id = '';
    this.system_id = 'd&d5e';
    this.name = '';
    this.character_data = {
      attributes: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      basics: {
        race: '',
        class: '',
        level: 1,
        experience: 0,
      },
      hitPoints: {
        current: 0,
        maximum: 0,
        temporary: 0,
      },
      skills: {},
      proficiencies: {
        skills: [],
        weapons: [],
        armor: [],
      },
      equipment: {
        weapons: [],
        armor: [],
        backpack: [],
      },
      spells: {
        prepared: [],
      },
      traits: {
        features: [],
      },
      backstory: {},
      currency: {
        platinum: 0,
        gold: 0,
        electrum: 0,
        silver: 0,
        copper: 0,
      },
    };
    this.is_public = false;
    this.view_count = 0;
    this.created_at = new Date();
    this.updated_at = new Date();
  }
}

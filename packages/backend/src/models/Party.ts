import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { User } from './User.js';
import { Character } from './Character.js';

@Entity('parties')
export class Party {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  owner_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner?: User;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  campaign_name?: string;

  @ManyToMany(() => Character)
  @JoinTable({
    name: 'party_members',
    joinColumn: { name: 'party_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'character_id', referencedColumnName: 'id' },
  })
  members!: Character[];

  @Column({ type: 'boolean', default: false })
  is_public: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'int', default: 0 })
  shared_gold: number;

  @Column({ type: 'json', nullable: true })
  shared_inventory?: { name: string; quantity: number; description?: string }[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  constructor(id?: string, owner_id?: string, name?: string) {
    this.id = id || '';
    this.owner_id = owner_id || '';
    this.name = name || '';
    // Don't initialize members array - TypeORM requirement
    this.is_public = false;
    this.shared_gold = 0;
    this.shared_inventory = [];
    this.created_at = new Date();
    this.updated_at = new Date();
  }
}

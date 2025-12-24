import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'varchar', length: 255 })
  display_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  constructor(id?: string, email?: string, password_hash?: string, display_name?: string) {
    this.id = id || '';
    this.email = email || '';
    this.password_hash = password_hash || '';
    this.display_name = display_name || '';
    this.created_at = new Date();
    this.updated_at = new Date();
  }
}

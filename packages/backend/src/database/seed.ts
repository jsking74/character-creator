import 'reflect-metadata';
import { AppDataSource } from './data-source.js';
import { User } from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);

    // Check if test user already exists
    const existingUser = await userRepository.findOne({
      where: { email: 'test@example.com' },
    });

    if (existingUser) {
      console.log('Test user already exists, skipping seed');
      return;
    }

    // Create test user
    const testUser = new User();
    testUser.id = uuidv4();
    testUser.email = 'test@example.com';
    testUser.password_hash = await hashPassword('password123');
    testUser.display_name = 'Test User';

    await userRepository.save(testUser);

    console.log('✓ Database seeded successfully');
    console.log('  Test user: test@example.com / password123');
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seed();

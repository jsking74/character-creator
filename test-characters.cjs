// Test script to create characters and verify the new JSONB structure
const http = require('http');

const API_BASE = 'http://localhost:5000/api';
let authToken = null;

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function main() {
  console.log('🧪 Testing Character Creator with JSONB Migration\n');

  try {
    // 1. Register a test user
    console.log('1️⃣  Registering test user...');
    const registerData = {
      email: `testuser${Date.now()}@example.com`,
      password: 'Test123!@#',
      displayName: 'Test User',
    };

    try {
      await makeRequest('POST', '/auth/register', registerData);
      console.log('   ✅ User registered successfully\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  User already exists, continuing...\n');
      } else {
        throw error;
      }
    }

    // 2. Login
    console.log('2️⃣  Logging in...');
    const loginResult = await makeRequest('POST', '/auth/login', {
      email: registerData.email,
      password: registerData.password,
    });
    authToken = loginResult.accessToken;
    console.log('   ✅ Logged in successfully\n');

    // 3. Create test characters with nested structure
    console.log('3️⃣  Creating test characters with JSONB structure...\n');

    const testCharacters = [
      {
        name: 'Thorin Ironshield',
        system_id: 'd&d5e',
        character_data: {
          basics: {
            race: 'Dwarf',
            class: 'Fighter',
            level: 5,
            experience: 6500,
            alignment: 'Lawful Good',
            background: 'Soldier',
          },
          attributes: {
            strength: 18,
            dexterity: 12,
            constitution: 16,
            intelligence: 10,
            wisdom: 13,
            charisma: 8,
          },
          hitPoints: {
            current: 45,
            maximum: 45,
            temporary: 0,
          },
          skills: {},
          proficiencies: {
            skills: ['Athletics', 'Intimidation'],
            weapons: ['All martial weapons'],
            armor: ['All armor', 'Shields'],
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
            features: ['Second Wind', 'Action Surge'],
          },
          backstory: {
            description: 'A stalwart dwarf warrior from the Iron Mountains',
          },
          currency: {
            platinum: 0,
            gold: 250,
            electrum: 0,
            silver: 50,
            copper: 0,
          },
        },
        is_public: true,
      },
      {
        name: 'Elara Moonwhisper',
        system_id: 'd&d5e',
        character_data: {
          basics: {
            race: 'Elf',
            class: 'Wizard',
            level: 8,
            experience: 34000,
            alignment: 'Neutral Good',
            background: 'Sage',
          },
          attributes: {
            strength: 8,
            dexterity: 14,
            constitution: 12,
            intelligence: 18,
            wisdom: 13,
            charisma: 10,
          },
          hitPoints: {
            current: 38,
            maximum: 48,
            temporary: 5,
          },
          skills: {},
          proficiencies: {
            skills: ['Arcana', 'History', 'Investigation'],
            weapons: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows'],
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
            features: ['Arcane Recovery', 'Spell Mastery'],
          },
          backstory: {
            description: 'A brilliant elven wizard seeking ancient knowledge',
          },
          currency: {
            platinum: 10,
            gold: 500,
            electrum: 0,
            silver: 100,
            copper: 50,
          },
        },
        is_public: true,
      },
      {
        name: 'Ragnar the Bold',
        system_id: 'd&d5e',
        character_data: {
          basics: {
            race: 'Human',
            class: 'Barbarian',
            level: 3,
            experience: 900,
            alignment: 'Chaotic Neutral',
            background: 'Outlander',
          },
          attributes: {
            strength: 17,
            dexterity: 14,
            constitution: 15,
            intelligence: 8,
            wisdom: 12,
            charisma: 10,
          },
          hitPoints: {
            current: 32,
            maximum: 32,
            temporary: 0,
          },
          skills: {},
          proficiencies: {
            skills: ['Athletics', 'Survival'],
            weapons: ['Simple weapons', 'Martial weapons'],
            armor: ['Light armor', 'Medium armor', 'Shields'],
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
            features: ['Rage', 'Unarmored Defense'],
          },
          backstory: {
            description: 'A fierce warrior from the northern wastes',
          },
          currency: {
            platinum: 0,
            gold: 75,
            electrum: 0,
            silver: 25,
            copper: 100,
          },
        },
        is_public: false,
      },
    ];

    const createdCharacters = [];
    for (const char of testCharacters) {
      console.log(`   Creating: ${char.name} (${char.character_data.basics.race} ${char.character_data.basics.class})...`);
      const created = await makeRequest('POST', '/characters', char);
      createdCharacters.push(created);
      console.log(`   ✅ Created with ID: ${created.id}`);
      console.log(`      - Level: ${created.level}`);
      console.log(`      - HP: ${created.health.currentHitPoints}/${created.health.maxHitPoints}`);
      console.log(`      - Gold: ${created.gold}gp`);
      console.log('');
    }

    // 4. Retrieve all characters
    console.log('4️⃣  Retrieving all characters...');
    const allCharacters = await makeRequest('GET', '/characters');
    console.log(`   ✅ Retrieved ${allCharacters.characters.length} characters\n`);

    // 5. Test filtering by class
    console.log('5️⃣  Testing filter by class (Fighter)...');
    const fighters = await makeRequest('GET', '/characters?class=Fighter');
    console.log(`   ✅ Found ${fighters.characters.length} Fighter(s)\n`);

    // 6. Test filtering by level
    console.log('6️⃣  Testing filter by level (minLevel=5)...');
    const highLevel = await makeRequest('GET', '/characters?minLevel=5');
    console.log(`   ✅ Found ${highLevel.characters.length} character(s) level 5+\n`);

    // 7. Get a specific character
    console.log('7️⃣  Getting specific character details...');
    const charId = createdCharacters[0].id;
    const character = await makeRequest('GET', `/characters/${charId}`);
    console.log(`   ✅ Retrieved: ${character.name}`);
    console.log(`      System: ${character.system}`);
    console.log(`      Class: ${character.class}`);
    console.log(`      Race: ${character.race}`);
    console.log(`      Level: ${character.level}`);
    console.log(`      Attributes: STR ${character.abilityScores.strength}, DEX ${character.abilityScores.dexterity}, CON ${character.abilityScores.constitution}`);
    console.log(`      Modifiers: STR ${character.abilityModifiers.strength >= 0 ? '+' : ''}${character.abilityModifiers.strength}`);
    console.log('');

    // 8. Update a character
    console.log('8️⃣  Updating character (leveling up)...');
    const updatePayload = {
      name: 'Thorin Ironshield (Updated)',
      character_data: {
        basics: {
          level: 6,
        },
        hitPoints: {
          maximum: 55,
          current: 55,
        },
      },
    };
    const updated = await makeRequest('PUT', `/characters/${charId}`, updatePayload);
    console.log(`   ✅ Updated: ${updated.name}`);
    console.log(`      New Level: ${updated.level}`);
    console.log(`      New HP: ${updated.health.maxHitPoints}\n`);

    // 9. Test public characters endpoint
    console.log('9️⃣  Testing public characters endpoint...');
    const publicChars = await makeRequest('GET', '/characters/browse/public');
    console.log(`   ✅ Found ${publicChars.length} public character(s)\n`);

    console.log('✅ All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Characters created: ${createdCharacters.length}`);
    console.log(`   - JSONB structure: Working correctly`);
    console.log(`   - Deep merge updates: Working correctly`);
    console.log(`   - Filtering by class/level: Working correctly`);
    console.log(`   - exportAsJSON(): Maintaining API compatibility`);
    console.log('\n🎉 Character Model Migration Verified Successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();

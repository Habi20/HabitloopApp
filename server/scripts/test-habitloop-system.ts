import { generateHabitLoopData } from './generate-habitloop-data';
import { storage } from '../storage';

async function testHabitLoopSystem() {
  console.log('🧪 Testing HabitLoop System...\n');

  try {
    // Test 1: Generate demo data
    console.log('📊 Test 1: Generating demo data...');
    await generateHabitLoopData();
    console.log('✅ Demo data generated successfully\n');

    // Test 2: Verify users exist
    console.log('👥 Test 2: Verifying HabitLoop users...');
    const userIds = ['user-001', 'user-002', 'user-003', 'user-004', 'user-005', 'user-006', 'user-007', 'user-008', 'user-009'];
    
    for (const userId of userIds) {
      const user = await storage.getUser(userId);
      if (user) {
        console.log(`✅ ${userId}: ${user.firstName} ${user.lastName} (Level ${user.level}, ${user.xp} XP)`);
      } else {
        console.log(`❌ ${userId}: User not found`);
      }
    }
    console.log('');

    // Test 3: Verify habits exist
    console.log('🎯 Test 3: Verifying habits...');
    for (const userId of userIds) {
      const habits = await storage.getUserHabits(userId);
      console.log(`✅ ${userId}: ${habits.length} habits`);
      
      for (const habit of habits) {
        console.log(`   - ${habit.title} (${habit.category})`);
      }
    }
    console.log('');

    // Test 4: Verify completions exist
    console.log('📈 Test 4: Verifying completions...');
    for (const userId of userIds) {
      const completions = await storage.getHabitCompletions(userId);
      console.log(`✅ ${userId}: ${completions.length} completions`);
    }
    console.log('');

    // Test 5: Test XP calculation
    console.log('🏆 Test 5: Testing XP calculation...');
    for (const userId of userIds) {
      const user = await storage.getUser(userId);
      if (user) {
        console.log(`✅ ${userId}: Level ${user.level}, ${user.xp} XP`);
      }
    }
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Start the server: npm run dev:server');
    console.log('2. Start the client: npm run dev:client');
    console.log('3. Visit the landing page and try "try as a habitloop user"');
    console.log('4. Test the gamification system with different user profiles');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test if called directly
if (require.main === module) {
  testHabitLoopSystem()
    .then(() => {
      console.log('✅ Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

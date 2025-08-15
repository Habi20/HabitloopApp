// server/scripts/debug-timezone.ts
import { TimezoneUtils } from '../utils/timezone.js';

console.log('🔍 Debugging Timezone Issues');
console.log('================================');

// Test 1: Current time in different formats
console.log('\n1. Current Time Tests:');
const now = new Date();
console.log('   UTC Time:', now.toISOString());
console.log('   Local Time:', now.toString());
console.log('   Sri Lanka Timezone: Asia/Colombo');

// Test 2: getCurrentSriLankaDate
console.log('\n2. getCurrentSriLankaDate Test:');
const sriLankaDate = TimezoneUtils.getCurrentSriLankaDate();
console.log('   Result:', sriLankaDate.toISOString());
console.log('   Local String:', sriLankaDate.toString());

// Test 3: toLocalDate
console.log('\n3. toLocalDate Test:');
const localDate = TimezoneUtils.toLocalDate(now);
console.log('   Result:', localDate.toISOString());
console.log('   Local String:', localDate.toString());

// Test 4: getCurrentDateString
console.log('\n4. getCurrentDateString Test:');
const dateString = TimezoneUtils.getCurrentDateString();
console.log('   Result:', dateString);

// Test 5: Manual timezone conversion
console.log('\n5. Manual Timezone Conversion:');
const sriLankaTime = now.toLocaleString('en-US', {
  timeZone: 'Asia/Colombo'
});
console.log('   Sri Lanka Time String:', sriLankaTime);
const manualDate = new Date(sriLankaTime);
console.log('   Manual Date ISO:', manualDate.toISOString());

// Test 6: What the database would store
console.log('\n6. Database Storage Test:');
console.log('   What we send to database:', sriLankaDate);
console.log('   What database stores (ISO):', sriLankaDate.toISOString());

// Test 7: NEW getCurrentSriLankaTimestamp
console.log('\n7. NEW getCurrentSriLankaTimestamp Test:');
const newTimestamp = TimezoneUtils.getCurrentSriLankaTimestamp();
console.log('   Result:', newTimestamp.toISOString());
console.log('   Local String:', newTimestamp.toString());
console.log('   Expected: Should show current Sri Lanka time (around 7:18 AM)');

console.log('\n================================');
console.log('Debug Complete');

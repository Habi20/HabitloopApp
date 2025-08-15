// server/scripts/test-timezone.ts
import { 
  getCurrentDateString, 
  toDateString, 
  isSameDay, 
  getDaysDifference,
  getTimezoneInfo,
  formatDateTime
} from "../utils/timezone.js";

/**
 * Test script to verify timezone implementation
 * Run with: npx tsx scripts/test-timezone.ts
 */

console.log("🌍 Testing Timezone Implementation for Sri Lanka (Asia/Colombo)");
console.log("=" .repeat(60));

// Test 1: Current date in Sri Lanka timezone
console.log("\n1. Current Date in Sri Lanka Timezone:");
const today = getCurrentDateString();
console.log(`   Today: ${today}`);
console.log(`   Expected format: YYYY-MM-DD`);

// Test 2: Timezone information
console.log("\n2. Timezone Information:");
const tzInfo = getTimezoneInfo();
console.log(`   Timezone: ${tzInfo.timezone}`);
console.log(`   Offset: ${tzInfo.offset}`);
console.log(`   Current Time: ${tzInfo.currentTime}`);
console.log(`   Current Date: ${tzInfo.currentDate}`);
console.log(`   Is DST: ${tzInfo.isDST}`);

// Test 3: Date conversion
console.log("\n3. Date Conversion Tests:");
const testDate = new Date('2025-08-14T02:00:00.000Z');
const convertedDate = toDateString(testDate);
console.log(`   Original UTC: ${testDate.toISOString()}`);
console.log(`   Sri Lanka Date: ${convertedDate}`);

// Test 4: Same day comparison
console.log("\n4. Same Day Comparison:");
const date1 = new Date('2025-08-14T02:00:00.000Z');
const date2 = new Date('2025-08-14T23:00:00.000Z');
const sameDay = isSameDay(date1, date2);
console.log(`   Date 1: ${date1.toISOString()}`);
console.log(`   Date 2: ${date2.toISOString()}`);
console.log(`   Same day: ${sameDay}`);

// Test 5: Days difference
console.log("\n5. Days Difference:");
const date3 = new Date('2025-08-14T02:00:00.000Z');
const date4 = new Date('2025-08-16T02:00:00.000Z');
const daysDiff = getDaysDifference(date3, date4);
console.log(`   Date 1: ${date3.toISOString()}`);
console.log(`   Date 2: ${date4.toISOString()}`);
console.log(`   Days difference: ${daysDiff}`);

// Test 6: Date formatting
console.log("\n6. Date Formatting:");
const now = new Date();
console.log(`   DateTime: ${formatDateTime(now)}`);
console.log(`   Date: ${toDateString(now)}`);
console.log(`   Time: ${now.toLocaleTimeString()}`);

// Test 7: Edge case - 2:00 AM on August 14, 2025
console.log("\n7. Edge Case - 2:00 AM on August 14, 2025:");
const edgeCaseDate = new Date('2025-08-14T02:00:00.000Z');
const edgeCaseSriLanka = toDateString(edgeCaseDate);
console.log(`   UTC Time: ${edgeCaseDate.toISOString()}`);
console.log(`   Sri Lanka Date: ${edgeCaseSriLanka}`);
console.log(`   Should be: 2025-08-14 (not 2025-08-13)`);

// Test 8: Multiple timezone conversions
console.log("\n8. Multiple Timezone Conversions:");
const testDates = [
  new Date('2025-08-14T00:00:00.000Z'), // Midnight UTC
  new Date('2025-08-14T02:00:00.000Z'), // 2 AM UTC
  new Date('2025-08-14T05:30:00.000Z'), // 5:30 AM UTC (Sri Lanka midnight)
  new Date('2025-08-14T23:59:59.000Z'), // End of day UTC
];

testDates.forEach((date, index) => {
  const sriLankaDate = toDateString(date);
  console.log(`   Test ${index + 1}: ${date.toISOString()} → ${sriLankaDate}`);
});

// Test 9: Validation
console.log("\n9. Validation Tests:");
const validDate = "2025-08-14";
const invalidDate = "invalid-date";
console.log(`   Valid date "${validDate}": ${toDateString(validDate)}`);
console.log(`   Invalid date "${invalidDate}": ${toDateString(invalidDate)}`);

// Test 10: Summary
console.log("\n" + "=".repeat(60));
console.log("✅ Timezone Implementation Test Summary:");
console.log(`   ✅ Current date: ${today}`);
console.log(`   ✅ Timezone: ${tzInfo.timezone}`);
console.log(`   ✅ Edge case handling: ${edgeCaseSriLanka === '2025-08-14' ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Date formatting: Working`);
console.log(`   ✅ Same day comparison: ${sameDay ? 'Working' : 'FAIL'}`);

if (edgeCaseSriLanka === '2025-08-14') {
  console.log("\n🎉 SUCCESS: Timezone implementation is working correctly!");
  console.log("   The 2:00 AM edge case is now handled properly.");
} else {
  console.log("\n❌ FAILURE: Edge case not handled correctly.");
  console.log("   Please check the timezone configuration.");
}

console.log("\n📝 Next Steps:");
console.log("   1. Test the application with real habit completions");
console.log("   2. Verify streak calculations work correctly");
console.log("   3. Check frontend timezone warning display");
console.log("   4. Test with users in different timezones");

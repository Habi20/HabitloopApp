
#!/bin/bash

# HabitLoop Test Suite Runner
echo "🧪 Starting HabitLoop Test Suite"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run tests and check results
run_test_suite() {
  local test_name=$1
  local test_command=$2

  echo -e "\n${YELLOW}Running $test_name...${NC}"
  if eval $test_command; then
    echo -e "${GREEN}✅ $test_name passed${NC}"
    return 0
  else
    echo -e "${RED}❌ $test_name failed${NC}"
    return 1
  fi
}

# Initialize counters
total_tests=0
passed_tests=0

# Run unit tests
((total_tests++))
if run_test_suite "Unit Tests" "npm run test:unit"; then
  ((passed_tests++))
fi

# Run integration tests
((total_tests++))
if run_test_suite "Integration Tests" "npm run test:integration"; then
  ((passed_tests++))
fi

# Run edge case tests
((total_tests++))
if run_test_suite "Edge Case Tests" "npm run test:edge-cases"; then
  ((passed_tests++))
fi

# Run ML tests
((total_tests++))
if run_test_suite "ML Model Tests" "npm run test:ml"; then
  ((passed_tests++))
fi

# Run TypeScript checks
((total_tests++))
if run_test_suite "TypeScript Checks" "npm run type-check"; then
  ((passed_tests++))
fi

# Run linting
((total_tests++))
if run_test_suite "Code Linting" "npm run lint"; then
  ((passed_tests++))
fi

# Summary
echo -e "\n================================="
echo -e "📊 Test Summary:"
echo -e "Total test suites: $total_tests"
echo -e "Passed: ${GREEN}$passed_tests${NC}"
echo -e "Failed: ${RED}$((total_tests - passed_tests))${NC}"

if [ $passed_tests -eq $total_tests ]; then
  echo -e "\n${GREEN}🎉 All tests passed! Ready for deployment.${NC}"
  exit 0
else
  echo -e "\n${RED}⚠️  Some tests failed. Please fix before merging.${NC}"
  exit 1
fi

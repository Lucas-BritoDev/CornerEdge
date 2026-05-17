# Implementation Plan

## Phase 1: Exploration Tests (BEFORE Fix)

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Edge Function Timeout and Inconsistent Generation
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Test with concrete failing cases (80-100 fixtures, multiple invocations)
  - Test implementation details from Bug Condition in design:
    - Invoke `generate-daily-analyses` with date containing 80-100 fixtures
    - Measure execution time and verify it exceeds 150 seconds (timeout)
    - Invoke function multiple times for same date and verify inconsistent results (different counts, duplicates)
    - Verify cron job reports "succeeded" but Edge Function returns HTTP 546
  - The test assertions should match the Expected Behavior Properties from design:
    - ASSERT executionTime < 150_000 ms
    - ASSERT httpStatus == 200
    - ASSERT multiplesGenerated == 10
    - ASSERT premiumCount == 6 AND freeCount == 4
    - ASSERT NOT hasDuplicateMultiples(result)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause:
    - Execution time exceeding 150s
    - Inconsistent multiple counts (8, 12, 17 instead of 10)
    - Duplicate multiples with same fixtures
    - Cron job success but Edge Function failure
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

- [~] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Selection Logic and Data Structure
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs:
    - Run function with low volume of fixtures (10-20)
    - Observe selection logic: premium games have matchScore >= 6
    - Observe data structure: `games` field is JSONB with specific schema
    - Observe odds calculation: `combined_odd` = product of individual odds
    - Observe confidence calculation: `combined_confidence` = average of individual confidences
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - FOR ALL multiples generated, premium games MUST have matchScore >= 6
    - FOR ALL multiples generated, `games` field structure MUST match original schema
    - FOR ALL multiples generated, `combined_odd` MUST equal product of individual odds
    - FOR ALL multiples generated, `combined_confidence` MUST equal average of individual confidences
    - FOR ALL multiples generated, alternation between "over" and "under" strategies MUST be preserved
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15_

## Phase 2: Infrastructure Setup

- [ ] 3. Create database tables for logging, cache, and retry queue

  - [~] 3.1 Create migration file `add_retry_and_logging.sql`
    - Create `edge_function_logs` table with fields: id, function_name, execution_time_ms, status, error_message, metadata, created_at
    - Add index on (function_name, status, created_at DESC)
    - Create `team_statistics_cache` table with fields: team_id, team_name, statistics, cached_at, expires_at
    - Add index on expires_at for cleanup
    - Create `generation_retry_queue` table with fields: id, target_date, attempt_number, last_error, status, created_at, next_retry_at
    - Add index on (status, next_retry_at) for efficient retry processing
    - Add `generation_metadata` JSONB column to `corner_analyses` table
    - Add GIN index on generation_metadata for efficient queries
    - _Requirements: 2.9, 2.10, 2.11_

  - [~] 3.2 Apply migration to database
    - Run migration using Supabase CLI or Dashboard
    - Verify all tables and indexes were created successfully
    - Test insert/select operations on new tables
    - _Requirements: 2.9, 2.10, 2.11_

## Phase 3: Shared Utilities

- [ ] 4. Create shared utility modules

  - [~] 4.1 Create `_shared/batch-processor.ts`
    - Implement `processBatch<T, R>()` function with parameters:
      - items: T[] - array of items to process
      - processor: (item: T) => Promise<R> - async function to process each item
      - options: { batchSize, maxConcurrent, delayMs, timeoutMs }
    - Implement batch division logic (split items into chunks of batchSize)
    - Implement parallel processing with concurrency limit (maxConcurrent)
    - Implement delay between batches (delayMs)
    - Implement timeout check (interrupt if timeoutMs exceeded)
    - Return array of results
    - Add unit tests for different batch sizes and concurrency levels
    - _Requirements: 2.1, 2.2_

  - [~] 4.2 Create `_shared/cache.ts`
    - Implement `TeamStatsCache` class with methods:
      - `get(teamId: number): Promise<any | null>` - retrieve from cache
      - `set(teamId: number, stats: any, ttlHours: number): Promise<void>` - store in cache
      - `clear(): Promise<void>` - clear expired entries
    - Implement database queries to `team_statistics_cache` table
    - Implement TTL expiration logic (check expires_at)
    - Add unit tests for get/set/clear operations
    - _Requirements: 2.1, 2.2_

  - [~] 4.3 Create `_shared/logger.ts`
    - Implement `EdgeFunctionLogger` class with methods:
      - `logStart(metadata?: any): Promise<string>` - log function start, return log_id
      - `logProgress(logId: string, message: string, metadata?: any): Promise<void>` - log progress
      - `logComplete(logId: string, metadata?: any): Promise<void>` - log completion
      - `logError(logId: string, error: Error, metadata?: any): Promise<void>` - log error
    - Implement database inserts to `edge_function_logs` table
    - Implement structured metadata serialization (JSON)
    - Add unit tests for all logging methods
    - _Requirements: 2.10, 2.11_

## Phase 4: Edge Function Refactoring

- [ ] 5. Refactor `generate-daily-analyses` Edge Function

  - [~] 5.1 Add execution time limit and batch processing
    - Add constant `MAX_EXECUTION_TIME = 140_000` (140 seconds)
    - Add function `checkTimeRemaining(startTime)` to calculate remaining time
    - Modify main loop to process fixtures in batches of 20 using `processBatch()`
    - Add early termination if remaining time < 30 seconds
    - Add logging at start, progress (per batch), and completion
    - _Bug_Condition: isBugCondition(input) where input.executionTime > 150_000_
    - _Expected_Behavior: executionTime < 150_000 AND httpStatus == 200_
    - _Preservation: Maintain selection logic (matchScore, lineEdge, confidence)_
    - _Requirements: 2.1, 2.3_

  - [~] 5.2 Parallelize API calls and implement caching
    - Use `Promise.all()` to fetch team statistics in parallel (max 5 concurrent)
    - Integrate `TeamStatsCache` to check cache before API calls
    - Store fetched statistics in cache with 24h TTL
    - Reduce `last=15` to `last=5` in `analyzeTeamCorners()` for performance
    - Skip odds API call if fixture already has cached odds
    - _Bug_Condition: isBugCondition(input) where input.executionTime > 150_000_
    - _Expected_Behavior: executionTime < 150_000 with cached data_
    - _Preservation: Maintain API integration (API-Sports, headers, filters)_
    - _Requirements: 2.1, 3.8, 3.9, 3.10_

  - [~] 5.3 Make multiple generation deterministic
    - Remove `Math.random()` from `buildCornerMultiples()` function
    - Sort candidates by fixed criteria: matchScore DESC, confidence DESC, fixture_id ASC
    - Implement deterministic selection algorithm (no randomness)
    - Add validation to ensure no duplicate fixture sets before insertion
    - Add unit tests to verify determinism (same input → same output)
    - _Bug_Condition: isBugCondition(input) where hasDuplicateMultiples(result)_
    - _Expected_Behavior: NOT hasDuplicateMultiples(result)_
    - _Preservation: Maintain alternation between "over" and "under" strategies_
    - _Requirements: 2.4, 2.7, 3.7_

  - [~] 5.4 Add success validation and metadata
    - After database insertion, count multiples created for target date
    - Verify count == 10 (6 premium + 4 free)
    - Verify each premium has exactly 3 games
    - Verify each free has exactly 2 games
    - If validation fails, log error and return HTTP 500
    - Add `generation_metadata` JSONB field with: timestamp, version, execution_time_ms, batch_count
    - _Bug_Condition: isBugCondition(input) where input.multiplesGenerated != 10_
    - _Expected_Behavior: multiplesGenerated == 10 AND premiumCount == 6 AND freeCount == 4_
    - _Preservation: Maintain data structure (games JSONB schema)_
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.9, 3.1_

- [ ] 6. Refactor `update-results` Edge Function

  - [~] 6.1 Add batch processing and time limit
    - Add constant `MAX_EXECUTION_TIME = 140_000`
    - Process pending analyses in batches of 10 using `processBatch()`
    - Add early termination if remaining time < 30 seconds
    - Add logging at start, progress, and completion
    - _Bug_Condition: isBugCondition(input) where input.executionTime > 150_000_
    - _Expected_Behavior: executionTime < 150_000 AND httpStatus == 200_
    - _Preservation: Maintain result update logic (actual_corners, result status)_
    - _Requirements: 2.2, 3.11, 3.12_

  - [~] 6.2 Optimize API calls and add validation
    - Parallelize fixture and statistics fetching (max 5 concurrent)
    - Implement cache for already processed results
    - Reduce delay between calls from 200ms to 100ms
    - Count analyses updated vs expected
    - Return HTTP 500 if failure rate > 20%
    - Log discrepancies in `edge_function_logs`
    - _Bug_Condition: isBugCondition(input) where input.executionTime > 150_000_
    - _Expected_Behavior: executionTime < 150_000 with optimized calls_
    - _Preservation: Maintain result calculation logic_
    - _Requirements: 2.2, 3.11, 3.12_

## Phase 5: Retry Mechanism

- [ ] 7. Create `retry-failed-generations` Edge Function

  - [~] 7.1 Implement retry logic
    - Query `generation_retry_queue` for entries with status='pending' AND next_retry_at <= NOW()
    - For each entry, invoke `generate-daily-analyses` with target_date parameter
    - Measure execution time and capture result
    - _Requirements: 2.10_

  - [~] 7.2 Implement success validation and queue management
    - After invocation, count multiples in database for target_date
    - Validate count == 10, premiumCount == 6, freeCount == 4
    - Validate no duplicate fixture sets
    - If success, update queue entry status to 'completed'
    - If failure and attempt_number < 3:
      - Increment attempt_number
      - Calculate next_retry_at with exponential backoff (5min, 15min, 30min)
      - Update queue entry with new retry time and last_error
    - If failure and attempt_number >= 3:
      - Update queue entry status to 'failed'
      - Log critical error in `edge_function_logs`
      - TODO: Send alert notification to administrators
    - _Requirements: 2.10, 2.11_

  - [~] 7.3 Add logging and error handling
    - Log retry attempts with metadata (attempt_number, target_date, error)
    - Log successful retries with execution time
    - Log failed retries after max attempts
    - Handle edge cases (missing queue entries, database errors)
    - _Requirements: 2.10, 2.11_

## Phase 6: Cron Job Configuration

- [ ] 8. Update cron job schedules

  - [~] 8.1 Fix generation cron job timezone
    - Access Supabase Dashboard → Edge Functions → Cron Jobs
    - Locate `corneredge-generate-analyses` cron job
    - Update schedule from `0 9 * * *` (09:00 UTC = 06:00 BRT) to `0 3 * * *` (03:00 UTC = 00:00 BRT)
    - Save and verify next scheduled execution time
    - Document change in migration notes
    - _Bug_Condition: isBugCondition(input) where cronJobSchedule == "0 9 * * *"_
    - _Expected_Behavior: cronJobSchedule == "0 3 * * *" (00:00 BRT)_
    - _Requirements: 1.9, 2.12_

  - [~] 8.2 Fix update results cron job schedule
    - Locate `corneredge-update-results` cron job
    - Update schedule from `0 */3 * * *` (every 3 hours, 24/7) to `0 6,9,12,15,18,21 * * *` (specific hours during game period)
    - This corresponds to 03:00, 06:00, 09:00, 12:00, 15:00, 18:00 BRT
    - Save and verify next scheduled execution times
    - Document change in migration notes
    - _Bug_Condition: isBugCondition(input) where cronJobSchedule == "0 */3 * * *"_
    - _Expected_Behavior: cronJobSchedule == "0 6,9,12,15,18,21 * * *" (game period only)_
    - _Requirements: 1.10, 2.13_

  - [~] 8.3 Add retry cron job
    - Create new cron job `corneredge-retry-failed-generations`
    - Set schedule to `*/10 * * * *` (every 10 minutes)
    - Link to `retry-failed-generations` Edge Function
    - Enable and verify first execution
    - Document in migration notes
    - _Requirements: 2.10_

## Phase 7: Validation Tests (AFTER Fix)

- [ ] 9. Fix for Edge Function timeout and inconsistent generation

  - [~] 9.1 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Edge Functions Complete Without Timeout
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify all assertions pass:
      - executionTime < 150_000 ms
      - httpStatus == 200
      - multiplesGenerated == 10
      - premiumCount == 6 AND freeCount == 4
      - NOT hasDuplicateMultiples(result)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [~] 9.2 Verify preservation tests still pass
    - **Property 2: Preservation** - Selection Logic and Data Structure
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Verify all preservation properties:
      - Premium games have matchScore >= 6
      - Data structure matches original schema
      - Odds calculation preserved (product of individual odds)
      - Confidence calculation preserved (average of individual confidences)
      - Strategy alternation preserved
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15_

## Phase 8: Integration Testing

- [ ] 10. Integration and end-to-end tests

  - [~] 10.1 Test complete generation flow
    - Trigger `corneredge-generate-analyses` cron job manually
    - Verify Edge Function completes in < 140 seconds
    - Verify exactly 10 multiples created in database
    - Verify 6 premium (3 games each) and 4 free (2 games each)
    - Verify no duplicates
    - Verify `generation_metadata` populated correctly
    - Verify logs in `edge_function_logs` table
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [~] 10.2 Test retry flow
    - Simulate failure by temporarily disabling API or database
    - Verify entry created in `generation_retry_queue`
    - Wait for retry cron job to execute (10 minutes)
    - Verify retry attempt incremented
    - Verify next_retry_at calculated with backoff
    - Re-enable API/database and wait for next retry
    - Verify successful retry and queue entry marked 'completed'
    - _Requirements: 2.10, 2.11_

  - [~] 10.3 Test update results flow
    - Generate multiples for a date with completed games
    - Trigger `corneredge-update-results` cron job
    - Verify Edge Function completes in < 140 seconds
    - Verify `actual_corners` and `result` fields updated
    - Verify multiple status updated (correct/incorrect/void)
    - Verify logs in `edge_function_logs`
    - _Requirements: 2.2, 3.11, 3.12_

  - [~] 10.4 Test cron job schedules
    - Verify `corneredge-generate-analyses` scheduled for 03:00 UTC (00:00 BRT)
    - Verify `corneredge-update-results` scheduled for 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 UTC
    - Verify `corneredge-retry-failed-generations` scheduled every 10 minutes
    - Monitor first automatic execution of each cron job
    - Verify logs show correct execution times
    - _Requirements: 2.12, 2.13_

- [~] 11. Checkpoint - Ensure all tests pass
  - Run all unit tests for shared utilities (batch-processor, cache, logger)
  - Run all property-based tests for preservation checking
  - Run all integration tests for complete flows
  - Verify no regressions in existing functionality
  - Verify all requirements validated (2.1-2.13, 3.1-3.15)
  - Document any issues or edge cases discovered
  - If any tests fail, investigate root cause and fix before proceeding
  - Ask the user if questions arise or if manual verification is needed

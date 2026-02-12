# Test Database Schema

**Location**: `userData/test-database.json`  
**Service**: `electron/services/test-database-service.ts`

## Overview

Centralized JSON database that stores all test metadata, eliminating the complexity of hierarchical folder structures.

## File Structure

```json
{
  "tests": [
    {
      "id": "uuid-1234-5678-90ab-cdef",
      "createdAt": "2026-02-12T11:23:52.000Z",
      "updatedAt": "2026-02-12T14:30:00.000Z",
      "status": "in-progress",
      
      "headerData": {
        "testName": "approved",
        "system": "hom-0001",
        "testCycle": "tsgol-0003",
        "testCase": "tsgol-00003",
        "testType": "card",
        "testTypeValue": "cdsust-0003"
      },
      
      "folderPath": "/Users/user/evidencias/test-uuid-1234-5678-90ab-cdef",
      "screenshots": [
        {
          "filename": "screenshot-001.png",
          "capturedAt": "2026-02-12T11:25:00.000Z",
          "edited": false
        },
        {
          "filename": "screenshot-002.png",
          "capturedAt": "2026-02-12T11:26:30.000Z",
          "edited": true
        }
      ],
      
      "notes": "Teste realizado com sucesso. Backend respondeu em 200ms.",
      
      "pdfGenerated": true,
      "pdfPath": "/Users/user/evidencias/test-uuid-1234/evidencia-qa.pdf"
    }
  ],
  
  "settings": {
    "autoDeleteAfterDays": 90,
    "lastCleanup": "2026-02-01T00:00:00.000Z"
  }
}
```

## Fields Explanation

### TestRecord

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | UUID v4 generated on test creation |
| `createdAt` | string | ✅ | ISO 8601 timestamp of test creation |
| `updatedAt` | string | ✅ | ISO 8601 timestamp of last update |
| `status` | enum | ✅ | `in-progress` or `completed` |
| `headerData` | object | ✅ | Test metadata (see below) |
| `folderPath` | string | ✅ | Absolute path to test folder |
| `screenshots` | array | ✅ | Array of screenshot metadata |
| `notes` | string | ✅ | User notes (can be empty) |
| `pdfGenerated` | boolean | ✅ | Whether PDF was generated |
| `pdfPath` | string | ❌ | Path to generated PDF (optional) |

### HeaderData

| Field | Type | Required (Save) | Required (PDF) | Description |
|-------|------|----------------|----------------|-------------|
| `testName` | string | ❌ | ✅ | Test result (approved, reproved, partial) |
| `system` | string | ✅ | ✅ | System under test (e.g., "hom-0001") |
| `testCycle` | string | ✅ | ✅ | Test cycle ID (e.g., "tsgol-0003") |
| `testCase` | string | ✅ | ✅ | Test case ID (e.g., "tsgol-00003") |
| `testType` | enum | ✅ | ✅ | One of: `card`, `regressivo`, `gmud`, `outro` |
| `testTypeValue` | string | ✅ | ✅ | Value for testType (e.g., "cdsust-0003") |

### ScreenshotData

| Field | Type | Description |
|-------|------|-------------|
| `filename` | string | Screenshot filename (e.g., "screenshot-001.png") |
| `capturedAt` | string | ISO 8601 timestamp of capture |
| `edited` | boolean | Whether screenshot was edited in editor |

### Settings

| Field | Type | Description |
|-------|------|-------------|
| `autoDeleteAfterDays` | number | Days before auto-deleting completed tests (default: 90) |
| `lastCleanup` | string | ISO 8601 timestamp of last cleanup run |

## Status Flow

```
CREATE TEST
    ↓
status: "in-progress"
    ↓
USER SAVES TEST (fills headers + generates PDF)
    ↓
status: "completed"
    ↓
AFTER X DAYS (autoDeleteAfterDays)
    ↓
AUTO-DELETE (cleanup job)
```

## Folder Structure

**Old System (DEPRECATED):**
```
/evidencias/
  └── 02-2026/
      └── cdsust-0003/
          └── tsgol-0003/
              └── tsgol-00003/
                  ├── screenshot-001.png
                  └── .qabooster-config.json
```

**New System (ACTIVE):**
```
/evidencias/
  ├── test-uuid-1234-5678-90ab-cdef/
  │   ├── screenshot-001.png
  │   ├── screenshot-002.png
  │   └── evidencia-qa.pdf
  ├── test-uuid-abcd-efgh-ijkl-mnop/
  │   ├── screenshot-001.png
  │   └── screenshot-002.png
  └── test-uuid-qrst-uvwx-yz12-3456/
      └── screenshot-001.png
```

**Benefits:**
- ✅ Flat structure (no nesting)
- ✅ Unique folder per test (UUID)
- ✅ No rename issues
- ✅ Fast search (database query, no filesystem walk)
- ✅ Easy cleanup (delete folder + database entry)

## Validation Rules

### For Saving Test (`validateForSave`)
- ✅ `system` required
- ✅ `testCycle` required
- ✅ `testCase` required
- ✅ `testType` required
- ✅ `testTypeValue` required
- ❌ `testName` OPTIONAL

### For Generating PDF (`validateForPDF`)
- ✅ ALL fields from `validateForSave`
- ✅ `testName` REQUIRED

## API Functions

### CRUD Operations

```typescript
// Create new test
const test = createTest(rootFolder, headerData);

// Get test by ID
const test = getTest(testId);

// Get all tests (sorted by updatedAt desc)
const tests = getAllTests();

// Update test
const success = updateTest(testId, { status: TestStatus.COMPLETED });

// Delete test (removes folder + database entry)
const success = deleteTest(testId);

// Search/filter tests
const results = searchTests({
  system: 'hom-0001',
  testType: 'card',
  startDate: '2026-01-01T00:00:00Z'
});
```

### Screenshot Management

```typescript
// Add screenshot to test
addScreenshot(testId, 'screenshot-001.png', false);

// Mark screenshot as edited
updateScreenshot(testId, 'screenshot-001.png', { edited: true });
```

### Validation

```typescript
// Validate for save (testResult optional)
const validation = validateForSave(headerData);
if (!validation.isValid) {
  console.error('Missing fields:', validation.missingFields);
}

// Validate for PDF (testResult required)
const validation = validateForPDF(headerData);
if (!validation.isValid) {
  console.error('Cannot generate PDF. Missing:', validation.missingFields);
}
```

### Cleanup

```typescript
// Delete old completed tests
const result = cleanupOldTests();
console.log(`Deleted ${result.deletedCount} tests`);
```

## Migration from Old System

Old tests using `.qabooster-config.json` can be:
1. **Migrated**: Script reads old structure, creates database entries
2. **Supported**: Fallback reads `.qabooster-config.json` if not in database
3. **Ignored**: Users start fresh with new system

**Recommendation**: Option 2 (backwards compatible)

## Example Usage

```typescript
import {
  createTest,
  getAllTests,
  updateTest,
  validateForPDF,
  TestStatus
} from './services/test-database-service';

// 1. Start new test
const test = createTest('/Users/user/evidencias');
console.log('Test ID:', test.id);
console.log('Folder:', test.folderPath);

// 2. User fills headers
test.headerData.system = 'hom-0001';
test.headerData.testCycle = 'tsgol-0003';
test.headerData.testCase = 'tsgol-00003';
test.headerData.testType = 'card';
test.headerData.testTypeValue = 'cdsust-0003';

// 3. Validate before PDF
const validation = validateForPDF(test.headerData);
if (!validation.isValid) {
  alert('Preencha: ' + validation.missingFields.join(', '));
  return;
}

// 4. Generate PDF and mark complete
updateTest(test.id, {
  status: TestStatus.COMPLETED,
  pdfGenerated: true,
  pdfPath: path.join(test.folderPath, 'evidencia-qa.pdf')
});

// 5. List all tests
const allTests = getAllTests();
console.log('Total tests:', allTests.length);
```

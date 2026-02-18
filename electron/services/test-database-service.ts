/**
 * Cria um banco de dados vazio
 */
function createEmptyDatabase(): TestDatabase {
	return {
		tests: [],
		settings: {
			autoDeleteAfterDays: 90,
			lastCleanup: new Date().toISOString(),
		},
	};
}
/**
 * Test Database Service
 *
 * Manages centralized test database for QA Booster
 * Eliminates folder structure complexity by storing all test metadata in a single JSON file
 *
 * Database Location: userData/test-database.json
 * Folder Structure: rootFolder/test-{uuid}/ (flat, no hierarchy)
 *
 * Features:
 * - CRUD operations for tests
 * - Search/filter tests
 * - Automatic cleanup of old tests
 * - Validation (separate for Save vs PDF)
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
	HeaderData,
	ScreenshotData,
	TestDatabase,
	TestRecord,
	TestSearchQuery,
	TestStatus,
	TestValidation,
} from '../interfaces/test-database';

const DATABASE_FILENAME = 'test-database.json';

/**
 * Get path to database file
 */
function getDatabasePath(): string {
	return path.join(app.getPath('userData'), DATABASE_FILENAME);
}

/**
 * Load database from disk (or create if doesn't exist)
 */
export function loadDatabase(): TestDatabase {
	const dbPath = getDatabasePath();

	if (!fs.existsSync(dbPath)) {
		console.log('[DB] Creating new database at:', dbPath);
		const emptyDb = createEmptyDatabase();
		saveDatabase(emptyDb);
		return emptyDb;
	}

	try {
		const data = fs.readFileSync(dbPath, 'utf-8');
		return JSON.parse(data) as TestDatabase;
	} catch (error) {
		console.error('[DB] ❌ Failed to load database, creating new:', error);
		const emptyDb = createEmptyDatabase();
		saveDatabase(emptyDb);
		return emptyDb;
	}
}

/**
 * Save database to disk
 */
export function saveDatabase(database: TestDatabase): void {
	const dbPath = getDatabasePath();
	try {
		fs.writeFileSync(dbPath, JSON.stringify(database, null, 2), 'utf-8');
		console.log('[DB] ✅ Database saved:', dbPath);
	} catch (error) {
		console.error('[DB] ❌ Failed to save database:', error);
		throw error;
	}
}

// ====================================================================
// VALIDATION
// ====================================================================

/**
 * Validate header data for SAVING test
 * testResult (testName) is OPTIONAL
 */
export function validateForSave(headerData: HeaderData): TestValidation {
	const missingFields: string[] = [];

	if (!headerData.system) missingFields.push('system');
	if (!headerData.testCycle) missingFields.push('testCycle');
	if (!headerData.testCase) missingFields.push('testCase');
	if (!headerData.testType) missingFields.push('testType');
	if (!headerData.testTypeValue) missingFields.push('testTypeValue');

	return {
		isValid: missingFields.length === 0,
		missingFields,
	};
}

/**
 * Validate header data for generating PDF
 * testResult (testName) is REQUIRED
 */
export function validateForPDF(headerData: HeaderData): TestValidation {
	const validation = validateForSave(headerData);

	// PDF requires testResult as well
	if (!headerData.testName) {
		validation.missingFields.push('testResult');
		validation.isValid = false;
	}

	return validation;
}

// ====================================================================
// CRUD OPERATIONS
// ====================================================================

/**
 * Create new test record
 * Generates UUID, creates folder, saves to database
 */
export function createTest(
	rootFolder: string,
	headerData?: Partial<HeaderData>,
): TestRecord {
	const database = loadDatabase();
	const testId = uuidv4();
	const now = new Date().toISOString();

	// Generate human-readable folder name: DD-MM-YYYY_HH-MM-SS
	const date = new Date();
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');

	const folderName = `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
	const folderPath = path.join(rootFolder, folderName);

	// Create folder
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath, { recursive: true });
		console.log('[DB] ✅ Created folder:', folderPath);
	}

	// Create test record
	const testRecord: TestRecord = {
		id: testId,
		createdAt: now,
		updatedAt: now,
		status: TestStatus.IN_PROGRESS,
		headerData: {
			testName: headerData?.testName || '',
			system: headerData?.system || '',
			testCycle: headerData?.testCycle || '',
			testCase: headerData?.testCase || '',
			testType: headerData?.testType || '',
			testTypeValue: headerData?.testTypeValue || '',
		},
		folderPath,
		screenshots: [],
		notes: '',
		pdfGenerated: false,
	};

	// Add to database
	database.tests.push(testRecord);
	saveDatabase(database);

	console.log('[DB] ✅ Created test:', testId);
	return testRecord;
}

/**
 * Get test by ID
 */
export function getTest(testId: string): TestRecord | null {
	const database = loadDatabase();
	return database.tests.find((t) => t.id === testId) || null;
}

/**
 * Get all tests
 */
export function getAllTests(): TestRecord[] {
	const database = loadDatabase();
	// Sort by updatedAt descending (most recent first)
	return database.tests.sort(
		(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	);
}

/**
 * Update test record
 */
export function updateTest(
	testId: string,
	updates: Partial<TestRecord>,
): boolean {
	const database = loadDatabase();
	const testIndex = database.tests.findIndex((t) => t.id === testId);

	if (testIndex === -1) {
		console.error('[DB] ❌ Test not found:', testId);
		return false;
	}

	// Merge updates
	database.tests[testIndex] = {
		...database.tests[testIndex],
		...updates,
		updatedAt: new Date().toISOString(),
	};

	saveDatabase(database);
	console.log('[DB] ✅ Updated test:', testId);
	return true;
}

/**
 * Delete test (removes folder and database record)
 */
export function deleteTest(testId: string): boolean {
	const database = loadDatabase();
	const test = database.tests.find((t) => t.id === testId);

	if (!test) {
		console.error('[DB] ❌ Test not found:', testId);
		return false;
	}

	// Delete folder
	if (fs.existsSync(test.folderPath)) {
		try {
			fs.rmSync(test.folderPath, { recursive: true, force: true });
			console.log('[DB] ✅ Deleted folder:', test.folderPath);
		} catch (error) {
			console.error('[DB] ❌ Failed to delete folder:', error);
		}
	}

	// Remove from database
	database.tests = database.tests.filter((t) => t.id !== testId);
	saveDatabase(database);

	console.log('[DB] ✅ Deleted test:', testId);
	return true;
}

/**
 * Search/filter tests
 */
export function searchTests(query: TestSearchQuery): TestRecord[] {
	const database = loadDatabase();
	let results = database.tests;

	// Filter by fields
	if (query.system) {
		results = results.filter((t) =>
			t.headerData.system.toLowerCase().includes(query.system!.toLowerCase()),
		);
	}

	if (query.testType) {
		results = results.filter((t) => t.headerData.testType === query.testType);
	}

	if (query.testTypeValue) {
		results = results.filter((t) =>
			t.headerData.testTypeValue
				.toLowerCase()
				.includes(query.testTypeValue!.toLowerCase()),
		);
	}

	if (query.testCycle) {
		results = results.filter((t) =>
			t.headerData.testCycle
				.toLowerCase()
				.includes(query.testCycle!.toLowerCase()),
		);
	}

	if (query.testCase) {
		results = results.filter((t) =>
			t.headerData.testCase
				.toLowerCase()
				.includes(query.testCase!.toLowerCase()),
		);
	}

	if (query.status) {
		results = results.filter((t) => t.status === query.status);
	}

	// Filter by date range
	if (query.startDate) {
		const startTime = new Date(query.startDate).getTime();
		results = results.filter(
			(t) => new Date(t.createdAt).getTime() >= startTime,
		);
	}

	if (query.endDate) {
		const endTime = new Date(query.endDate).getTime();
		results = results.filter((t) => new Date(t.createdAt).getTime() <= endTime);
	}

	// Sort by updatedAt descending
	return results.sort(
		(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	);
}

// ====================================================================
// SCREENSHOT MANAGEMENT
// ====================================================================

/**
 * Add screenshot to test
 */
export function addScreenshot(
	testId: string,
	filename: string,
	edited: boolean = false,
): boolean {
	const database = loadDatabase();
	const test = database.tests.find((t) => t.id === testId);

	if (!test) {
		console.error('[DB] ❌ Test not found:', testId);
		return false;
	}

	const screenshot: ScreenshotData = {
		filename,
		capturedAt: new Date().toISOString(),
		edited,
	};

	test.screenshots.push(screenshot);
	test.updatedAt = new Date().toISOString();

	saveDatabase(database);
	console.log('[DB] ✅ Added screenshot to test:', testId, filename);
	return true;
}

/**
 * Update screenshot metadata
 */
export function updateScreenshot(
	testId: string,
	filename: string,
	updates: Partial<ScreenshotData>,
): boolean {
	const database = loadDatabase();
	const test = database.tests.find((t) => t.id === testId);

	if (!test) {
		console.error('[DB] ❌ Test not found:', testId);
		return false;
	}

	const screenshotIndex = test.screenshots.findIndex(
		(s) => s.filename === filename,
	);

	if (screenshotIndex === -1) {
		console.error('[DB] ❌ Screenshot not found:', filename);
		return false;
	}

	test.screenshots[screenshotIndex] = {
		...test.screenshots[screenshotIndex],
		...updates,
	};
	test.updatedAt = new Date().toISOString();

	saveDatabase(database);
	console.log('[DB] ✅ Updated screenshot:', filename);
	return true;
}

// ====================================================================
// CLEANUP
/**
 * Delete old tests based on autoDeleteAfterDays setting (any status)
 */
export function cleanupOldTests(): { deletedCount: number; errors: string[] } {
	const database = loadDatabase();

	// If autoDeleteAfterDays is 0 or negative, never delete (disabled)
	if (database.settings.autoDeleteAfterDays <= 0) {
		console.log('[DB] 🔒 Auto-delete disabled (autoDeleteAfterDays = 0)');
		return { deletedCount: 0, errors: [] };
	}

	const cutoffDate = new Date();
	cutoffDate.setDate(
		cutoffDate.getDate() - database.settings.autoDeleteAfterDays,
	);
	const cutoffTime = cutoffDate.getTime();

	console.log(
		`[DB] 🧹 Auto-delete after ${database.settings.autoDeleteAfterDays} days`,
	);
	console.log(`[DB] 📅 Cutoff date: ${cutoffDate.toISOString()}`);
	console.log(`[DB] 📊 Total tests in database: ${database.tests.length}`);

	const oldTests = database.tests.filter(
		(t) => new Date(t.updatedAt).getTime() < cutoffTime,
	);

	console.log(`[DB] 🧹 Found ${oldTests.length} old tests to clean up...`);
	if (oldTests.length > 0) {
		console.log(
			`[DB] 📊 Will keep ${database.tests.length - oldTests.length} recent tests`,
		);
	}

	const errors: string[] = [];
	let deletedCount = 0;

	for (const test of oldTests) {
		try {
			// Log details about test being deleted
			const testDate = new Date(test.updatedAt).toLocaleDateString('pt-BR');
			const daysSinceUpdate = Math.floor(
				(Date.now() - new Date(test.updatedAt).getTime()) /
					(1000 * 60 * 60 * 24),
			);
			console.log(
				`[DB] 🗑️ Deleting test: ${test.id.substring(0, 8)}... (updated ${testDate} - ${daysSinceUpdate} days ago)`,
			);
			console.log(`[DB]    Folder: ${test.folderPath}`);

			const success = deleteTest(test.id);
			if (success) {
				deletedCount++;
				console.log(`[DB] ✅ Deleted successfully`);
			} else {
				console.log(`[DB] ❌ Delete failed`);
			}
		} catch (error) {
			errors.push(`Failed to delete test ${test.id}: ${error}`);
			console.error(`[DB] ❌ Error deleting test ${test.id}:`, error);
		}
	}

	// Update lastCleanup
	// CRITICAL: Reload database after deletions to avoid overwriting with old data
	const updatedDatabase = loadDatabase();
	updatedDatabase.settings.lastCleanup = new Date().toISOString();
	saveDatabase(updatedDatabase);

	console.log(`[DB] ✅ Cleanup complete: ${deletedCount} tests deleted`);
	return { deletedCount, errors };
}

/**
 * Update database settings
 * @param settings - Partial settings object to update
 */
export function updateDatabaseSettings(settings: {
	autoDeleteAfterDays?: number | null;
}): void {
	const database = loadDatabase();

	if (settings.autoDeleteAfterDays !== undefined) {
		// null or 0 means never delete
		database.settings.autoDeleteAfterDays =
			settings.autoDeleteAfterDays === null ||
			settings.autoDeleteAfterDays === 0
				? 0
				: settings.autoDeleteAfterDays;
	}

	saveDatabase(database);
	console.log('[DB] ✅ Settings updated:', database.settings);
}

// ====================================================================
// TEST HELPERS
// ====================================================================

/**
 * Mark a test as old (for testing purposes)
 * Changes the updatedAt date to simulate an old test
 * @param testId - Test UUID
 * @param daysAgo - How many days ago to set the date (default: 100)
 */
export function markTestAsOld(testId: string, daysAgo: number = 100): boolean {
	const database = loadDatabase();
	const test = database.tests.find((t) => t.id === testId);

	if (!test) {
		console.error('[DB] ❌ Test not found:', testId);
		return false;
	}

	// Set updatedAt to X days ago
	const oldDate = new Date();
	oldDate.setDate(oldDate.getDate() - daysAgo);
	test.updatedAt = oldDate.toISOString();

	saveDatabase(database);
	console.log(
		`[DB] ✅ Test ${testId.substring(0, 8)}... marked as ${daysAgo} days old`,
	);
	console.log(`[DB]    New updatedAt: ${test.updatedAt}`);
	return true;
}

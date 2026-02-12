/**
 * Test Database IPC Handlers
 *
 * Exposes test database operations to the renderer process
 */

import { ipcMain } from 'electron';
import type {
    HeaderData,
    ScreenshotData,
    TestRecord,
    TestSearchQuery,
} from '../interfaces/test-database';
import {
    addScreenshot,
    cleanupOldTests,
    createTest,
    deleteTest,
    getAllTests,
    getTest,
    searchTests,
    updateDatabaseSettings,
    updateScreenshot,
    updateTest,
    validateForPDF,
    validateForSave,
} from '../services/test-database-service';

/**
 * Register all test database IPC handlers
 */
export function registerTestDatabaseHandlers(): void {
	console.log('[IPC] Registering test database handlers...');

	// ====================================================================
	// CRUD OPERATIONS
	// ====================================================================

	/**
	 * Create new test
	 * @param rootFolder - Root folder path for test storage
	 * @param headerData - Optional initial header data
	 * @returns TestRecord
	 */
	ipcMain.handle(
		'db-create-test',
		async (
			_,
			rootFolder: string,
			headerData?: Partial<HeaderData>,
		): Promise<TestRecord> => {
			try {
				console.log('[IPC] db-create-test:', { rootFolder, headerData });
				const test = createTest(rootFolder, headerData);
				console.log('[IPC] ✅ Test created:', test.id);
				return test;
			} catch (error) {
				console.error('[IPC] ❌ Failed to create test:', error);
				throw error;
			}
		},
	);

	/**
	 * Get test by ID
	 * @param testId - Test UUID
	 * @returns TestRecord or null if not found
	 */
	ipcMain.handle(
		'db-get-test',
		async (_, testId: string): Promise<TestRecord | null> => {
			try {
				console.log('[IPC] db-get-test:', testId);
				const test = getTest(testId);
				if (test) {
					console.log('[IPC] ✅ Test found:', testId);
				} else {
					console.log('[IPC] ⚠️ Test not found:', testId);
				}
				return test;
			} catch (error) {
				console.error('[IPC] ❌ Failed to get test:', error);
				throw error;
			}
		},
	);

	/**
	 * Get all tests (sorted by updatedAt desc)
	 * @returns Array of TestRecord
	 */
	ipcMain.handle('db-get-all-tests', async (): Promise<TestRecord[]> => {
		try {
			console.log('[IPC] db-get-all-tests');
			const tests = getAllTests();
			console.log('[IPC] ✅ Found', tests.length, 'tests');
			return tests;
		} catch (error) {
			console.error('[IPC] ❌ Failed to get all tests:', error);
			throw error;
		}
	});

	/**
	 * Update test record
	 * @param testId - Test UUID
	 * @param updates - Partial updates to apply
	 * @returns Success boolean
	 */
	ipcMain.handle(
		'db-update-test',
		async (
			_,
			testId: string,
			updates: Partial<TestRecord>,
		): Promise<boolean> => {
			try {
				console.log('[IPC] db-update-test:', { testId, updates });
				const success = updateTest(testId, updates);
				if (success) {
					console.log('[IPC] ✅ Test updated:', testId);
				} else {
					console.log('[IPC] ❌ Test update failed:', testId);
				}
				return success;
			} catch (error) {
				console.error('[IPC] ❌ Failed to update test:', error);
				throw error;
			}
		},
	);

	/**
	 * Delete test (removes folder and database record)
	 * @param testId - Test UUID
	 * @returns Success boolean
	 */
	ipcMain.handle(
		'db-delete-test',
		async (_, testId: string): Promise<boolean> => {
			try {
				console.log('[IPC] db-delete-test:', testId);
				const success = deleteTest(testId);
				if (success) {
					console.log('[IPC] ✅ Test deleted:', testId);
				} else {
					console.log('[IPC] ❌ Test deletion failed:', testId);
				}
				return success;
			} catch (error) {
				console.error('[IPC] ❌ Failed to delete test:', error);
				throw error;
			}
		},
	);

	// ====================================================================
	// SEARCH
	// ====================================================================

	/**
	 * Search/filter tests
	 * @param query - Search parameters
	 * @returns Array of matching TestRecord
	 */
	ipcMain.handle(
		'db-search-tests',
		async (_, query: TestSearchQuery): Promise<TestRecord[]> => {
			try {
				console.log('[IPC] db-search-tests:', query);
				const results = searchTests(query);
				console.log('[IPC] ✅ Found', results.length, 'matching tests');
				return results;
			} catch (error) {
				console.error('[IPC] ❌ Failed to search tests:', error);
				throw error;
			}
		},
	);

	// ====================================================================
	// SCREENSHOT MANAGEMENT
	// ====================================================================

	/**
	 * Add screenshot to test
	 * @param testId - Test UUID
	 * @param filename - Screenshot filename
	 * @param edited - Whether screenshot was edited
	 * @returns Success boolean
	 */
	ipcMain.handle(
		'db-add-screenshot',
		async (
			_,
			testId: string,
			filename: string,
			edited: boolean = false,
		): Promise<boolean> => {
			try {
				console.log('[IPC] db-add-screenshot:', { testId, filename, edited });
				const success = addScreenshot(testId, filename, edited);
				if (success) {
					console.log('[IPC] ✅ Screenshot added:', filename);
				} else {
					console.log('[IPC] ❌ Failed to add screenshot:', filename);
				}
				return success;
			} catch (error) {
				console.error('[IPC] ❌ Failed to add screenshot:', error);
				throw error;
			}
		},
	);

	/**
	 * Update screenshot metadata
	 * @param testId - Test UUID
	 * @param filename - Screenshot filename
	 * @param updates - Partial updates
	 * @returns Success boolean
	 */
	ipcMain.handle(
		'db-update-screenshot',
		async (
			_,
			testId: string,
			filename: string,
			updates: Partial<ScreenshotData>,
		): Promise<boolean> => {
			try {
				console.log('[IPC] db-update-screenshot:', {
					testId,
					filename,
					updates,
				});
				const success = updateScreenshot(testId, filename, updates);
				if (success) {
					console.log('[IPC] ✅ Screenshot updated:', filename);
				} else {
					console.log('[IPC] ❌ Failed to update screenshot:', filename);
				}
				return success;
			} catch (error) {
				console.error('[IPC] ❌ Failed to update screenshot:', error);
				throw error;
			}
		},
	);

	// ====================================================================
	// VALIDATION
	// ====================================================================

	/**
	 * Validate header data for saving test (testResult optional)
	 * @param headerData - Test header data
	 * @returns { isValid: boolean, missingFields: string[] }
	 */
	ipcMain.handle(
		'db-validate-for-save',
		async (
			_,
			headerData: HeaderData,
		): Promise<{ isValid: boolean; missingFields: string[] }> => {
			try {
				console.log('[IPC] db-validate-for-save:', headerData);
				const validation = validateForSave(headerData);
				console.log('[IPC] Validation result:', validation);
				return validation;
			} catch (error) {
				console.error('[IPC] ❌ Failed to validate for save:', error);
				throw error;
			}
		},
	);

	/**
	 * Validate header data for PDF generation (testResult required)
	 * @param headerData - Test header data
	 * @returns { isValid: boolean, missingFields: string[] }
	 */
	ipcMain.handle(
		'db-validate-for-pdf',
		async (
			_,
			headerData: HeaderData,
		): Promise<{ isValid: boolean; missingFields: string[] }> => {
			try {
				console.log('[IPC] db-validate-for-pdf:', headerData);
				const validation = validateForPDF(headerData);
				console.log('[IPC] Validation result:', validation);
				return validation;
			} catch (error) {
				console.error('[IPC] ❌ Failed to validate for PDF:', error);
				throw error;
			}
		},
	);

	// ====================================================================
	// CLEANUP
	// ====================================================================

	/**
	 * Update database settings
	 * @param settings - Partial settings object to update
	 */
	ipcMain.handle(
		'db-update-settings',
		async (
			_,
			settings: { autoDeleteAfterDays?: number | null },
		): Promise<void> => {
			try {
				console.log('[IPC] db-update-settings:', settings);
				updateDatabaseSettings(settings);
				console.log('[IPC] ✅ Settings updated');
			} catch (error) {
				console.error('[IPC] ❌ Failed to update settings:', error);
				throw error;
			}
		},
	);

	/**
	 * Delete old completed tests based on autoDeleteAfterDays setting
	 * @returns { deletedCount: number, errors: string[] }
	 */
	ipcMain.handle(
		'db-cleanup-old-tests',
		async (): Promise<{ deletedCount: number; errors: string[] }> => {
			try {
				console.log('[IPC] db-cleanup-old-tests');
				const result = cleanupOldTests();
				console.log(
					'[IPC] ✅ Cleanup complete:',
					result.deletedCount,
					'tests deleted',
				);
				return result;
			} catch (error) {
				console.error('[IPC] ❌ Failed to cleanup old tests:', error);
				throw error;
			}
		},
	);

	console.log('[IPC] ✅ Test database handlers registered');
}

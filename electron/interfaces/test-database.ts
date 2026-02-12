/**
 * Shared interfaces for Test Database
 * Used by both main process and renderer process
 */

/**
 * Test type options
 */
export type TestType = 'card' | 'regressivo' | 'gmud' | 'outro' | '';

/**
 * Test status in database
 */
export enum TestStatus {
	IN_PROGRESS = 'in-progress',
	COMPLETED = 'completed',
}

/**
 * Test header metadata
 */
export interface HeaderData {
	testName: string;
	system: string;
	testCycle: string;
	testCase: string;
	testType: TestType;
	testTypeValue: string;
}

/**
 * Individual screenshot metadata
 */
export interface ScreenshotData {
	filename: string;
	capturedAt: string; // ISO 8601 timestamp
	edited: boolean;
}

/**
 * Complete test record in database
 */
export interface TestRecord {
	id: string; // UUID
	createdAt: string; // ISO 8601 timestamp
	updatedAt: string; // ISO 8601 timestamp
	status: TestStatus;

	// Test metadata
	headerData: HeaderData;

	// File system
	folderPath: string; // Flat structure: /rootFolder/test-{uuid}/
	screenshots: ScreenshotData[];

	// Additional data
	notes: string;

	// PDF tracking
	pdfGenerated: boolean;
	pdfPath?: string;
}

/**
 * Database structure (test-database.json)
 */
export interface TestDatabase {
	tests: TestRecord[];
	settings: {
		autoDeleteAfterDays: number;
		lastCleanup: string; // ISO 8601 timestamp
	};
}

/**
 * Search/filter parameters for tests
 */
export interface TestSearchQuery {
	system?: string;
	testType?: TestType;
	testTypeValue?: string;
	testCycle?: string;
	testCase?: string;
	status?: TestStatus;
	startDate?: string; // ISO 8601
	endDate?: string; // ISO 8601
}

/**
 * Validation result for test data
 */
export interface TestValidation {
	isValid: boolean;
	missingFields: string[];
}

/**
 * Response from creating/updating test
 */
export interface TestOperationResponse {
	success: boolean;
	testId?: string;
	error?: string;
}

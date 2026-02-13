/**
 * Application data interfaces
 */

/**
 * Test type options
 */
export type TestType = 'progressivo' | 'regressivo' | 'gmud' | 'outro' | '';

/**
 * Application settings (persisted)
 */
export interface AppSettings {
	rootFolder: string;
	executorName: string;
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
	executionDateTime?: string; // Capturado no momento da geração do PDF
}

/**
 * Response from loading header data
 */
export interface LoadHeaderDataResponse {
	success: boolean;
	data?: HeaderData;
	error?: string;
}

/**
 * Image file data with optional timestamp for cache busting
 */
export interface ImageData {
	name: string;
	path: string;
	timestamp?: number;
}

/**
 * Display information for multi-monitor setup
 */
export interface Display {
	id: number;
	label: string;
	bounds: { x: number; y: number; width: number; height: number };
	primary: boolean;
}

/**
 * Screenshot area coordinates
 */
export interface ScreenshotArea {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Notes data structure
 */
export interface NotesData {
	text: string;
	images: string[];
}

/**
 * PDF generation parameters
 */
export interface PdfParams {
	folder: string;
	filename: string;
}

/**
 * Save image parameters
 */
export interface SaveImageParams {
	dataURL: string;
	originalPath: string;
	folder: string;
}

// ====================================================================
// DATABASE-DRIVEN TEST MANAGEMENT (FASE 4 REVISED)
// ====================================================================

/**
 * Test status in database
 */
export enum TestStatus {
	IN_PROGRESS = 'in-progress',
	COMPLETED = 'completed',
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

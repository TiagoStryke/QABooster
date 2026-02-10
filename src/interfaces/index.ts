/**
 * Application data interfaces
 */

/**
 * Test type options
 */
export type TestType = 'card' | 'regressivo' | 'gmud' | 'outro' | '';

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

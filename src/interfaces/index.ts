/**
 * Application data interfaces
 */

/**
 * Test header metadata
 */
export interface HeaderData {
	testName: string;
	executor: string;
	system: string;
	testCycle: string;
	testCase: string;
}

/**
 * Image file data with optional timestamp for cache busting
 */
export interface ImageData {
	name: string;
	path: string;
	timestamp?: number;
}

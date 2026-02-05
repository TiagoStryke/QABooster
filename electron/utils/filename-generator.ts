import * as fs from 'fs';
import * as path from 'path';
import { APP_CONSTANTS } from '../config/app-config';

/**
 * Generates sequential screenshot filenames (screenshot-001.png, screenshot-002.png, etc.)
 */
export function getNextScreenshotFilename(folder: string): string {
	const files = fs
		.readdirSync(folder)
		.filter((f) => f.endsWith(APP_CONSTANTS.SCREENSHOT.FILE_EXTENSION));

	const numbers = files
		.map((f) => {
			const match = f.match(/^screenshot-(\d+)\.png$/);
			return match ? parseInt(match[1], 10) : 0;
		})
		.filter((n) => n > 0);

	const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;

	return `${APP_CONSTANTS.SCREENSHOT.FILENAME_PREFIX}${String(
		nextNumber,
	).padStart(
		APP_CONSTANTS.SCREENSHOT.FILENAME_DIGITS,
		'0',
	)}${APP_CONSTANTS.SCREENSHOT.FILE_EXTENSION}`;
}

/**
 * Finds the next available filename with counter suffix
 * @param baseFilename - Original filename (e.g., "test.pdf")
 * @returns Next available filename (e.g., "test (2).pdf")
 */
export function findNextAvailableFilename(
	folder: string,
	baseFilename: string,
): string {
	const ext = path.extname(baseFilename);
	const nameWithoutExt = path.basename(baseFilename, ext);

	let counter = 2;
	let newFilename = baseFilename;
	let filepath = path.join(folder, newFilename);

	while (fs.existsSync(filepath)) {
		newFilename = `${nameWithoutExt} (${counter})${ext}`;
		filepath = path.join(folder, newFilename);
		counter++;
	}

	return newFilename;
}

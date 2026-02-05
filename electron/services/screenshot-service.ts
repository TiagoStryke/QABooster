import { clipboard, desktopCapturer, screen } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { getNextScreenshotFilename } from '../utils/filename-generator';
import { addCursorToScreenshot, isCursorInDisplay } from './cursor-service';
import {
    getCursorRelativePosition,
    getDisplayByIndex,
} from './display-service';

/**
 * Screenshot capture service
 */

export interface ScreenshotOptions {
	mainWindow: Electron.BrowserWindow | null;
	currentFolder: string;
	selectedDisplayId: number;
	copyToClipboard: boolean;
	cursorInScreenshots: boolean;
	area?: { x: number; y: number; width: number; height: number };
}

/**
 * Captures a fullscreen screenshot
 */
export async function captureFullscreenScreenshot(
	options: ScreenshotOptions,
): Promise<{ filepath: string; filename: string } | null> {
	const display = getDisplayByIndex(options.selectedDisplayId);
	const { width, height } = display.bounds;

	const sources = await desktopCapturer.getSources({
		types: ['screen'],
		thumbnailSize: { width, height },
	});

	if (sources.length <= options.selectedDisplayId) {
		return null;
	}

	let image = sources[options.selectedDisplayId].thumbnail;

	// Add cursor if enabled and within bounds
	if (options.cursorInScreenshots) {
		const { x: relativeCursorX, y: relativeCursorY } =
			getCursorRelativePosition(display.bounds);

		if (
			isCursorInDisplay(
				relativeCursorX,
				relativeCursorY,
				display.bounds.width,
				display.bounds.height,
			)
		) {
			image = await addCursorToScreenshot(
				options.mainWindow,
				image,
				relativeCursorX,
				relativeCursorY,
			);
		}
	}

	// Save to file
	const filename = getNextScreenshotFilename(options.currentFolder);
	const filepath = path.join(options.currentFolder, filename);
	fs.writeFileSync(filepath, image.toPNG());

	// Copy to clipboard if enabled
	if (options.copyToClipboard) {
		clipboard.writeImage(image);
	}

	return { filepath, filename };
}

/**
 * Captures a screenshot of a specific area
 */
export async function captureAreaScreenshot(
	options: ScreenshotOptions & {
		area: { x: number; y: number; width: number; height: number };
	},
): Promise<{ filepath: string; filename: string } | null> {
	const display = getDisplayByIndex(options.selectedDisplayId);
	const { width, height } = display.bounds;

	const sources = await desktopCapturer.getSources({
		types: ['screen'],
		thumbnailSize: { width, height },
	});

	if (sources.length <= options.selectedDisplayId) {
		return null;
	}

	let image = sources[options.selectedDisplayId].thumbnail;

	// Add cursor if enabled and within bounds
	if (options.cursorInScreenshots) {
		const { x: relativeCursorX, y: relativeCursorY } =
			getCursorRelativePosition(display.bounds);

		if (
			isCursorInDisplay(
				relativeCursorX,
				relativeCursorY,
				display.bounds.width,
				display.bounds.height,
			)
		) {
			image = await addCursorToScreenshot(
				options.mainWindow,
				image,
				relativeCursorX,
				relativeCursorY,
			);
		}
	}

	// Crop to area
	const cropped = image.crop(options.area);

	// Save to file
	const filename = getNextScreenshotFilename(options.currentFolder);
	const filepath = path.join(options.currentFolder, filename);
	fs.writeFileSync(filepath, cropped.toPNG());

	// Copy to clipboard if enabled
	if (options.copyToClipboard) {
		clipboard.writeImage(cropped);
	}

	return { filepath, filename };
}

/**
 * Captures screenshot for overlay preview (with cursor)
 */
export async function captureScreenshotForOverlay(
	mainWindow: Electron.BrowserWindow | null,
	selectedDisplayId: number,
	cursorInScreenshots: boolean,
): Promise<Electron.NativeImage | null> {
	const display = getDisplayByIndex(selectedDisplayId);
	const { x, y, width, height } = display.bounds;

	const sources = await desktopCapturer.getSources({
		types: ['screen'],
		thumbnailSize: { width, height },
	});

	const sourceIndex = Math.min(selectedDisplayId, sources.length - 1);
	let screenshot = sources[sourceIndex].thumbnail;

	// Add cursor if enabled and within bounds
	if (cursorInScreenshots) {
		const cursorPos = screen.getCursorScreenPoint();
		const relativeCursorX = cursorPos.x - x;
		const relativeCursorY = cursorPos.y - y;

		if (isCursorInDisplay(relativeCursorX, relativeCursorY, width, height)) {
			screenshot = await addCursorToScreenshot(
				mainWindow,
				screenshot,
				relativeCursorX,
				relativeCursorY,
			);
		}
	}

	return screenshot;
}

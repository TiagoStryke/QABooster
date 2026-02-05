import { BrowserWindow, nativeImage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Loads cursor SVG as base64 data URL
 */
export function loadCursorSVG(): string {
	return `data:image/svg+xml;base64,${fs.readFileSync(
		path.join(__dirname, '..', 'assets', 'cursor.svg'),
		'base64',
	)}`;
}

/**
 * Adds cursor overlay to screenshot using renderer process canvas
 * @param mainWindow - Main window for executeJavaScript
 * @param screenshot - Screenshot image
 * @param cursorX - Cursor X position relative to screenshot
 * @param cursorY - Cursor Y position relative to screenshot
 * @returns Screenshot with cursor overlay
 */
export async function addCursorToScreenshot(
	mainWindow: BrowserWindow | null,
	screenshot: Electron.NativeImage,
	cursorX: number,
	cursorY: number,
): Promise<Electron.NativeImage> {
	if (!mainWindow) return screenshot;

	const size = screenshot.getSize();
	const dataURL = screenshot.toDataURL();
	const cursorSVG = loadCursorSVG();

	const result = await mainWindow.webContents.executeJavaScript(`
		new Promise((resolve) => {
			const canvas = document.createElement('canvas');
			canvas.width = ${size.width};
			canvas.height = ${size.height};
			const ctx = canvas.getContext('2d');
			
			const img = new Image();
			img.onload = () => {
				ctx.drawImage(img, 0, 0);
				
				const cursor = new Image();
				cursor.onload = () => {
					ctx.drawImage(cursor, ${Math.round(cursorX)}, ${Math.round(cursorY)}, 24, 36);
					resolve(canvas.toDataURL());
				};
				cursor.onerror = () => resolve('${dataURL}');
				cursor.src = '${cursorSVG}';
			};
			img.onerror = () => resolve('${dataURL}');
			img.src = '${dataURL}';
		});
	`);

	return nativeImage.createFromDataURL(result);
}

/**
 * Checks if cursor is within display bounds
 */
export function isCursorInDisplay(
	cursorX: number,
	cursorY: number,
	displayWidth: number,
	displayHeight: number,
): boolean {
	return (
		cursorX >= 0 &&
		cursorX < displayWidth &&
		cursorY >= 0 &&
		cursorY < displayHeight
	);
}

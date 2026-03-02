import { BrowserWindow } from 'electron';
import * as path from 'path';
import { getOverlayWindowConfig } from '../config/window-config';

/**
 * Creates overlay window for area selection
 */
export async function createOverlayWindow(
	x: number,
	y: number,
	width: number,
	height: number,
	screenshotDataURL: string,
	eventName: string,
	menuBarOffset: number = 0,
	displayIndex: number = 0,
): Promise<BrowserWindow> {
	const overlayWindow = new BrowserWindow(
		getOverlayWindowConfig(x, y, width, height),
	);

	overlayWindow.setIgnoreMouseEvents(false);
	overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
	overlayWindow.setAlwaysOnTop(true, 'screen-saver');

	const htmlPath = path.join(
		__dirname,
		'..',
		'area-selector',
		'area-selector.html',
	);

	await overlayWindow.loadFile(htmlPath);

	// Inject screenshot, event name, menuBarOffset and displayIndex
	await overlayWindow.webContents.executeJavaScript(`
		document.getElementById('screenshot').src = '${screenshotDataURL}';
		window.eventName = '${eventName}';
		window.menuBarOffset = ${menuBarOffset};
		window.displayIndex = ${displayIndex};
	`);

	// Show immediately without ready-to-show to avoid animation
	overlayWindow.show();
	overlayWindow.focus();

	return overlayWindow;
}

/**
 * Closes overlay window if it exists
 */
export function closeOverlayWindow(overlayWindow: BrowserWindow | null): void {
	if (overlayWindow) {
		overlayWindow.close();
	}
}

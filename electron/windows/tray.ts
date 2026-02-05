import { BrowserWindow, ipcMain, nativeImage, Tray } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { APP_CONSTANTS } from '../config/app-config';

/**
 * Creates tray icon with dynamic color
 */
function createTrayIcon(
	color: string = APP_CONSTANTS.TRAY_FLASH.COLOR_DEFAULT,
): Electron.NativeImage {
	const svgTemplate = fs.readFileSync(
		path.join(__dirname, '..', 'assets', 'tray-icon.svg'),
		'utf-8',
	);
	const svg = svgTemplate.replace(/#ffffff/g, color);
	return nativeImage.createFromDataURL(
		'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'),
	);
}

/**
 * Creates and configures the system tray
 */
export function createTray(mainWindow: BrowserWindow | null): Tray {
	const tray = new Tray(createTrayIcon());
	tray.setToolTip('QA Booster - Gerador de evidências');

	tray.on('click', () => {
		if (mainWindow) {
			if (mainWindow.isVisible()) {
				mainWindow.hide();
			} else {
				mainWindow.show();
			}
		}
	});

	return tray;
}

/**
 * Sets up tray flash animation handler
 */
export function setupTrayFlashHandler(tray: Tray | null): void {
	ipcMain.on('screenshot-flash', () => {
		if (!tray) return;

		// Green
		tray.setImage(createTrayIcon(APP_CONSTANTS.TRAY_FLASH.COLOR_ACTIVE));

		APP_CONSTANTS.TRAY_FLASH.DURATIONS.forEach((duration, index) => {
			setTimeout(() => {
				if (tray) {
					const color =
						index % 2 === 0
							? APP_CONSTANTS.TRAY_FLASH.COLOR_DEFAULT
							: APP_CONSTANTS.TRAY_FLASH.COLOR_ACTIVE;
					tray.setImage(createTrayIcon(color));
				}
			}, duration);
		});
	});
}

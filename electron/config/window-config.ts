import { BrowserWindowConstructorOptions } from 'electron';

/**
 * Main window configuration
 */
export const mainWindowConfig: BrowserWindowConstructorOptions = {
	width: 1400,
	height: 900,
	minWidth: 1000,
	minHeight: 600,
	webPreferences: {
		nodeIntegration: true,
		contextIsolation: false,
		webSecurity: false,
	},
	titleBarStyle: 'hiddenInset',
	backgroundColor: '#0f172a',
};

/**
 * Overlay window configuration
 */
export const getOverlayWindowConfig = (
	x: number,
	y: number,
	width: number,
	height: number,
): BrowserWindowConstructorOptions => ({
	x,
	y,
	width,
	height,
	frame: false,
	transparent: true,
	alwaysOnTop: true,
	skipTaskbar: true,
	resizable: false,
	movable: false,
	hasShadow: false,
	focusable: true,
	show: false,
	webPreferences: {
		nodeIntegration: true,
		contextIsolation: false,
	},
});

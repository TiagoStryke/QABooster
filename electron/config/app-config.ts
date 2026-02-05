import { BrowserWindow, Tray } from 'electron';

/**
 * Application global state
 */
export class AppState {
	// Windows
	static mainWindow: BrowserWindow | null = null;
	static overlayWindow: BrowserWindow | null = null;
	static tray: Tray | null = null;

	// Folder and file management
	static currentFolder: string = '';
	static pendingScreenshot: Electron.NativeImage | null = null;

	// Shortcuts
	static shortcutKey: string = 'CommandOrControl+Shift+S';
	static shortcutKeyArea: string = 'CommandOrControl+Shift+A';
	static shortcutKeyQuick: string = 'CommandOrControl+Shift+Q';

	// Display settings
	static selectedDisplayId: number = 0;

	// Feature flags
	static useSavedArea: boolean = false;
	static copyToClipboard: boolean = false;
	static soundEnabled: boolean = true;
	static cursorInScreenshots: boolean = true;

	// Saved area
	static savedArea: {
		x: number;
		y: number;
		width: number;
		height: number;
	} | null = null;

	// Window dimensions
	static originalWindowWidth: number = 1400;
}

/**
 * Application constants
 */
export const APP_CONSTANTS = {
	// Window settings
	WINDOW: {
		DEFAULT_WIDTH: 1400,
		DEFAULT_HEIGHT: 900,
		MIN_WIDTH: 1000,
		MIN_HEIGHT: 600,
	},

	// Screenshot
	SCREENSHOT: {
		FILENAME_PREFIX: 'screenshot-',
		FILENAME_DIGITS: 3,
		FILE_EXTENSION: '.png',
	},

	// Config files
	CONFIG: {
		HEADER_DATA: '.qabooster-config.json',
		NOTES_DATA: '.qabooster-notes.json',
	},

	// Tray animation timing
	TRAY_FLASH: {
		DURATIONS: [150, 300, 450],
		COLOR_ACTIVE: '#22c55e',
		COLOR_DEFAULT: '#ffffff',
	},
} as const;

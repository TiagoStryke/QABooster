import { ipcMain } from 'electron';

/**
 * Registers settings IPC handlers
 */
export function registerSettingsHandlers(
	getUseSavedArea: () => boolean,
	setUseSavedArea: (value: boolean) => void,
	getCopyToClipboard: () => boolean,
	setCopyToClipboard: (value: boolean) => void,
	getSoundEnabled: () => boolean,
	setSoundEnabled: (value: boolean) => void,
	getCursorInScreenshots: () => boolean,
	setCursorInScreenshots: (value: boolean) => void,
	getSavedArea: () => {
		x: number;
		y: number;
		width: number;
		height: number;
	} | null,
	setSavedArea: (area: {
		x: number;
		y: number;
		width: number;
		height: number;
	}) => void,
): void {
	// Use saved area setting
	ipcMain.handle('set-use-saved-area', async (_, useArea: boolean) => {
		setUseSavedArea(useArea);
		return true;
	});

	// Copy to clipboard setting
	ipcMain.handle('set-copy-to-clipboard', async (_, enabled: boolean) => {
		setCopyToClipboard(enabled);
		return true;
	});

	// Sound enabled setting
	ipcMain.handle('set-sound-enabled', async (_, enabled: boolean) => {
		setSoundEnabled(enabled);
		return true;
	});

	// Cursor in screenshots setting
	ipcMain.handle('set-cursor-in-screenshots', async (_, enabled: boolean) => {
		setCursorInScreenshots(enabled);
		return true;
	});

	// Save selected area
	ipcMain.handle(
		'save-selected-area',
		async (
			_,
			area: { x: number; y: number; width: number; height: number },
		) => {
			setSavedArea(area);
			return true;
		},
	);

	// Get saved area
	ipcMain.handle('get-saved-area', async () => {
		return getSavedArea();
	});
}

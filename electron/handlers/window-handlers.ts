import { BrowserWindow, ipcMain } from 'electron';

/**
 * Registers window management IPC handlers
 */
export function registerWindowHandlers(
	getMainWindow: () => BrowserWindow | null,
	getOriginalWindowWidth: () => number,
	setOriginalWindowWidth: (width: number) => void,
): void {
	// Expand window for notes panel
	ipcMain.on('expand-window', (_, extraWidth: number) => {
		const mainWindow = getMainWindow();
		if (mainWindow) {
			const [width, height] = mainWindow.getSize();
			setOriginalWindowWidth(width);
			mainWindow.setSize(width + extraWidth, height, true);
		}
	});

	// Contract window back to original size
	ipcMain.on('contract-window', () => {
		const mainWindow = getMainWindow();
		if (mainWindow) {
			const [, height] = mainWindow.getSize();
			mainWindow.setSize(getOriginalWindowWidth(), height, true);
		}
	});
}

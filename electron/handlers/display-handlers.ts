import { ipcMain } from 'electron';
import { getAllDisplays } from '../services/display-service';

/**
 * Registers display management IPC handlers
 */
export function registerDisplayHandlers(
	getSelectedDisplayId: () => number,
	setSelectedDisplayId: (id: number) => void,
): void {
	// Get all displays
	ipcMain.handle('get-displays', async () => {
		return getAllDisplays();
	});

	// Set selected display
	ipcMain.handle('set-display', async (_, displayId: number) => {
		setSelectedDisplayId(displayId);
		return true;
	});
}

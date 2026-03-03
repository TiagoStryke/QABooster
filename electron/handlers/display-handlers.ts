import { ipcMain, screen } from 'electron';
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
		const displays = screen.getAllDisplays();
		// Clamp to valid range in case of stale localStorage value
		const clampedId = Math.min(Math.max(0, displayId), displays.length - 1);
		setSelectedDisplayId(clampedId);
		return true;
	});
}

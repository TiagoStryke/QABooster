import { ipcMain } from 'electron';

/**
 * Registers shortcut management IPC handlers
 */
export function registerShortcutHandlers(
	getShortcutKey: () => string,
	setShortcutKey: (key: string) => void,
	getShortcutKeyArea: () => string,
	setShortcutKeyArea: (key: string) => void,
	getShortcutKeyQuick: () => string,
	setShortcutKeyQuick: (key: string) => void,
	registerGlobalShortcut: () => void,
): void {
	// Set fullscreen shortcut
	ipcMain.handle('set-shortcut', async (_, newShortcut: string) => {
		setShortcutKey(newShortcut);
		registerGlobalShortcut();
		return true;
	});

	// Set area shortcut
	ipcMain.handle('set-area-shortcut', async (_, newShortcut: string) => {
		setShortcutKeyArea(newShortcut);
		registerGlobalShortcut();
		return true;
	});

	// Set quick shortcut
	ipcMain.handle('set-quick-shortcut', async (_, newShortcut: string) => {
		setShortcutKeyQuick(newShortcut);
		registerGlobalShortcut();
		return true;
	});
}

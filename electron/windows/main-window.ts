import { BrowserWindow, app } from 'electron';
import * as path from 'path';
import { mainWindowConfig } from '../config/window-config';

/**
 * Creates and manages the main application window
 */
export function createMainWindow(): BrowserWindow {
	const mainWindow = new BrowserWindow(mainWindowConfig);

	if (process.env.NODE_ENV === 'development') {
		mainWindow.loadURL('http://localhost:3000');
		// Always open DevTools in development
		mainWindow.webContents.openDevTools();
	} else {
		// In production, use app.getAppPath() which works even when packaged
		const indexPath = path.join(
			app.getAppPath(),
			'dist',
			'renderer',
			'index.html',
		);
		mainWindow.loadFile(indexPath);
	}

	mainWindow.on('closed', () => {
		// Window will be set to null in main.ts
	});

	return mainWindow;
}

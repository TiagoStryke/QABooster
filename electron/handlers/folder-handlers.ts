import { dialog, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { APP_CONSTANTS } from '../config/app-config';
import {
    deleteFile,
    listImages,
    loadJSON,
    saveBase64Image,
    saveJSON,
} from '../services/file-service';

/**
 * Registers folder and file management IPC handlers
 * Simplified for database-driven architecture
 */
export function registerFolderHandlers(
	getCurrentFolder: () => string,
	setCurrentFolder: (folder: string) => void,
	getCurrentTestId: () => string | null,
	setCurrentTestId: (testId: string | null) => void,
): void {
	// Select folder dialog
	ipcMain.handle('select-folder', async () => {
		const result = await dialog.showOpenDialog({
			properties: ['openDirectory', 'createDirectory'],
		});

		if (!result.canceled && result.filePaths.length > 0) {
			setCurrentFolder(result.filePaths[0]);
			return result.filePaths[0];
		}
		return null;
	});

	// Get current folder
	ipcMain.handle('get-current-folder', async () => {
		return getCurrentFolder();
	});

	// Clear current folder
	ipcMain.handle('clear-current-folder', async () => {
		setCurrentFolder('');
		return { success: true };
	});

	// Get images in folder
	ipcMain.handle('get-images', async (_, folderPath: string) => {
		return listImages(folderPath);
	});

	// Save image from base64
	ipcMain.handle('save-image', async (_, { dataURL, originalPath, folder }) => {
		// Use originalPath as filepath (already contains full path)
		return saveBase64Image(originalPath, dataURL);
	});

	// Delete image
	ipcMain.handle('delete-image', async (_, filepath: string) => {
		return deleteFile(filepath);
	});

	// Open folder in Finder
	ipcMain.handle('open-folder-in-finder', async (_, folderPath) => {
		try {
			const { shell } = require('electron');
			await shell.openPath(folderPath);
			return { success: true };
		} catch (error) {
			console.error('Error opening folder:', error);
			return { success: false, error: String(error) };
		}
	});

	// Save header data
	ipcMain.handle('save-header-data', async (_, folderPath, headerData) => {
		try {
			if (!folderPath) {
				return { success: false, error: 'Nenhuma pasta especificada' };
			}

			const configPath = path.join(
				folderPath,
				APP_CONSTANTS.CONFIG.HEADER_DATA,
			);
			console.log('[BACKEND] 💾 Saving header data to:', configPath);
			console.log('[BACKEND] 💾 Data:', headerData);

			const success = saveJSON(configPath, headerData);

			console.log('[BACKEND] 💾 Save result:', success);
			return { success };
		} catch (error) {
			console.error('[BACKEND] ❌ Error saving header data:', error);
			return { success: false, error: String(error) };
		}
	});

	// Load header data
	ipcMain.handle('load-header-data', async (_, folderPath: string) => {
		try {
			const configPath = path.join(
				folderPath,
				APP_CONSTANTS.CONFIG.HEADER_DATA,
			);
			console.log('[BACKEND] 📂 Looking for header file at:', configPath);
			console.log('[BACKEND] 📂 File exists?', fs.existsSync(configPath));

			const data = loadJSON(configPath);

			if (data) {
				console.log('[BACKEND] ✅ Header data loaded successfully');
				return { success: true, data };
			}

			console.log('[BACKEND] ❌ Config file not found or empty');
			return { success: false, error: 'Config file not found' };
		} catch (error) {
			console.error('[BACKEND] ❌ Error loading header data:', error);
			return { success: false, error: String(error) };
		}
	});

	// Save notes
	ipcMain.handle(
		'save-notes',
		async (_, folderPath: string, notesData: any) => {
			try {
				const notesPath = path.join(
					folderPath,
					APP_CONSTANTS.CONFIG.NOTES_DATA,
				);
				const success = saveJSON(notesPath, notesData);
				return { success };
			} catch (error) {
				console.error('Error saving notes:', error);
				return { success: false, error: String(error) };
			}
		},
	);

	// Load notes
	ipcMain.handle('load-notes', async (_, folderPath: string) => {
		try {
			const notesPath = path.join(folderPath, APP_CONSTANTS.CONFIG.NOTES_DATA);
			const data = loadJSON(notesPath);

			return {
				success: true,
				data: data || { text: '', images: [] },
			};
		} catch (error) {
			console.error('Error loading notes:', error);
			return { success: false, error: String(error) };
		}
	});

	// Open image preview
	ipcMain.handle('open-image-preview', async (_, imagePath: string) => {
		try {
			const { shell } = require('electron');
			await shell.openPath(imagePath);
			return { success: true };
		} catch (error) {
			console.error('Error opening image preview:', error);
			return { success: false, error: String(error) };
		}
	});

	// Read image as base64
	ipcMain.handle('read-image-as-base64', async (_, filepath: string) => {
		const { readImageAsBase64 } = require('../services/file-service');
		return readImageAsBase64(filepath);
	});

	// Set current test (sync frontend -> backend)
	ipcMain.handle(
		'set-current-test',
		async (_, testId: string | null, folderPath: string) => {
			console.log('[IPC] set-current-test:', { testId, folderPath });
			setCurrentTestId(testId);
			setCurrentFolder(folderPath);
			return { success: true };
		},
	);
}

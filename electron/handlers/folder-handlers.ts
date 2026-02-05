import { dialog, ipcMain } from 'electron';
import * as path from 'path';
import { APP_CONSTANTS } from '../config/app-config';
import {
    deleteFile,
    ensureFolder,
    fileExists,
    listImages,
    loadJSON,
    renameFolder as renameFolderService,
    saveBase64Image,
    saveJSON,
} from '../services/file-service';

/**
 * Registers folder and file management IPC handlers
 */
export function registerFolderHandlers(
	getCurrentFolder: () => string,
	setCurrentFolder: (folder: string) => void,
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

	// Create new folder with dialog
	ipcMain.handle('create-folder', async (_, folderName: string) => {
		const result = await dialog.showOpenDialog({
			properties: ['openDirectory', 'createDirectory'],
			title: 'Selecione onde criar a pasta',
		});

		if (!result.canceled && result.filePaths.length > 0) {
			const newFolderPath = path.join(result.filePaths[0], folderName);
			ensureFolder(newFolderPath);
			setCurrentFolder(newFolderPath);
			return newFolderPath;
		}
		return null;
	});

	// Create subfolder
	ipcMain.handle(
		'create-subfolder',
		async (_, parentPath: string, folderName: string) => {
			let newFolderPath = path.join(parentPath, folderName);

			// If exists, add (2), (3), etc
			if (fileExists(newFolderPath)) {
				let counter = 2;
				while (
					fileExists(path.join(parentPath, `${folderName} (${counter})`))
				) {
					counter++;
				}
				newFolderPath = path.join(parentPath, `${folderName} (${counter})`);
			}

			ensureFolder(newFolderPath);
			setCurrentFolder(newFolderPath);
			return newFolderPath;
		},
	);

	// Rename folder
	ipcMain.handle(
		'rename-folder',
		async (_, oldPath: string, newName: string) => {
			try {
				const parentPath = path.dirname(oldPath);
				let newPath = path.join(parentPath, newName);

				// If exists, add (2), (3), etc
				if (fileExists(newPath) && newPath !== oldPath) {
					let counter = 2;
					while (fileExists(path.join(parentPath, `${newName} (${counter})`))) {
						counter++;
					}
					newPath = path.join(parentPath, `${newName} (${counter})`);
				}

				const result = renameFolderService(oldPath, newPath);
				if (result) {
					setCurrentFolder(result);
				}
				return result;
			} catch (error) {
				console.error('Error renaming folder:', error);
				return null;
			}
		},
	);

	// Get current folder
	ipcMain.handle('get-current-folder', async () => {
		return getCurrentFolder();
	});

	// Get images in folder
	ipcMain.handle('get-images', async (_, folderPath: string) => {
		return listImages(folderPath);
	});

	// Save image from base64
	ipcMain.handle('save-image', async (_, { filepath, dataUrl }) => {
		return saveBase64Image(filepath, dataUrl);
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
			const success = saveJSON(configPath, headerData);

			return { success };
		} catch (error) {
			console.error('Error saving header data:', error);
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
			const data = loadJSON(configPath);

			if (data) {
				return { success: true, data };
			}

			return { success: false, error: 'Config file not found' };
		} catch (error) {
			console.error('Error loading header data:', error);
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
}

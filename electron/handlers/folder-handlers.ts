import { dialog, ipcMain } from 'electron';
import * as fs from 'fs';
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
import {
    buildFolderPath,
    detectChangedLevel,
    ensureFolderStructure,
    getMonthFolderName,
    HeaderData,
    isValidTestFolder,
    rebuildPathAfterRename,
    validateHeaderComplete,
    validateHeaderForScreenshot,
} from '../services/folder-structure-service';

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

	// ==================== NEW FOLDER STRUCTURE HANDLERS ====================

	// Validate if header is complete for screenshot (testName not required)
	ipcMain.handle(
		'validate-header-for-screenshot',
		async (_, headerData: HeaderData) => {
			try {
				const isComplete = validateHeaderForScreenshot(headerData);
				return { success: true, isComplete };
			} catch (error) {
				console.error('Error validating header for screenshot:', error);
				return { success: false, error: String(error) };
			}
		},
	);

	// Validate if header is complete for PDF (testName required)
	ipcMain.handle(
		'validate-header-complete',
		async (_, headerData: HeaderData) => {
			try {
				const isComplete = validateHeaderComplete(headerData);
				return { success: true, isComplete };
			} catch (error) {
				console.error('Error validating header:', error);
				return { success: false, error: String(error) };
			}
		},
	);

	// Build folder path from header data
	ipcMain.handle(
		'build-folder-path',
		async (_, rootFolder: string, headerData: HeaderData) => {
			try {
				const folderPath = buildFolderPath(rootFolder, headerData);
				return { success: true, path: folderPath };
			} catch (error) {
				console.error('Error building folder path:', error);
				return { success: false, error: String(error) };
			}
		},
	);

	// Create test folder structure
	ipcMain.handle(
		'create-test-structure',
		async (_, rootFolder: string, headerData: HeaderData) => {
			try {
				const folderPath = ensureFolderStructure(rootFolder, headerData);

				if (folderPath) {
					setCurrentFolder(folderPath);
					return { success: true, path: folderPath };
				}

				return {
					success: false,
					error: 'Invalid header data or root folder not configured',
				};
			} catch (error) {
				console.error('Error creating test structure:', error);
				return { success: false, error: String(error) };
			}
		},
	);

	// Detect which folder level changed
	ipcMain.handle(
		'detect-changed-level',
		async (
			_,
			oldHeader: HeaderData,
			newHeader: HeaderData,
			oldPath: string,
		) => {
			try {
				const change = detectChangedLevel(oldHeader, newHeader, oldPath);
				return { success: true, change };
			} catch (error) {
				console.error('Error detecting changed level:', error);
				return { success: false, error: String(error) };
			}
		},
	);

	// Rename folder level and return new path
	ipcMain.handle(
		'rename-folder-level',
		async (
			_,
			oldPath: string,
			level: 'month' | 'type' | 'cycle' | 'case',
			newName: string,
		) => {
			try {
				// Constrói novo caminho
				const newPath = rebuildPathAfterRename(oldPath, level, newName);

				// Se o novo caminho é igual ao antigo, não faz nada
				if (newPath === oldPath) {
					return { success: true, path: oldPath };
				}

				// Renomeia a pasta
				const renamedPath = renameFolderService(oldPath, newPath);

				if (renamedPath) {
					setCurrentFolder(renamedPath);
					return { success: true, path: renamedPath };
				}

				return { success: false, error: 'Failed to rename folder' };
			} catch (error) {
				console.error('Error renaming folder level:', error);
				return { success: false, error: String(error) };
			}
		},
	);

	// Validate if folder is a valid test folder
	ipcMain.handle('is-valid-test-folder', async (_, folderPath: string) => {
		try {
			const isValid = isValidTestFolder(folderPath);
			return { success: true, isValid };
		} catch (error) {
			console.error('Error validating test folder:', error);
			return { success: false, error: String(error) };
		}
	});

	// Get month folder name (utility)
	ipcMain.handle('get-month-folder-name', async () => {
		try {
			const monthName = getMonthFolderName();
			return { success: true, name: monthName };
		} catch (error) {
			console.error('Error getting month folder name:', error);
			return { success: false, error: String(error) };
		}
	});
}

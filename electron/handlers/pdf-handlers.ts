import { dialog, ipcMain, shell } from 'electron';
import * as path from 'path';
import { fileExists, savePDF } from '../services/file-service';
import { findNextAvailableFilename } from '../utils/filename-generator';

/**
 * Registers PDF generation and management IPC handlers
 */
export function registerPdfHandlers(getCurrentFolder: () => string): void {
	// Check if PDF exists
	ipcMain.handle('check-pdf-exists', async (_, { filename }) => {
		try {
			const currentFolder = getCurrentFolder();
			if (!currentFolder) {
				return { success: false, error: 'Nenhuma pasta selecionada' };
			}

			const filepath = path.join(currentFolder, filename);
			const exists = fileExists(filepath);

			return { success: true, exists };
		} catch (error) {
			console.error('Error checking PDF:', error);
			return { success: false, error: String(error) };
		}
	});

	// Show PDF exists dialog
	ipcMain.handle('show-pdf-exists-dialog', async (_, { filename }) => {
		try {
			const result = await dialog.showMessageBox({
				type: 'question',
				title: 'Arquivo já existe',
				message: `Um arquivo PDF com este nome já existe:\n${filename}`,
				buttons: ['Substituir', 'Criar nova cópia', 'Cancelar'],
				defaultId: 1,
				cancelId: 2,
			});

			// result.response: 0 = Substituir, 1 = Criar nova cópia, 2 = Cancelar
			return { success: true, action: result.response };
		} catch (error) {
			console.error('Error showing dialog:', error);
			return { success: false, error: String(error) };
		}
	});

	// Find next available filename
	ipcMain.handle('find-next-filename', async (_, { baseFilename }) => {
		try {
			const currentFolder = getCurrentFolder();
			if (!currentFolder) {
				return { success: false, error: 'Nenhuma pasta selecionada' };
			}

			const newFilename = findNextAvailableFilename(
				currentFolder,
				baseFilename,
			);

			return { success: true, filename: newFilename };
		} catch (error) {
			console.error('Error finding next filename:', error);
			return { success: false, error: String(error) };
		}
	});

	// Save PDF
	ipcMain.handle('save-pdf', async (_, { pdfData, filename }) => {
		try {
			const currentFolder = getCurrentFolder();
			if (!currentFolder) {
				return { success: false, error: 'Nenhuma pasta selecionada' };
			}

			const filepath = path.join(currentFolder, filename);
			const success = savePDF(filepath, pdfData);

			if (success) {
				return { success: true, filepath };
			}

			return { success: false, error: 'Failed to save PDF' };
		} catch (error) {
			console.error('Error saving PDF:', error);
			return { success: false, error: String(error) };
		}
	});

	// Show PDF saved dialog
	ipcMain.handle('show-pdf-saved-dialog', async (_, { filename }) => {
		try {
			const result = await dialog.showMessageBox({
				type: 'info',
				title: 'PDF Salvo',
				message: 'PDF salvo com sucesso!',
				detail: filename,
				buttons: ['OK', 'Visualizar PDF'],
				defaultId: 1,
				cancelId: 0,
			});

			return {
				action: result.response === 1 ? 'view' : 'ok',
			};
		} catch (error) {
			console.error('Error showing dialog:', error);
			return { action: 'ok' };
		}
	});

	// Open PDF
	ipcMain.handle('open-pdf', async (_, filepath) => {
		try {
			await shell.openPath(filepath);
			return { success: true };
		} catch (error) {
			console.error('Error opening PDF:', error);
			return { success: false, error: String(error) };
		}
	});
}

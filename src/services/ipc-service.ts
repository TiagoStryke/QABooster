/**
 * Centralized IPC Service
 *
 * This service provides a typed interface for all Electron IPC communications.
 * It replaces scattered ipcRenderer.invoke() calls throughout the codebase with
 * a single, maintainable, and testable service layer.
 *
 * Benefits:
 * - Strong typing for all IPC calls
 * - Easy to mock in tests
 * - Centralized error handling
 * - Clear separation of concerns
 */

import type {
    Display,
    HeaderData,
    ImageData,
    NotesData,
    SaveImageParams,
    ScreenshotArea,
} from '../interfaces';

const { ipcRenderer } = window.require('electron');

/**
 * Centralized IPC Service
 * All Electron IPC communications should go through this service
 */
class IpcService {
	// ==================== FOLDER OPERATIONS ====================

	/**
	 * Open folder selection dialog
	 * @returns Selected folder path or null if cancelled
	 */
	async selectFolder(): Promise<string | null> {
		return ipcRenderer.invoke('select-folder');
	}

	/**
	 * Create a new folder with automated naming
	 * @param baseFolder - Parent folder path
	 * @param baseName - Base name for the folder (e.g., "test")
	 * @returns Created folder path
	 */
	async createFolder(baseFolder: string, baseName: string): Promise<string> {
		return ipcRenderer.invoke('create-folder', baseFolder, baseName);
	}

	/**
	 * Open folder in system file explorer (Finder on macOS)
	 * @param folderPath - Path to open
	 */
	async openFolderInFinder(folderPath: string): Promise<void> {
		return ipcRenderer.invoke('open-folder-in-finder', folderPath);
	}

	/**
	 * Rename a folder
	 * @param currentPath - Current folder path
	 * @param newName - New folder name (not full path, just name)
	 * @returns New folder path or null if failed
	 */
	async renameFolder(
		currentPath: string,
		newName: string,
	): Promise<string | null> {
		return ipcRenderer.invoke('rename-folder', currentPath, newName);
	}

	// ==================== HEADER DATA ====================

	/**
	 * Load header data from folder
	 * @param folder - Folder path
	 * @returns Header data or null if not found
	 */
	async loadHeaderData(folder: string): Promise<HeaderData | null> {
		return ipcRenderer.invoke('load-header-data', folder);
	}

	/**
	 * Save header data to folder
	 * @param folder - Folder path
	 * @param data - Header data to save
	 */
	async saveHeaderData(folder: string, data: HeaderData): Promise<void> {
		return ipcRenderer.invoke('save-header-data', folder, data);
	}

	// ==================== IMAGE OPERATIONS ====================

	/**
	 * Get all images from folder
	 * @param folder - Folder path
	 * @returns Array of image data
	 */
	async getImages(folder: string): Promise<ImageData[]> {
		return ipcRenderer.invoke('get-images', folder);
	}

	/**
	 * Save image to folder
	 * @param params - Save image parameters
	 * @returns Saved image path
	 */
	async saveImage(params: SaveImageParams): Promise<string> {
		return ipcRenderer.invoke('save-image', params);
	}

	/**
	 * Delete image file
	 * @param imagePath - Path to image to delete
	 */
	async deleteImage(imagePath: string): Promise<void> {
		return ipcRenderer.invoke('delete-image', imagePath);
	}

	/**
	 * Open image in system preview
	 * @param imagePath - Path to image
	 */
	async openImagePreview(imagePath: string): Promise<void> {
		return ipcRenderer.invoke('open-image-preview', imagePath);
	}

	/**
	 * Read image as base64 data URL
	 * @param imagePath - Path to image
	 * @returns Base64 data URL (data:image/png;base64,...)
	 */
	async readImageAsBase64(imagePath: string): Promise<string> {
		return ipcRenderer.invoke('read-image-as-base64', imagePath);
	}

	// ==================== SHORTCUTS ====================

	/**
	 * Set fullscreen screenshot shortcut
	 * @param shortcut - Keyboard shortcut (e.g., "CommandOrControl+Shift+S")
	 */
	async setShortcut(shortcut: string): Promise<void> {
		return ipcRenderer.invoke('set-shortcut', shortcut);
	}

	/**
	 * Set area screenshot shortcut
	 * @param shortcut - Keyboard shortcut (e.g., "CommandOrControl+Shift+A")
	 */
	async setAreaShortcut(shortcut: string): Promise<void> {
		return ipcRenderer.invoke('set-area-shortcut', shortcut);
	}

	/**
	 * Set quick screenshot (clipboard) shortcut
	 * @param shortcut - Keyboard shortcut (e.g., "CommandOrControl+Shift+Q")
	 */
	async setQuickShortcut(shortcut: string): Promise<void> {
		return ipcRenderer.invoke('set-quick-shortcut', shortcut);
	}

	// ==================== SETTINGS ====================

	/**
	 * Set copy to clipboard preference
	 * @param enabled - Whether to auto-copy screenshots to clipboard
	 */
	async setCopyToClipboard(enabled: boolean): Promise<void> {
		return ipcRenderer.invoke('set-copy-to-clipboard', enabled);
	}

	/**
	 * Set sound enabled preference
	 * @param enabled - Whether to play sound on screenshot capture
	 */
	async setSoundEnabled(enabled: boolean): Promise<void> {
		return ipcRenderer.invoke('set-sound-enabled', enabled);
	}

	/**
	 * Set cursor in screenshots preference
	 * @param enabled - Whether to include cursor in screenshots
	 */
	async setCursorInScreenshots(enabled: boolean): Promise<void> {
		return ipcRenderer.invoke('set-cursor-in-screenshots', enabled);
	}

	// ==================== SCREENSHOT/DISPLAY ====================

	/**
	 * Trigger tray icon flash animation
	 */
	sendScreenshotFlash(): void {
		ipcRenderer.send('screenshot-flash');
	}

	/**
	 * Get all available displays (monitors)
	 * @returns Array of display information
	 */
	async getDisplays(): Promise<Display[]> {
		return ipcRenderer.invoke('get-displays');
	}

	/**
	 * Set active display for screenshots
	 * @param displayId - Display ID to use
	 */
	async setDisplay(displayId: number): Promise<void> {
		return ipcRenderer.invoke('set-display', displayId);
	}

	/**
	 * Open area selector overlay
	 */
	async openAreaSelector(): Promise<void> {
		return ipcRenderer.invoke('open-area-selector');
	}

	/**
	 * Save selected screenshot area
	 * @param area - Area coordinates or null to clear
	 */
	async saveSelectedArea(area: ScreenshotArea | null): Promise<void> {
		return ipcRenderer.invoke('save-selected-area', area);
	}

	/**
	 * Get saved screenshot area
	 * @returns Saved area or null
	 */
	async getSavedArea(): Promise<ScreenshotArea | null> {
		return ipcRenderer.invoke('get-saved-area');
	}

	/**
	 * Toggle use of saved area for screenshots
	 * @param enabled - Whether to use saved area
	 */
	async setUseSavedArea(enabled: boolean): Promise<void> {
		return ipcRenderer.invoke('set-use-saved-area', enabled);
	}

	// ==================== NOTES ====================

	/**
	 * Load notes from folder
	 * @param folder - Folder path
	 * @returns Response with notes data
	 */
	async loadNotes(folder: string): Promise<{
		success: boolean;
		data?: NotesData;
		error?: string;
	}> {
		return ipcRenderer.invoke('load-notes', folder);
	}

	/**
	 * Save notes to folder
	 * @param folder - Folder path
	 * @param notes - Notes data to save
	 */
	async saveNotes(folder: string, notes: NotesData): Promise<void> {
		return ipcRenderer.invoke('save-notes', folder, notes);
	}

	// ==================== PDF ====================

	/**
	 * Check if PDF file exists
	 * @param filename - PDF filename
	 * @returns Response with success and exists flags
	 */
	async checkPdfExists(filename: string): Promise<{
		success: boolean;
		exists?: boolean;
		error?: string;
	}> {
		return ipcRenderer.invoke('check-pdf-exists', { filename });
	}

	/**
	 * Show PDF exists confirmation dialog
	 * @param filename - PDF filename
	 * @returns Response with action (0=Replace, 1=New copy, 2=Cancel)
	 */
	async showPdfExistsDialog(filename: string): Promise<{
		success: boolean;
		action?: number;
		error?: string;
	}> {
		return ipcRenderer.invoke('show-pdf-exists-dialog', { filename });
	}

	/**
	 * Find next available filename for PDF
	 * @param baseFilename - Base filename to find next available
	 * @returns Response with new filename
	 */
	async findNextFilename(baseFilename: string): Promise<{
		success: boolean;
		filename?: string;
		error?: string;
	}> {
		return ipcRenderer.invoke('find-next-filename', { baseFilename });
	}

	/**
	 * Save PDF file
	 * @param params - Object with pdfData and filename
	 * @returns Response with success and filepath
	 */
	async savePdf(params: { pdfData: string; filename: string }): Promise<{
		success: boolean;
		filepath?: string;
		error?: string;
	}> {
		return ipcRenderer.invoke('save-pdf', params);
	}

	/**
	 * Show PDF saved success dialog
	 * @param filename - PDF filename
	 * @param filepath - Full path to saved PDF
	 * @returns Response with user action
	 */
	async showPdfSavedDialog(
		filename: string,
		filepath: string,
	): Promise<{ action: 'view' | 'ok' }> {
		return ipcRenderer.invoke('show-pdf-saved-dialog', { filename });
	}

	/**
	 * Open PDF in system viewer
	 * @param filepath - Full path to PDF file
	 * @returns Response with success
	 */
	async openPdf(filepath: string): Promise<{
		success: boolean;
		error?: string;
	}> {
		return ipcRenderer.invoke('open-pdf', filepath);
	}

	// ==================== FOLDER STRUCTURE (NEW) ====================

	/**
	 * Validate if header data is complete for SCREENSHOT
	 * testName (result) is NOT required for screenshots
	 * @param headerData - Header data to validate
	 * @returns Whether header is complete for screenshot
	 */
	async validateHeaderForScreenshot(
		headerData: HeaderData,
	): Promise<{ success: boolean; isComplete: boolean }> {
		return ipcRenderer.invoke('validate-header-for-screenshot', headerData);
	}

	/**
	 * Validate if header data is complete for PDF
	 * testName (result) IS required for PDF generation
	 * @param headerData - Header data to validate
	 * @returns Whether header is complete for PDF
	 */
	async validateHeaderComplete(
		headerData: HeaderData,
	): Promise<{ success: boolean; isComplete: boolean }> {
		return ipcRenderer.invoke('validate-header-complete', headerData);
	}

	/**
	 * Build folder path from header data without creating it
	 * @param rootFolder - Root folder path from settings
	 * @param headerData - Header data with test info
	 * @returns Constructed folder path or null if invalid
	 */
	async buildFolderPath(
		rootFolder: string,
		headerData: HeaderData,
	): Promise<{ success: boolean; path: string | null }> {
		return ipcRenderer.invoke('build-folder-path', rootFolder, headerData);
	}

	/**
	 * Create entire test folder structure
	 * Structure: rootFolder/month/testType/testCycle/testCase/
	 * @param rootFolder - Root folder path from settings
	 * @param headerData - Complete header data
	 * @returns Created folder path
	 */
	async createTestStructure(
		rootFolder: string,
		headerData: HeaderData,
	): Promise<{ success: boolean; path?: string; error?: string }> {
		return ipcRenderer.invoke('create-test-structure', rootFolder, headerData);
	}

	/**
	 * Detect which folder level changed between two headers
	 * @param oldHeader - Previous header data
	 * @param newHeader - New header data
	 * @param oldPath - Current folder path
	 * @returns Changed level info or null
	 */
	async detectChangedLevel(
		oldHeader: HeaderData,
		newHeader: HeaderData,
		oldPath: string,
	): Promise<{
		success: boolean;
		change: {
			level: 'month' | 'type' | 'cycle' | 'case' | null;
			oldName: string;
			newName: string;
		} | null;
	}> {
		return ipcRenderer.invoke(
			'detect-changed-level',
			oldHeader,
			newHeader,
			oldPath,
		);
	}

	/**
	 * Rename a specific folder level in the structure
	 * @param oldPath - Current folder path
	 * @param level - Which level to rename
	 * @param newName - New name for that level
	 * @returns New folder path
	 */
	async renameFolderLevel(
		oldPath: string,
		level: 'month' | 'type' | 'cycle' | 'case',
		newName: string,
	): Promise<{ success: boolean; path?: string; error?: string }> {
		return ipcRenderer.invoke('rename-folder-level', oldPath, level, newName);
	}

	/**
	 * Validate if a folder follows the expected test structure
	 * @param folderPath - Folder path to validate
	 * @returns Whether it's a valid test folder
	 */
	async isValidTestFolder(
		folderPath: string,
	): Promise<{ success: boolean; isValid: boolean }> {
		return ipcRenderer.invoke('is-valid-test-folder', folderPath);
	}

	/**
	 * Get current month folder name (MM-YYYY format)
	 * @returns Month folder name
	 */
	async getMonthFolderName(): Promise<{
		success: boolean;
		name: string;
	}> {
		return ipcRenderer.invoke('get-month-folder-name');
	}
}

/**
 * Singleton instance of IpcService
 * Import this in components/hooks instead of using ipcRenderer directly
 *
 * @example
 * import { ipcService } from '@/services/ipc-service';
 *
 * const images = await ipcService.getImages(folder);
 * await ipcService.saveHeaderData(folder, headerData);
 */
export const ipcService = new IpcService();

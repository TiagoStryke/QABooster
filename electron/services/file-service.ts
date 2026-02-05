import * as fs from 'fs';
import * as path from 'path';

/**
 * File system operations service
 */

/**
 * Checks if a file exists
 */
export function fileExists(filepath: string): boolean {
	return fs.existsSync(filepath);
}

/**
 * Reads image file as base64 data URL
 */
export function readImageAsBase64(filepath: string): string | null {
	try {
		const imageBuffer = fs.readFileSync(filepath);
		const base64 = imageBuffer.toString('base64');
		const ext = path.extname(filepath).toLowerCase();

		let mimeType = 'image/png';
		if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
		else if (ext === '.gif') mimeType = 'image/gif';
		else if (ext === '.webp') mimeType = 'image/webp';

		return `data:${mimeType};base64,${base64}`;
	} catch (error) {
		console.error('Error reading image:', error);
		return null;
	}
}

/**
 * Saves base64 image to file
 */
export function saveBase64Image(filepath: string, dataUrl: string): boolean {
	try {
		const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
		fs.writeFileSync(filepath, base64Data, 'base64');
		return true;
	} catch (error) {
		console.error('Error saving image:', error);
		return false;
	}
}

/**
 * Saves PDF from base64 data
 */
export function savePDF(filepath: string, pdfData: string): boolean {
	try {
		const base64Data = pdfData.split(',')[1];
		fs.writeFileSync(filepath, base64Data, 'base64');
		return true;
	} catch (error) {
		console.error('Error saving PDF:', error);
		return false;
	}
}

/**
 * Deletes a file
 */
export function deleteFile(filepath: string): boolean {
	try {
		if (fs.existsSync(filepath)) {
			fs.unlinkSync(filepath);
			return true;
		}
		return false;
	} catch (error) {
		console.error('Error deleting file:', error);
		return false;
	}
}

/**
 * Lists image files in a folder
 */
export function listImages(
	folderPath: string,
): Array<{ name: string; path: string }> {
	if (!fs.existsSync(folderPath)) {
		return [];
	}

	const files = fs.readdirSync(folderPath);
	const imageFiles = files.filter((file) =>
		/\.(png|jpg|jpeg|gif|webp)$/i.test(file),
	);

	return imageFiles.map((file) => ({
		name: file,
		path: path.join(folderPath, file),
	}));
}

/**
 * Saves JSON data to file
 */
export function saveJSON(filepath: string, data: any): boolean {
	try {
		fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
		return true;
	} catch (error) {
		console.error('Error saving JSON:', error);
		return false;
	}
}

/**
 * Loads JSON data from file
 */
export function loadJSON(filepath: string): any | null {
	try {
		if (!fs.existsSync(filepath)) {
			return null;
		}

		const data = fs.readFileSync(filepath, 'utf-8');
		const parsed = JSON.parse(data);

		// Validation: if parsed is string, file is corrupted
		if (typeof parsed === 'string') {
			fs.unlinkSync(filepath);
			return null;
		}

		return parsed;
	} catch (error) {
		console.error('Error loading JSON:', error);
		return null;
	}
}

/**
 * Creates a folder if it doesn't exist
 */
export function ensureFolder(folderPath: string): boolean {
	try {
		if (!fs.existsSync(folderPath)) {
			fs.mkdirSync(folderPath, { recursive: true });
		}
		return true;
	} catch (error) {
		console.error('Error creating folder:', error);
		return false;
	}
}

/**
 * Renames a folder
 */
export function renameFolder(oldPath: string, newPath: string): string | null {
	try {
		if (fs.existsSync(oldPath) && oldPath !== newPath) {
			fs.renameSync(oldPath, newPath);
			return newPath;
		}
		return oldPath;
	} catch (error) {
		console.error('Error renaming folder:', error);
		return null;
	}
}

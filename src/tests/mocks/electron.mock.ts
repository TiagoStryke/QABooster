import { vi } from 'vitest';

/**
 * Mock do Electron IPC Renderer
 * Simula todas as operações de IPC entre renderer e main process
 */
export const createMockIpcRenderer = () => ({
	invoke: vi.fn(),
	on: vi.fn(),
	send: vi.fn(),
	removeAllListeners: vi.fn(),
});

/**
 * Mock helpers para simular respostas do Electron
 */
export const mockElectronResponses = {
	// Folder operations
	selectFolder: (folderPath: string) => {
		return { canceled: false, filePaths: [folderPath] };
	},
	createFolder: (folderPath: string) => folderPath,
	getFolderImages: (images: any[]) => images,

	// Header data operations
	loadHeaderData: (data: any) => data,
	saveHeaderData: () => ({ success: true }),

	// Screenshot operations
	captureFullscreen: () => ({ success: true }),
	captureArea: () => ({ success: true }),

	// PDF operations
	savePDF: (filename: string) => ({
		success: true,
		filename,
		filepath: `/fake/path/${filename}`,
	}),

	// Settings operations
	saveShortcut: () => ({ success: true }),
	getDisplays: () => [
		{
			id: 0,
			label: 'Primary Display',
			bounds: { x: 0, y: 0, width: 1920, height: 1080 },
		},
	],
};

/**
 * Setup mock para IPC renderer em testes
 */
export const setupIpcMock = () => {
	const mockIpc = createMockIpcRenderer();
	global.ipcRenderer = mockIpc as any;
	return mockIpc;
};

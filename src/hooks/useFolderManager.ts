import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { HeaderData, LoadHeaderDataResponse } from '../interfaces';
import { ipcService } from '../services/ipc-service';

interface UseFolderManagerParams {
	setImages: (images: any[]) => void;
	headerData: HeaderData;
	setHeaderData: (data: HeaderData) => void;
}

interface UseFolderManagerReturn {
	currentFolder: string;
	setCurrentFolder: (folder: string) => void;
	currentFolderRef: RefObject<string>;
	isNewFolderRef: RefObject<boolean>;
	executePendingRename: () => Promise<boolean>;
	loadImages: () => Promise<void>;
	loadHeaderData: (folder: string) => Promise<void>;
	saveHeaderData: (folder: string, data: HeaderData) => Promise<void>;
	handleFolderChange: (folder: string, isNewFolder?: boolean) => Promise<void>;
	setPreserveHeaders: (preserve: boolean) => void;
}

/**
 * Manages folder operations with database-driven structure
 * Handles currentFolder state and folder operations
 */
export function useFolderManager({
	setImages,
	headerData,
	setHeaderData,
}: UseFolderManagerParams): UseFolderManagerReturn {
	const [currentFolder, setCurrentFolder] = useState<string>('');
	const currentFolderRef = useRef<string>('');
	const isNewFolderRef = useRef(false);
	const preserveHeadersRef = useRef(false); // Flag to preserve headers when folder created via shortcut

	// Keep ref synced with state
	useEffect(() => {
		currentFolderRef.current = currentFolder;
	}, [currentFolder]);

	// Function to preserve headers on next folder change (used by shortcut flow)
	const setPreserveHeaders = useCallback((preserve: boolean) => {
		preserveHeadersRef.current = preserve;
	}, []);

	/**
	 * Execute pending operations before navigation
	 * Simplified - just saves header data
	 * Returns true if success
	 */
	const executePendingRename = useCallback(async (): Promise<boolean> => {
		// If no folder, just return success
		if (!currentFolder) {
			return true;
		}

		try {
			// Save current header data
			await ipcService.saveHeaderData(currentFolder, headerData);
			return true;
		} catch (error) {
			console.error('Error saving header data:', error);
			return false;
		}
	}, [currentFolder, headerData]);

	const loadImages = useCallback(async () => {
		if (currentFolder) {
			const imgs = await ipcService.getImages(currentFolder);
			setImages(imgs);
		}
	}, [currentFolder, setImages]);

	const loadHeaderData = useCallback(
		async (folder: string) => {
			if (folder) {
				const result: LoadHeaderDataResponse =
					await ipcService.loadHeaderData(folder);

				// Check if result is valid and has data field
				if (result.success && result.data) {
					// Ensure all fields are strings (never undefined)
					const loadedData: HeaderData = {
						testName: result.data.testName || '',
						system: result.data.system || '',
						testCycle: result.data.testCycle || '',
						testCase: result.data.testCase || '',
						testType: result.data.testType || '',
						testTypeValue: result.data.testTypeValue || '',
					};
					setHeaderData(loadedData);
				}
			}
		},
		[setHeaderData],
	);

	const saveHeaderData = useCallback(
		async (folder: string, data: HeaderData) => {
			if (folder && data.testCase) {
				await ipcService.saveHeaderData(folder, data);
			}
		},
		[],
	);

	const handleFolderChange = useCallback(
		async (folder: string, isNewFolder = false) => {
			// Save data from previous folder if exists
			if (currentFolder && headerData.testCase) {
				await saveHeaderData(currentFolder, headerData);
			}

			// Get testId from database by folderPath
			// (Cannot extract from folder name anymore since format changed)
			let testId: string | null = null;
			if (folder) {
				try {
					const allTests = await ipcService.getAllTests();
					const test = allTests.find((t) => t.folderPath === folder);
					testId = test?.id || null;
				} catch (error) {
					console.error('[useFolderManager] Error finding testId:', error);
				}
			}

			// Sync with backend
			if (folder) {
				await ipcService.setCurrentTest(testId, folder);
			}

			// Mark if it's a new folder
			isNewFolderRef.current = isNewFolder;

			// Change folder - useEffect will handle header
			setCurrentFolder(folder);
		},
		[currentFolder, headerData, saveHeaderData],
	);

	// Auto-save headerData quando mudar (debounced)
	useEffect(() => {
		if (!currentFolder || !headerData.testCase) return;

		const timeoutId = setTimeout(() => {
			saveHeaderData(currentFolder, headerData);
		}, 1000);

		return () => clearTimeout(timeoutId);
	}, [currentFolder, headerData, saveHeaderData]);

	// Load images and header when folder changes
	useEffect(() => {
		// Check if headers should be preserved (folder created via shortcut)
		if (preserveHeadersRef.current) {
			preserveHeadersRef.current = false; // Reset flag
			if (currentFolder) {
				loadImages(); // Still load images
			}
			return;
		}

		if (!currentFolder) {
			setImages([]);
			setHeaderData({
				testName: '',
				system: '',
				testCycle: '',
				testCase: '',
				testType: '',
				testTypeValue: '',
			});
			return;
		}

		// Load images
		loadImages();

		// If it's a NEW folder, DON'T load header (wait for user input)
		// Just clear the header
		if (isNewFolderRef.current) {
			isNewFolderRef.current = false;
			setHeaderData({
				testName: '',
				system: '',
				testCycle: '',
				testCase: '',
				testType: '',
				testTypeValue: '',
			});
			return;
		}

		// Otherwise, load header (if exists)
		console.log(
			'[useFolderManager] 📥 Loading header data from:',
			currentFolder,
		);
		const folderToLoad = currentFolder;
		loadHeaderData(folderToLoad);
	}, [currentFolder, loadHeaderData, loadImages, setHeaderData, setImages]);

	return {
		currentFolder,
		setCurrentFolder,
		currentFolderRef,
		isNewFolderRef,
		loadImages,
		loadHeaderData,
		saveHeaderData,
		handleFolderChange,
		executePendingRename,
		setPreserveHeaders,
	};
}

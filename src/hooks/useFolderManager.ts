import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { HeaderData } from '../interfaces';
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
	isRenamingRef: RefObject<boolean>;
	isNewFolderRef: RefObject<boolean>;
	previousHeaderRef: RefObject<HeaderData | null>;
	loadImages: () => Promise<void>;
	loadHeaderData: (folder: string) => Promise<void>;
	saveHeaderData: (folder: string, data: HeaderData) => Promise<void>;
	handleFolderChange: (folder: string, isNewFolder?: boolean) => Promise<void>;
}

/**
 * Manages folder operations with new organizational structure
 * Handles currentFolder, selective folder renaming, and folder state
 * NEW: Supports rootFolder/month/testType/cycle/case structure
 */
export function useFolderManager({
	setImages,
	headerData,
	setHeaderData,
}: UseFolderManagerParams): UseFolderManagerReturn {
	const [currentFolder, setCurrentFolder] = useState<string>('');
	const currentFolderRef = useRef<string>('');
	const isRenamingRef = useRef(false);
	const isNewFolderRef = useRef(false);
	const previousHeaderRef = useRef<HeaderData | null>(null);

	// Keep ref synced with state
	useEffect(() => {
		currentFolderRef.current = currentFolder;
	}, [currentFolder]);

	// Selective folder renaming when specific fields change
	useEffect(() => {
		const handleSelectiveRename = async () => {
			// Don't rename if no folder or no previous header
			if (!currentFolder || !previousHeaderRef.current) return;

			// Skip if we're currently renaming (avoid loops)
			if (isRenamingRef.current) return;

			// Detect which level changed
			const result = await ipcService.detectChangedLevel(
				previousHeaderRef.current,
				headerData,
				currentFolder,
			);

			if (!result.success || !result.change) return;

			const { level, newName } = result.change;
			if (!level || !newName) return;

			// Mark that we're renaming
			isRenamingRef.current = true;

			// Save header data BEFORE renaming
			await ipcService.saveHeaderData(currentFolder, headerData);

			// Rename the specific folder level
			const renameResult = await ipcService.renameFolderLevel(
				currentFolder,
				level,
				newName.trim(),
			);

			if (renameResult.success && renameResult.path) {
				// Update currentFolder with new path
				setCurrentFolder(renameResult.path);
				// Update previousHeader to current
				previousHeaderRef.current = { ...headerData };
			}

			// Reset renaming flag
			isRenamingRef.current = false;
		};

		// Debounce 500ms to avoid multiple renames while typing
		const timeoutId = setTimeout(() => {
			handleSelectiveRename();
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [
		headerData.testType,
		headerData.testTypeValue,
		headerData.testCycle,
		headerData.testCase,
		currentFolder,
		headerData,
	]);

	// Load images and header when folder changes
	useEffect(() => {
		if (!currentFolder) {
			setImages([]);
			return;
		}

		// Load images
		loadImages();

		// If renaming, don't do anything with header
		if (isRenamingRef.current) {
			isRenamingRef.current = false;
			return;
		}

		// Clear header first
		setHeaderData({
			testName: '',
			system: '',
			testCycle: '',
			testCase: '',
			testType: '',
			testTypeValue: '',
		});

		// If it's a NEW folder, DON'T load header (wait for user input)
		if (isNewFolderRef.current) {
			isNewFolderRef.current = false;
			// Reset previousHeader
			previousHeaderRef.current = null;
			return;
		}

		// Otherwise, load header (if exists)
		const folderToLoad = currentFolder;
		setTimeout(() => {
			loadHeaderData(folderToLoad);
		}, 0);
	}, [currentFolder]);

	const loadImages = useCallback(async () => {
		if (currentFolder) {
			const imgs = await ipcService.getImages(currentFolder);
			setImages(imgs);
		}
	}, [currentFolder, setImages]);

	const loadHeaderData = useCallback(
		async (folder: string) => {
			if (folder) {
				const result = await ipcService.loadHeaderData(folder);
				if (result) {
					// BUG FIX: Garante que todos os campos sejam strings (nunca undefined)
					const loadedData: HeaderData = {
						testName: result.testName || '',
						system: result.system || '',
						testCycle: result.testCycle || '',
						testCase: result.testCase || '',
						testType: result.testType || '',
						testTypeValue: result.testTypeValue || '',
					};
					setHeaderData(loadedData);
					// Update previousHeader to track changes
					previousHeaderRef.current = { ...loadedData };
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

			// Mark if it's a new folder
			isNewFolderRef.current = isNewFolder;

			// Change folder - useEffect will handle header
			setCurrentFolder(folder);
		},
		[currentFolder, headerData, saveHeaderData],
	);

	return {
		currentFolder,
		setCurrentFolder,
		currentFolderRef,
		isRenamingRef,
		isNewFolderRef,
		previousHeaderRef,
		loadImages,
		loadHeaderData,
		saveHeaderData,
		handleFolderChange,
	};
}

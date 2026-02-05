import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { HeaderData } from '../interfaces';

const { ipcRenderer } = window.require('electron');

interface UseFolderManagerParams {
	setImages: (images: any[]) => void;
	headerData: HeaderData;
	setHeaderData: (data: HeaderData) => void;
	executorRef: RefObject<string>;
}

interface UseFolderManagerReturn {
	currentFolder: string;
	setCurrentFolder: (folder: string) => void;
	currentFolderRef: RefObject<string>;
	isRenamingRef: RefObject<boolean>;
	isNewFolderRef: RefObject<boolean>;
	loadImages: () => Promise<void>;
	loadHeaderData: (folder: string) => Promise<void>;
	saveHeaderData: (folder: string, data: HeaderData) => Promise<void>;
	handleFolderChange: (folder: string, isNewFolder?: boolean) => Promise<void>;
}

/**
 * Manages folder operations, auto-rename, and folder state
 * Handles currentFolder, automatic folder renaming based on test case,
 * and synchronization between folder state and header data
 */
export function useFolderManager({
	setImages,
	headerData,
	setHeaderData,
	executorRef,
}: UseFolderManagerParams): UseFolderManagerReturn {
	const [currentFolder, setCurrentFolder] = useState<string>('');
	const currentFolderRef = useRef<string>('');
	const isRenamingRef = useRef(false);
	const isNewFolderRef = useRef(false);

	// Keep ref synced with state
	useEffect(() => {
		currentFolderRef.current = currentFolder;
	}, [currentFolder]);

	// Auto-rename folder when test case is filled
	useEffect(() => {
		const renameFolderIfNeeded = async () => {
			// Don't rename if no data
			if (!currentFolder || !headerData.testCase) return;

			// Extract current folder name
			const folderName = currentFolder.split('/').pop() || '';

			// Check if current folder is date only (DD-MM-YYYY format)
			// or already has date_case pattern but with different case
			const dateOnlyPattern = /^\d{2}-\d{2}-\d{4}$/;
			const dateWithCasePattern = /^(\d{2}-\d{2}-\d{4})_(.+)$/;

			let shouldRename = false;
			let dateStr = '';

			if (dateOnlyPattern.test(folderName)) {
				// Folder with date only (newly created)
				dateStr = folderName;
				shouldRename = true;
			} else if (dateWithCasePattern.test(folderName)) {
				// Folder already has date_case format, check if case changed
				const match = folderName.match(dateWithCasePattern);
				if (match) {
					dateStr = match[1];
					const currentCase = match[2];
					// Only rename if test case changed AND not loading
					shouldRename = currentCase !== headerData.testCase;
				}
			}

			if (shouldRename && dateStr) {
				// Mark that we're renaming
				isRenamingRef.current = true;

				// Save header data BEFORE renaming
				await ipcRenderer.invoke('save-header-data', currentFolder, headerData);

				// Create new name: Date_test-case
				const newFolderName = `${dateStr}_${headerData.testCase}`;

				// Rename folder via IPC
				const newPath = await ipcRenderer.invoke(
					'rename-folder',
					currentFolder,
					newFolderName,
				);
				if (newPath) {
					// Update currentFolder without triggering loadHeaderData
					setCurrentFolder(newPath);
					// DON'T reset isRenamingRef here - let useEffect do it
				}
			}
		};

		// Debounce 500ms to avoid multiple renames while typing
		const timeoutId = setTimeout(() => {
			renameFolderIfNeeded();
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [headerData.testCase, currentFolder, headerData]);

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

		// Clear header first (keep only executor)
		const savedExecutor = executorRef.current;
		setHeaderData({
			testName: '',
			executor: savedExecutor || '',
			system: '',
			testCycle: '',
			testCase: '',
		});

		// If it's a NEW folder, DON'T load header
		if (isNewFolderRef.current) {
			isNewFolderRef.current = false;
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
			const imgs = await ipcRenderer.invoke('get-images', currentFolder);
			setImages(imgs);
		}
	}, [currentFolder, setImages]);

	const loadHeaderData = useCallback(
		async (folder: string) => {
			if (folder) {
				const result = await ipcRenderer.invoke('load-header-data', folder);
				if (result.success && result.data) {
					setHeaderData(result.data);
				}
			}
		},
		[setHeaderData],
	);

	const saveHeaderData = useCallback(
		async (folder: string, data: HeaderData) => {
			if (folder && data.testCase) {
				await ipcRenderer.invoke('save-header-data', folder, data);
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
		loadImages,
		loadHeaderData,
		saveHeaderData,
		handleFolderChange,
	};
}

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
	hasPendingChanges: () => boolean;
	executePendingRename: () => Promise<boolean>;
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

	/**
	 * Verifica se há mudanças pendentes no header que afetariam a estrutura de pastas
	 */
	const hasPendingChanges = useCallback((): boolean => {
		if (!currentFolder || !previousHeaderRef.current) return false;

		const prev = previousHeaderRef.current;
		const curr = headerData;

		return (
			prev.testType !== curr.testType ||
			prev.testTypeValue !== curr.testTypeValue ||
			prev.testCycle !== curr.testCycle ||
			prev.testCase !== curr.testCase
		);
	}, [currentFolder, headerData]);

	/**
	 * Executa rename pendente se houver mudanças
	 * Retorna true se sucesso ou se não havia mudanças, false se erro
	 */
	const executePendingRename = useCallback(async (): Promise<boolean> => {
		// Se não tem pasta ou mudanças, apenas retorna sucesso
		if (!currentFolder || !hasPendingChanges()) {
			// Atualiza previousHeader even if no changes
			if (currentFolder) {
				previousHeaderRef.current = { ...headerData };
			}
			return true;
		}

		// Skip if currently renaming
		if (isRenamingRef.current) return false;

		try {
			// Detecta qual nível mudou
			const result = await ipcService.detectChangedLevel(
				previousHeaderRef.current!,
				headerData,
				currentFolder,
			);

			if (!result.success || !result.change) {
				// Nenhuma mudança detectada, considera sucesso
				previousHeaderRef.current = { ...headerData };
				return true;
			}

			const { level, newName } = result.change;
			if (!level || !newName) {
				previousHeaderRef.current = { ...headerData };
				return true;
			}

			// Marca que está renomeando
			isRenamingRef.current = true;

			// Salva header ANTES de renomear
			await ipcService.saveHeaderData(currentFolder, headerData);

			// Renomeia o nível específico
			const renameResult = await ipcService.renameFolderLevel(
				currentFolder,
				level,
				newName.trim(),
			);

			if (renameResult.success && renameResult.path) {
				// Atualiza currentFolder com novo caminho
				setCurrentFolder(renameResult.path);
				// Atualiza previousHeader
				previousHeaderRef.current = { ...headerData };
				isRenamingRef.current = false;
				return true;
			}

			isRenamingRef.current = false;
			return false;
		} catch (error) {
			console.error('Error executing pending rename:', error);
			isRenamingRef.current = false;
			return false;
		}
	}, [currentFolder, headerData, hasPendingChanges]);

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
		hasPendingChanges,
		executePendingRename,
	};
}

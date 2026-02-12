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
	isRenamingRef: RefObject<boolean>;
	isNewFolderRef: RefObject<boolean>;
	previousHeaderRef: RefObject<HeaderData | null>;
	hasPendingChanges: () => boolean;
	executePendingRename: () => Promise<boolean>;
	loadImages: () => Promise<void>;
	loadHeaderData: (folder: string) => Promise<void>;
	saveHeaderData: (folder: string, data: HeaderData) => Promise<void>;
	handleFolderChange: (folder: string, isNewFolder?: boolean) => Promise<void>;
	setPreserveHeaders: (preserve: boolean) => void;
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
	const preserveHeadersRef = useRef(false); // Flag to preserve headers when folder created via shortcut

	// Keep ref synced with state
	useEffect(() => {
		currentFolderRef.current = currentFolder;
	}, [currentFolder]);

	// Function to preserve headers on next folder change (used by shortcut flow)
	const setPreserveHeaders = useCallback((preserve: boolean) => {
		preserveHeadersRef.current = preserve;
		console.log(
			'[useFolderManager] 🔒 Preserve headers flag set to:',
			preserve,
		);
	}, []);

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

	const loadImages = useCallback(async () => {
		if (currentFolder) {
			const imgs = await ipcService.getImages(currentFolder);
			setImages(imgs);
		}
	}, [currentFolder, setImages]);

	const loadHeaderData = useCallback(
		async (folder: string) => {
			console.log(
				'[useFolderManager] 📥 loadHeaderData called for folder:',
				folder,
			);
			if (folder) {
				const result: LoadHeaderDataResponse =
					await ipcService.loadHeaderData(folder);
				console.log('[useFolderManager] 📥 loadHeaderData result:', result);

				// Check if result is valid and has data field
				if (result.success && result.data) {
					// BUG FIX: Garante que todos os campos sejam strings (nunca undefined)
					const loadedData: HeaderData = {
						testName: result.data.testName || '',
						system: result.data.system || '',
						testCycle: result.data.testCycle || '',
						testCase: result.data.testCase || '',
						testType: result.data.testType || '',
						testTypeValue: result.data.testTypeValue || '',
					};
					console.log('[useFolderManager] ✅ Setting header data:', loadedData);
					setHeaderData(loadedData);
					// Update previousHeader to track changes
					previousHeaderRef.current = { ...loadedData };
				} else {
					console.log(
						'[useFolderManager] ❌ No header data found:',
						result.error || 'No data field in response',
					);
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
			console.log('[useFolderManager] 📁 handleFolderChange called:', {
				folder,
				isNewFolder,
				currentFolder,
			});

			// Save data from previous folder if exists
			if (currentFolder && headerData.testCase) {
				console.log('[useFolderManager] 💾 Saving previous folder data...');
				await saveHeaderData(currentFolder, headerData);
			}

			// Mark if it's a new folder
			console.log('[useFolderManager] Setting isNewFolderRef to:', isNewFolder);
			isNewFolderRef.current = isNewFolder;

			// Change folder - useEffect will handle header
			console.log('[useFolderManager] Calling setCurrentFolder with:', folder);
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
		console.log(
			'[useFolderManager] 🔄 useEffect triggered - currentFolder:',
			currentFolder,
		);
		console.log('[useFolderManager] Flags:', {
			preserveHeaders: preserveHeadersRef.current,
			isRenaming: isRenamingRef.current,
			isNewFolder: isNewFolderRef.current,
		});

		// Check if headers should be preserved (folder created via shortcut)
		if (preserveHeadersRef.current) {
			console.log(
				'[useFolderManager] 🔒 Preserving headers - skipping clear/load',
			);
			preserveHeadersRef.current = false; // Reset flag
			if (currentFolder) {
				loadImages(); // Still load images
			}
			return;
		}

		if (!currentFolder) {
			console.log('[useFolderManager] 🧹 No folder - clearing everything');
			setImages([]);
			setHeaderData({
				testName: '',
				system: '',
				testCycle: '',
				testCase: '',
				testType: '',
				testTypeValue: '',
			});
			previousHeaderRef.current = null;
			return;
		}

		// Load images
		console.log('[useFolderManager] 📂 Loading images...');
		loadImages();

		// If renaming, don't do anything with header
		if (isRenamingRef.current) {
			console.log('[useFolderManager] 🔄 Is renaming - skipping header load');
			isRenamingRef.current = false;
			return;
		}

		// If it's a NEW folder, DON'T load header (wait for user input)
		// Just clear the header
		if (isNewFolderRef.current) {
			console.log('[useFolderManager] 🆕 New folder - clearing headers');
			isNewFolderRef.current = false;
			setHeaderData({
				testName: '',
				system: '',
				testCycle: '',
				testCase: '',
				testType: '',
				testTypeValue: '',
			});
			previousHeaderRef.current = null;
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
		isRenamingRef,
		isNewFolderRef,
		previousHeaderRef,
		loadImages,
		loadHeaderData,
		saveHeaderData,
		handleFolderChange,
		hasPendingChanges,
		executePendingRename,
		setPreserveHeaders, // Function to preserve headers when folder created via shortcut
	};
}

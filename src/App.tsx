import { useEffect, useState } from 'react';
import MainLayout from './components/MainLayout';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { useAppSettings } from './hooks/useAppSettings';
import { useFolderManager } from './hooks/useFolderManager';
import { useHeaderData } from './hooks/useHeaderData';
import { useImageManager } from './hooks/useImageManager';
import { useScreenshotListeners } from './hooks/useScreenshotListeners';
import { useShortcutSync } from './hooks/useShortcutSync';
import { useThemeManager } from './hooks/useThemeManager';
import { ipcService } from './services/ipc-service';

function App() {
	const { t } = useLanguage();
	const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
	const { settings } = useAppSettings();

	// Initialize theme and shortcuts
	useThemeManager();
	useShortcutSync();

	// Header data management (needs currentFolder, but we'll update it via effect)
	const { headerData, setHeaderData, resetHeaderData } = useHeaderData({
		currentFolder: '',
	});

	// Image management (temporary setImages, will be replaced)
	const {
		images,
		setImages,
		selectedImage,
		showEditor,
		handleImageSelect,
		handleImageDelete,
		handleImageReorder,
		handleImagePreview,
		handleCloseEditor,
		handleSaveEdited,
		resetImages,
	} = useImageManager({
		loadImages: async () => {},
	});

	// Folder management
	const {
		currentFolder,
		setCurrentFolder,
		currentFolderRef,
		loadImages,
		loadHeaderData,
		saveHeaderData,
		handleFolderChange,
		hasPendingChanges,
		executePendingRename,
		setPreserveHeaders, // Function to preserve headers when folder created via shortcut
	} = useFolderManager({ setImages, headerData, setHeaderData });

	// Screenshot event listeners
	useScreenshotListeners({
		currentFolderRef,
		setCurrentFolder,
		setImages,
		t,
	});

	// Listen for folder created from shortcut (keeps headers)
	useEffect(() => {
		const handleFolderCreatedFromShortcut = ((event: CustomEvent) => {
			const { path } = event.detail;
			console.log('[APP] 🎉 folder-created-from-shortcut event:', path);
			console.log(
				'[APP] 🔒 Setting preserve headers flag before updating folder',
			);
			// Set flag to preserve headers BEFORE calling setCurrentFolder
			setPreserveHeaders(true);
			// Now update folder (useEffect will skip header clearing)
			setCurrentFolder(path);
			// Load images for the new folder
			if (path) {
				ipcService.getImages(path).then(setImages);
			}
		}) as EventListener;

		window.addEventListener(
			'folder-created-from-shortcut',
			handleFolderCreatedFromShortcut,
		);

		return () => {
			window.removeEventListener(
				'folder-created-from-shortcut',
				handleFolderCreatedFromShortcut,
			);
		};
	}, [setCurrentFolder, setImages]);

	// Execute pending rename before window closes
	useEffect(() => {
		const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
			if (hasPendingChanges()) {
				// Execute pending rename
				await executePendingRename();

				// Save header data if there's a current folder
				if (currentFolder) {
					await saveHeaderData(currentFolder, headerData);
				}
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, [
		hasPendingChanges,
		executePendingRename,
		currentFolder,
		headerData,
		saveHeaderData,
	]);

	const handleNewTest = async () => {
		const hasHeaderData =
			headerData.testName ||
			headerData.system ||
			headerData.testCycle ||
			headerData.testCase ||
			headerData.testType ||
			headerData.testTypeValue;

		const hasImages = images.length > 0;

		// Se tem pasta (teste em andamento), salva antes de limpar
		if (currentFolder && hasHeaderData) {
			if (!confirm(t('confirmNewTest'))) return;

			// Execute pending rename BEFORE saving
			await executePendingRename();

			saveHeaderData(currentFolder, headerData);
		}
		// Se não tem pasta mas tem dados, pergunta se quer perder
		else if (hasHeaderData || hasImages) {
			if (!confirm(t('confirmNewTestLoseData'))) return;
		}
		// Se está tudo vazio, apenas limpa (sem confirmação)

		// Reset everything
		resetHeaderData();
		resetImages();
		setCurrentFolder('');
	};

	// Wrapper for handleSaveEdited to execute pending rename before saving
	const handleSaveEditedWithRename = async (dataUrl: string) => {
		// Execute pending rename BEFORE saving edited image
		await executePendingRename();

		// Call original handleSaveEdited
		await handleSaveEdited(dataUrl);
	};

	return (
		<MainLayout
			headerData={headerData}
			setHeaderData={setHeaderData}
			currentFolder={currentFolder}
			images={images}
			onSaveHeaderData={() => saveHeaderData(currentFolder, headerData)}
			onNewTest={handleNewTest}
			executePendingRename={executePendingRename}
			onFolderChange={handleFolderChange}
			selectedImage={selectedImage}
			showEditor={showEditor}
			isNotesPanelOpen={isNotesPanelOpen}
			setIsNotesPanelOpen={setIsNotesPanelOpen}
			handleImageSelect={handleImageSelect}
			handleImageDelete={(image) =>
				handleImageDelete(image, t('confirmDeleteImage'))
			}
			handleImagePreview={handleImagePreview}
			handleImageReorder={handleImageReorder}
			handleCloseEditor={handleCloseEditor}
			handleSaveEdited={handleSaveEditedWithRename}
		/>
	);
}

export default function AppWithProviders() {
	return (
		<LanguageProvider>
			<App />
		</LanguageProvider>
	);
}

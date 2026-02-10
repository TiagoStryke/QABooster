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

	// Image management (needs loadImages, but we'll get it from folder manager)
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
	} = useImageManager({ loadImages: async () => {} });

	// Folder management
	const {
		currentFolder,
		setCurrentFolder,
		currentFolderRef,
		loadImages,
		loadHeaderData,
		saveHeaderData,
		handleFolderChange,
	} = useFolderManager({ setImages, headerData, setHeaderData });

	// Screenshot event listeners
	useScreenshotListeners({ currentFolderRef, setImages, t });

	// Auto-create folder structure when header is complete
	useEffect(() => {
		const createStructureIfNeeded = async () => {
			// Only create if:
			// 1. No current folder
			// 2. Root folder is configured
			// 3. Header is complete
			if (currentFolder) return;
			if (!settings.rootFolder) return;

			// Validate header is complete
			const validation = await ipcService.validateHeaderComplete(headerData);
			if (!validation.success || !validation.isComplete) return;

			// Create folder structure
			const result = await ipcService.createTestStructure(
				settings.rootFolder,
				headerData,
			);

			if (result.success && result.path) {
				// Set the new folder
				setCurrentFolder(result.path);
			}
		};

		// Debounce to avoid creating while user is still typing
		const timeoutId = setTimeout(() => {
			createStructureIfNeeded();
		}, 1000);

		return () => clearTimeout(timeoutId);
	}, [headerData, currentFolder, settings.rootFolder, setCurrentFolder]);

	const handleNewTest = () => {
		const hasData =
			headerData.testName ||
			headerData.system ||
			headerData.testCycle ||
			headerData.testCase ||
			headerData.testType ||
			headerData.testTypeValue;

		if (currentFolder && hasData) {
			if (!confirm(t('confirmNewTest'))) return;
			saveHeaderData(currentFolder, headerData);
		} else if (hasData || images.length > 0) {
			if (!confirm(t('confirmNewTestLoseData'))) return;
		}

		// Reset everything
		resetHeaderData();
		resetImages();
		setCurrentFolder('');
	};

	return (
		<MainLayout
			headerData={headerData}
			setHeaderData={setHeaderData}
			currentFolder={currentFolder}
			images={images}
			onSaveHeaderData={() => saveHeaderData(currentFolder, headerData)}
			onNewTest={handleNewTest}
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
			handleSaveEdited={handleSaveEdited}
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

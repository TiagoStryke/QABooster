import { useState } from 'react';
import MainLayout from './components/MainLayout';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { useFolderManager } from './hooks/useFolderManager';
import { useHeaderData } from './hooks/useHeaderData';
import { useImageManager } from './hooks/useImageManager';
import { useScreenshotListeners } from './hooks/useScreenshotListeners';
import { useShortcutSync } from './hooks/useShortcutSync';
import { useThemeManager } from './hooks/useThemeManager';

const { ipcRenderer } = window.require('electron');

function App() {
	const { t } = useLanguage();
	const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);

	// Initialize theme and shortcuts
	useThemeManager();
	useShortcutSync();

	// Header data management (needs currentFolder, but we'll update it via effect)
	const { headerData, setHeaderData, executorRef, resetHeaderData } =
		useHeaderData({
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
	} = useFolderManager({ setImages, headerData, setHeaderData, executorRef });

	// Screenshot event listeners
	useScreenshotListeners({ currentFolderRef, setImages, t });

	const handleNewTest = () => {
		const hasData =
			headerData.testName ||
			headerData.system ||
			headerData.testCycle ||
			headerData.testCase;

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

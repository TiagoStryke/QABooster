import { useEffect, useRef, useState } from 'react';
import MainLayout from './components/MainLayout';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { useFolderManager } from './hooks/useFolderManager';
import { useScreenshotListeners } from './hooks/useScreenshotListeners';
import { useShortcutSync } from './hooks/useShortcutSync';
import { useThemeManager } from './hooks/useThemeManager';
import { HeaderData, ImageData } from './interfaces';

const { ipcRenderer } = window.require('electron');

function App() {
	const { t } = useLanguage();
	const [images, setImages] = useState<ImageData[]>([]);
	const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
	const [headerData, setHeaderData] = useState<HeaderData>({
		testName: '',
		executor: localStorage.getItem('qabooster-executor') || '',
		system: '',
		testCycle: '',
		testCase: '',
	});
	const [showEditor, setShowEditor] = useState(false);
	const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
	const executorRef = useRef(localStorage.getItem('qabooster-executor') || '');

	// Initialize theme and shortcuts
	useThemeManager();
	useShortcutSync();

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

	// Save executor to localStorage when it changes
	useEffect(() => {
		if (headerData.executor) {
			localStorage.setItem('qabooster-executor', headerData.executor);
			executorRef.current = headerData.executor;
		}
	}, [headerData.executor]);

	// Auto-save headerData when it changes (with debounce)
	useEffect(() => {
		if (!currentFolder) return;

		const folderToSave = currentFolder;
		const dataToSave = headerData;

		const timeoutId = setTimeout(() => {
			if (folderToSave && dataToSave.testCase) {
				ipcRenderer.invoke('save-header-data', folderToSave, dataToSave);
			}
		}, 1000);

		return () => clearTimeout(timeoutId);
	}, [headerData, currentFolder]);

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

		// Limpa TUDO
		const savedExecutor = executorRef.current;
		setHeaderData({
			testName: '',
			executor: savedExecutor,
			system: '',
			testCycle: '',
			testCase: '',
		});
		setImages([]);
		setSelectedImage(null);
		setShowEditor(false);
		setCurrentFolder('');
	};

	const handleImageSelect = (image: ImageData) => {
		setSelectedImage(image);
		setShowEditor(true);
	};

	const handleImageDelete = async (image: ImageData) => {
		if (confirm(`${t('confirmDeleteImage')} ${image.name}?`)) {
			await ipcRenderer.invoke('delete-image', image.path);
			loadImages();
			if (selectedImage?.path === image.path) {
				setSelectedImage(null);
				setShowEditor(false);
			}
		}
	};

	const handleImageReorder = (newOrder: ImageData[]) => {
		setImages(newOrder);
	};

	const handleImagePreview = async (image: ImageData) => {
		await ipcRenderer.invoke('open-image-preview', image.path);
	};

	const handleCloseEditor = () => {
		setShowEditor(false);
		setSelectedImage(null);
	};

	const handleSaveEdited = async (dataUrl: string) => {
		if (selectedImage) {
			await ipcRenderer.invoke('save-image', {
				filepath: selectedImage.path,
				dataUrl,
			});

			// Force thumbnail refresh by updating timestamp
			setImages((prevImages) =>
				prevImages.map((img) =>
					img.path === selectedImage.path
						? { ...img, timestamp: Date.now() }
						: img,
				),
			);

			loadImages();
		}
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
			handleImageDelete={handleImageDelete}
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

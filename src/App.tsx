import { useEffect, useRef, useState } from 'react';
import MainLayout from './components/MainLayout';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { useThemeManager } from './hooks/useThemeManager';
import { useShortcutSync } from './hooks/useShortcutSync';
import { useScreenshotListeners } from './hooks/useScreenshotListeners';
import { HeaderData, ImageData } from './interfaces';

const { ipcRenderer } = window.require('electron');

function App() {
	const { t } = useLanguage();
	const [currentFolder, setCurrentFolder] = useState<string>('');
	const currentFolderRef = useRef<string>('');
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
	const isRenamingRef = useRef(false);
	const isNewFolderRef = useRef(false); // Flag para indicar pasta NOVA (não deve carregar header)
	const executorRef = useRef(localStorage.getItem('qabooster-executor') || ''); // Ref para evitar dependência de headerData

	// Initialize theme and shortcuts
	useThemeManager();
	useShortcutSync();

	// Screenshot event listeners
	useScreenshotListeners({ currentFolderRef, setImages, t });

	// Mantém ref sincronizado com state
	useEffect(() => {
		currentFolderRef.current = currentFolder;
	}, [currentFolder]);

	// Salvar executor no localStorage sempre que mudar
	useEffect(() => {
		if (headerData.executor) {
			localStorage.setItem('qabooster-executor', headerData.executor);
			executorRef.current = headerData.executor; // Mantém ref sincronizado
		}
	}, [headerData.executor]);

	// Auto-save headerData quando mudar (com debounce)
	useEffect(() => {
		if (!currentFolder) return;

		// Captura os valores atuais no momento do agendamento
		const folderToSave = currentFolder;
		const dataToSave = headerData;

		const timeoutId = setTimeout(() => {
			// Salva na pasta capturada, não na pasta atual
			if (folderToSave && dataToSave.testCase) {
				ipcRenderer.invoke('save-header-data', folderToSave, dataToSave);
			}
		}, 1000); // Salva 1 segundo após parar de digitar

		return () => clearTimeout(timeoutId);
	}, [headerData, currentFolder]);

	// Renomear pasta quando o caso de teste é preenchido
	useEffect(() => {
		const renameFolderIfNeeded = async () => {
			// NÃO renomeia se não tem dados
			if (!currentFolder || !headerData.testCase) return;

			// Extrai o nome da pasta atual
			const folderName = currentFolder.split('/').pop() || '';

			// Verifica se a pasta atual é apenas uma data (formato DD-MM-YYYY)
			// ou já tem o padrão data_caso mas com caso diferente
			const dateOnlyPattern = /^\d{2}-\d{2}-\d{4}$/;
			const dateWithCasePattern = /^(\d{2}-\d{2}-\d{4})_(.+)$/;

			let shouldRename = false;
			let dateStr = '';

			if (dateOnlyPattern.test(folderName)) {
				// Pasta só com data (recém criada)
				dateStr = folderName;
				shouldRename = true;
			} else if (dateWithCasePattern.test(folderName)) {
				// Pasta já tem formato data_caso, verifica se o caso mudou
				const match = folderName.match(dateWithCasePattern);
				if (match) {
					dateStr = match[1];
					const currentCase = match[2];
					// Só renomeia se o caso de teste mudou E não está carregando
					shouldRename = currentCase !== headerData.testCase;
				}
			}

			if (shouldRename && dateStr) {
				// Marca que estamos renomeando
				isRenamingRef.current = true;

				// Salva os dados do header ANTES de renomear
				await ipcRenderer.invoke('save-header-data', currentFolder, headerData);

				// Cria novo nome: Data_caso-de-teste
				const newFolderName = `${dateStr}_${headerData.testCase}`;

				// Renomeia a pasta via IPC
				const newPath = await ipcRenderer.invoke(
					'rename-folder',
					currentFolder,
					newFolderName,
				);
				if (newPath) {
					// Atualiza o currentFolder sem disparar loadHeaderData
					setCurrentFolder(newPath);
					// NÃO reseta isRenamingRef aqui - deixa o useEffect fazer isso
				}
			}
		};

		// Debounce de 500ms para evitar múltiplas renomeações enquanto digita
		const timeoutId = setTimeout(() => {
			renameFolderIfNeeded();
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [headerData.testCase, currentFolder]); // APENAS testCase e currentFolder, não todo headerData

	const loadImages = async () => {
		if (currentFolder) {
			const imgs = await ipcRenderer.invoke('get-images', currentFolder);
			setImages(imgs);
		}
	};

	useEffect(() => {
		if (!currentFolder) {
			setImages([]);
			return;
		}

		// Carrega images
		loadImages();

		// Se é renomeação, não faz nada com header
		if (isRenamingRef.current) {
			isRenamingRef.current = false;
			return;
		}

		// Limpa header primeiro (mantém apenas executor)
		const savedExecutor = executorRef.current;
		setHeaderData({
			testName: '',
			executor: savedExecutor,
			system: '',
			testCycle: '',
			testCase: '',
		});

		// Se é pasta NOVA, NÃO carrega header
		if (isNewFolderRef.current) {
			isNewFolderRef.current = false;
			return;
		}

		// Caso contrário, carrega header (se existir)
		const folderToLoad = currentFolder;
		setTimeout(() => {
			loadHeaderData(folderToLoad);
		}, 0);
	}, [currentFolder]);

	const loadHeaderData = async (folder: string) => {
		if (folder) {
			const result = await ipcRenderer.invoke('load-header-data', folder);
			if (result.success && result.data) {
				setHeaderData(result.data);
			}
		}
	};

	const saveHeaderData = async (folder: string, data: HeaderData) => {
		if (folder && data.testCase) {
			await ipcRenderer.invoke('save-header-data', folder, data);
		}
	};

	const handleFolderChange = async (folder: string, isNewFolder = false) => {
		// Salvar dados da pasta anterior se tiver
		if (currentFolder && headerData.testCase) {
			await saveHeaderData(currentFolder, headerData);
		}

		// Marca se é pasta nova
		isNewFolderRef.current = isNewFolder;

		// Muda a pasta - useEffect vai lidar com header
		setCurrentFolder(folder);
	};

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

import { useEffect, useRef, useState } from 'react';
import MainLayout from './components/MainLayout';
import { LanguageProvider } from './contexts/LanguageContext';
import { applyTheme, Theme } from './theme/themes';

const { ipcRenderer } = window.require('electron');

export interface HeaderData {
	testName: string;
	executor: string;
	system: string;
	testCycle: string;
	testCase: string;
}

export interface ImageData {
	name: string;
	path: string;
	timestamp?: number;
}

function App() {
	const [currentFolder, setCurrentFolder] = useState<string>('');
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
	const isLoadingFolderRef = useRef(false); // Flag para indicar que está abrindo pasta existente

	// Aplicar tema inicial e escutar mudanças
	useEffect(() => {
		const savedTheme =
			(localStorage.getItem('qabooster-theme') as Theme) || 'blue';
		applyTheme(savedTheme);

		const handleThemeChange = (e: CustomEvent) => {
			applyTheme(e.detail);
		};

		window.addEventListener(
			'theme-changed',
			handleThemeChange as EventListener,
		);

		return () => {
			window.removeEventListener(
				'theme-changed',
				handleThemeChange as EventListener,
			);
		};
	}, []);

	// Salvar executor no localStorage sempre que mudar
	useEffect(() => {
		if (headerData.executor) {
			localStorage.setItem('qabooster-executor', headerData.executor);
		}
	}, [headerData.executor]);

	// Auto-save headerData quando mudar (com debounce)
	useEffect(() => {
		if (!currentFolder) return;

		const timeoutId = setTimeout(() => {
			saveHeaderData();
		}, 1000); // Salva 1 segundo após parar de digitar

		return () => clearTimeout(timeoutId);
	}, [headerData, currentFolder]);

	// Renomear pasta quando o caso de teste é preenchido
	useEffect(() => {
		const renameFolderIfNeeded = async () => {
			// NÃO renomeia se está carregando pasta existente ou se não tem dados
			if (!currentFolder || !headerData.testCase || isLoadingFolderRef.current)
				return;

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
				await ipcRenderer.invoke('save-header-data', headerData);

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
				}
			}
		};

		// Debounce de 500ms para evitar múltiplas renomeações enquanto digita
		const timeoutId = setTimeout(() => {
			renameFolderIfNeeded();
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [headerData.testCase, currentFolder]);

	useEffect(() => {
		// Listen for screenshot captures
		ipcRenderer.on('screenshot-captured', () => {
			loadImages();
		});

		// Tray animation and sound feedback
		ipcRenderer.on('trigger-screenshot-flash', () => {
			// Toca som se habilitado
			const soundEnabled = localStorage.getItem('qabooster-sound') === 'true';
			if (soundEnabled) {
				// Som minimalista de câmera usando Web Audio API
				const audioContext = new AudioContext();
				const oscillator = audioContext.createOscillator();
				const gainNode = audioContext.createGain();

				oscillator.connect(gainNode);
				gainNode.connect(audioContext.destination);

				oscillator.frequency.value = 800;
				oscillator.type = 'sine';

				gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
				gainNode.gain.exponentialRampToValueAtTime(
					0.01,
					audioContext.currentTime + 0.1,
				);

				oscillator.start(audioContext.currentTime);
				oscillator.stop(audioContext.currentTime + 0.1);
			}

			// Envia sinal para o main process animar o tray
			ipcRenderer.send('screenshot-flash');
		});

		ipcRenderer.on('screenshot-error', (_: any, message: string) => {
			alert(message);
		});

		return () => {
			ipcRenderer.removeAllListeners('screenshot-captured');
			ipcRenderer.removeAllListeners('screenshot-error');
			ipcRenderer.removeAllListeners('trigger-screenshot-flash');
		};
	}, [currentFolder]);

	const loadImages = async () => {
		if (currentFolder) {
			const imgs = await ipcRenderer.invoke('get-images', currentFolder);
			setImages(imgs);
		}
	};

	useEffect(() => {
		loadImages();
		// Só carrega headerData se NÃO for uma renomeação
		if (!isRenamingRef.current) {
			loadHeaderData();
		} else {
			// Reset flag após renomear
			isRenamingRef.current = false;
		}
		// Reset flag de loading após processar
		isLoadingFolderRef.current = false;
	}, [currentFolder]);

	const loadHeaderData = async () => {
		if (currentFolder) {
			const result = await ipcRenderer.invoke(
				'load-header-data',
				currentFolder,
			);
			if (result.success && result.data) {
				setHeaderData(result.data);
			}
		}
	};

	// Salvar headerData apenas quando explicitamente solicitado
	const saveHeaderData = async () => {
		if (currentFolder) {
			await ipcRenderer.invoke('save-header-data', headerData);
		}
	};

	const handleFolderChange = async (folder: string, isNewFolder = false) => {
		// Salvar dados da pasta anterior antes de mudar
		if (currentFolder) {
			await saveHeaderData();
		}

		// Se está abrindo pasta EXISTENTE (não é nova), limpa o cabeçalho primeiro
		if (!isNewFolder) {
			isLoadingFolderRef.current = true;
			const savedExecutor = headerData.executor; // Mantém executor
			setHeaderData({
				testName: '',
				executor: savedExecutor,
				system: '',
				testCycle: '',
				testCase: '',
			});
		}

		setCurrentFolder(folder);
	};

	const handleNewTest = () => {
		// Verifica se há dados preenchidos
		const hasData =
			headerData.testName ||
			headerData.system ||
			headerData.testCycle ||
			headerData.testCase;

		// Se tem pasta E tem dados, confirma e salva antes de limpar
		if (currentFolder && hasData) {
			if (
				!confirm(
					'Deseja iniciar um novo teste? Os dados do teste atual serão salvos.',
				)
			) {
				return;
			}
			saveHeaderData();
		}
		// Se tem dados mas não tem pasta, só confirma
		else if (hasData || images.length > 0) {
			if (
				!confirm(
					'Deseja iniciar um novo teste? Os dados atuais serão perdidos.',
				)
			) {
				return;
			}
		}

		// Limpar cabeçalho para novo teste (mantém o executor salvo)
		const savedExecutor = localStorage.getItem('qabooster-executor') || '';
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
		if (confirm(`Deletar ${image.name}?`)) {
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
			onSaveHeaderData={saveHeaderData}
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

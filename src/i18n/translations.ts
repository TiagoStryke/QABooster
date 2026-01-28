export const translations = {
	pt: {
		// Header
		appTitle: 'QA Booster - Gerador de evidências de testes',
		testResult: 'Resultado do Teste',
		selectOption: 'Selecione...',
		approved: '✅ Aprovado',
		reproved: '❌ Reprovado',
		partial: '⚠️ Parcial',
		system: 'Sistema',
		testCycle: 'Ciclo de Teste',
		testCase: 'Caso de Teste',
		executor: 'Executor',
		executionDateTime: 'Data e Hora da Execução',

		// Toolbar
		fullScreen: 'Tela Cheia',
		area: 'Área',
		useLastSavedArea: 'Usar última área salva',
		sound: '🔊 Som',
		images: 'imagens',
		image: 'imagem',
		generatePDF: 'Gerar PDF',
		generatingPDF: 'Gerando PDF...',

		// Folder Manager
		continueTest: 'Continuar Teste',
		newTest: 'Novo Teste',

		// Image Gallery
		imageGallery: 'Galeria de Imagens',
		noImagesYet: 'Nenhuma imagem capturada ainda',
		useShortcut: 'Use o atalho para começar',

		// Settings
		settings: 'Configurações',
		pdfOrientation: 'Orientação do PDF',
		portrait: '📄 Retrato',
		landscape: '📃 Paisagem',
		language: 'Idioma / Language',
		portuguese: '🇧🇷 Português',
		english: '🇺🇸 English',
		theme: 'Tema / Theme',
		themeBlue: 'Azul',
		themeDark: 'Dark',
		themeGrey: 'Cinza',
		themeRose: 'Rosa',
		themeLight: 'Claro',
		themeGreen: 'Verde',

		// Help
		help: 'Ajuda',
		quickStart: 'Início Rápido',
		quickStartText:
			'Use os atalhos de teclado para capturar screenshots rapidamente. Configure seus atalhos preferidos nas configurações.',
		capture: 'Captura',
		captureText:
			'Tela Cheia: Captura todo o monitor selecionado. Área: Permite selecionar uma região específica da tela.',
		edition: 'Edição',
		editionText:
			'Clique em uma imagem para abrir o editor. Adicione setas, círculos e textos para destacar detalhes importantes.',
		pdfGeneration: 'Geração de PDF',
		pdfText:
			'Preencha os dados do cabeçalho e clique em Gerar PDF. O arquivo será salvo na pasta selecionada.',

		// Alerts/Messages
		noImagesToGeneratePDF: 'Nenhuma imagem para gerar PDF',
		pdfSavedSuccessfully: 'PDF salvo com sucesso na pasta!',
		errorSavingPDF: 'Erro ao salvar PDF',
		pdfAlreadyExists: 'Um arquivo PDF com este nome já existe',
		replace: 'Substituir',
		createNewCopy: 'Criar nova cópia',
		cancel: 'Cancelar',
		errorShowingDialog: 'Erro ao mostrar diálogo',
		errorFindingFilename: 'Erro ao buscar nome disponível',

		// PDF Content
		qaTestEvidence: 'Evidência de Testes de QA',
	},
	en: {
		// Header
		appTitle: 'QA Booster - Test Evidence Generator',
		testResult: 'Test Result',
		selectOption: 'Select...',
		approved: '✅ Approved',
		reproved: '❌ Failed',
		partial: '⚠️ Partial',
		system: 'System',
		testCycle: 'Test Cycle',
		testCase: 'Test Case',
		executor: 'Executor',
		executionDateTime: 'Execution Date and Time',

		// Toolbar
		fullScreen: 'Full Screen',
		area: 'Area',
		useLastSavedArea: 'Use last saved area',
		sound: '🔊 Sound',
		images: 'images',
		image: 'image',
		generatePDF: 'Generate PDF',
		generatingPDF: 'Generating PDF...',

		// Folder Manager
		continueTest: 'Continue Test',
		newTest: 'New Test',

		// Image Gallery
		imageGallery: 'Image Gallery',
		noImagesYet: 'No images captured yet',
		useShortcut: 'Use the shortcut to start',

		// Settings
		settings: 'Settings',
		pdfOrientation: 'PDF Orientation',
		portrait: '📄 Portrait',
		landscape: '📃 Landscape',
		language: 'Language / Idioma',
		portuguese: '🇧🇷 Português',
		english: '🇺🇸 English',
		theme: 'Theme / Tema',
		themeBlue: 'Blue',
		themeDark: 'Dark',
		themeGrey: 'Grey',
		themeRose: 'Rose',
		themeLight: 'Light',
		themeGreen: 'Green',

		// Help
		help: 'Help',
		quickStart: 'Quick Start',
		quickStartText:
			'Use keyboard shortcuts to quickly capture screenshots. Configure your preferred shortcuts in settings.',
		capture: 'Capture',
		captureText:
			'Full Screen: Captures the entire selected monitor. Area: Allows you to select a specific screen region.',
		edition: 'Edition',
		editionText:
			'Click on an image to open the editor. Add arrows, circles and text to highlight important details.',
		pdfGeneration: 'PDF Generation',
		pdfText:
			'Fill in the header data and click Generate PDF. The file will be saved in the selected folder.',

		// Alerts/Messages
		noImagesToGeneratePDF: 'No images to generate PDF',
		pdfSavedSuccessfully: 'PDF saved successfully in the folder!',
		errorSavingPDF: 'Error saving PDF',
		pdfAlreadyExists: 'A PDF file with this name already exists',
		replace: 'Replace',
		createNewCopy: 'Create new copy',
		cancel: 'Cancel',
		errorShowingDialog: 'Error showing dialog',
		errorFindingFilename: 'Error finding available name',

		// PDF Content
		qaTestEvidence: 'QA Test Evidence',
	},
};

export type Language = 'pt' | 'en';

export const getTranslation = (key: string, lang: Language = 'pt'): string => {
	return translations[lang][key as keyof typeof translations.pt] || key;
};

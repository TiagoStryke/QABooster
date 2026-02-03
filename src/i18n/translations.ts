export const translations = {
	pt: {
		// Header
		appTitle: 'QA Booster - Gerador de evidências de testes',
		testResult: 'Resultado do Teste',
		selectOption: 'Selecione...',
		approved: 'Aprovado ✅',
		reproved: 'Reprovado ❌',
		partial: 'Parcial ⚠️',
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
		soundEnabled: 'Som de Captura',
		soundEnabledDesc: 'Reproduz um som ao capturar screenshots',
		cursorInScreenshots: 'Cursor nos Screenshots',
		cursorInScreenshotsDesc: 'Desenha o cursor do mouse nas capturas',
		images: 'imagens',
		image: 'imagem',
		generatePDF: 'Gerar PDF',
		generatingPDF: 'Gerando PDF...',
		monitor: 'Monitor',
		selectArea: 'Selecionar Área',
		confirm: 'Confirmar',
		saveShortcut: 'Salvar',
		cancel: 'Cancelar',
		pressKeys: 'Pressione teclas',
		fullscreenShortcutUpdated: 'Atalho de tela cheia atualizado!',
		areaShortcutUpdated: 'Atalho de área selecionada atualizado!',
		areaSaved: 'Área salva',
		selectAreaToCapture: 'Selecionar área de captura',
		defineFixedArea: 'Definir Área Fixa',
		fixedAreaActive: 'Área Fixa Ativa',
		fixedAreaInactive: 'Área Fixa (desativada)',
		redefineArea: 'Redefinir área',

		// Folder Manager
		continueTest: 'Continuar Teste',
		newTest: 'Novo Teste',
		openFolderInFinder: 'Abrir pasta no Finder',

		// Image Gallery
		imageGallery: 'Galeria de Imagens',
		noImagesYet: 'Nenhuma imagem capturada ainda',
		useShortcut: 'Use o atalho para começar',
		view: 'Visualizar',
		edit: 'Editar',
		deleteImage: 'Deletar',

		// Image Editor
		imageEditor: 'Editor de Imagem',
		select: 'Selecionar',
		arrow: 'Seta',
		line: 'Linha',
		rectangle: 'Retângulo',
		circle: 'Círculo',
		text: 'Texto',
		pen: 'Desenho',
		stickerClick: 'Clique',
		stickerThumbsDown: 'Joinha pra Baixo',
		color: 'Cor',
		zoomOut: 'Zoom Out',
		zoomIn: 'Zoom In',
		fitToScreen: 'Ajustar à tela',
		saveEdits: 'Salvar Edições',
		undo: 'Desfazer',
		redo: 'Refazer',
		deleteSelected: 'Deletar',
		save: 'Salvar',
		close: 'Fechar',

		// Notes Panel
		notes: 'Anotações',
		notesSubtitle: 'Use para BDD, links, massas, etc.',
		closeNotes: 'Fechar anotações',
		openNotes: 'Abrir Anotações',
		autosaved: 'Salvo automaticamente',
		pasteImagesHere: 'Cole imagens (Cmd+V) ou digite suas anotações aqui...',
		removeImage: 'Remover imagem',
		tipAutoSave: 'Ctrl+S ou Cmd+S para salvar manualmente',

		// Settings
		settings: 'Configurações',
		pdfOrientation: 'Orientação do PDF',
		portrait: '📄 Retrato',
		landscape: '📃 Paisagem',
		language: 'Idioma / Language',
		portuguese: '🇧🇷 Português',
		english: '🇺🇸 English',
		theme: 'Tema / Theme',
		themeBlue: 'Azul (padrão)',
		themeDark: 'Dark',
		themeGrey: 'Cinza',
		themeRose: 'Rosa',
		themeLight: 'Claro',
		themeGreen: 'Verde',
		copyToClipboard: 'Copiar prints para área de transferência',
		copyToClipboardDesc: 'Permite colar com Ctrl+V em outros programas',
		captureShortcuts: 'Atalhos de Captura',
		quickPrint: 'Print Rápido',
		quickPrintDesc: 'Sempre copia, não salva em pasta',
		fullScreenDesc: 'Captura monitor selecionado e salva',
		areaDesc: 'Captura área selecionada e salva',
		shortcutRegistrationFailed: 'Falha ao Registrar Atalhos',
		shortcutRegistrationFailedMessage:
			'Os seguintes atalhos não puderam ser registrados:',
		shortcutConflictHint: 'Outro aplicativo pode estar usando essas teclas.',

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
		viewPDF: 'Visualizar PDF',
		ok: 'OK',
		errorSavingPDF: 'Erro ao salvar PDF',
		pdfAlreadyExists: 'Um arquivo PDF com este nome já existe',
		replace: 'Substituir',
		createNewCopy: 'Criar nova cópia',
		cancelAction: 'Cancelar',
		errorShowingDialog: 'Erro ao mostrar diálogo',
		errorFindingFilename: 'Erro ao buscar nome disponível',
		errorGeneratingPDF: 'Erro ao gerar PDF',
		confirmNewTest:
			'Deseja iniciar um novo teste? Os dados do teste atual serão salvos.',
		confirmNewTestLoseData:
			'Deseja iniciar um novo teste? Os dados atuais serão perdidos.',
		confirmDeleteImage: 'Deletar',
		noTestFoundInFolder:
			'Nenhum teste foi encontrado nesta pasta.\n\nPor favor, crie um novo teste clicando em "+ Novo Teste".',
		pdfFilename: 'Evidencia_',
		confirmUnsavedTitle: 'Alterações não salvas',
		confirmUnsavedMessage:
			'Deseja salvar as alterações antes de fechar o editor?',
		saveButton: 'Salvar',
		discardButton: 'Descartar',
		closeEditorFirst:
			'Por favor, salve as edições na imagem antes de começar um novo teste ou continuar outro teste.',
		saveEditsBeforePDF:
			'Por favor, salve as edições na imagem antes de gerar o PDF.',

		// PDF Content
		qaTestEvidence: 'Evidência de Testes de QA',
	},
	en: {
		// Header
		appTitle: 'QA Booster - Test Evidence Generator',
		testResult: 'Test Result',
		selectOption: 'Select...',
		approved: 'Approved ✅',
		reproved: 'Failed ❌',
		partial: 'Partial ⚠️',
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
		soundEnabled: 'Capture Sound',
		soundEnabledDesc: 'Plays a sound when capturing screenshots',
		cursorInScreenshots: 'Cursor in Screenshots',
		cursorInScreenshotsDesc: 'Draws the mouse cursor in captures',
		images: 'images',
		image: 'image',
		generatePDF: 'Generate PDF',
		generatingPDF: 'Generating PDF...',
		monitor: 'Monitor',
		selectArea: 'Select Area',
		confirm: 'Confirm',
		saveShortcut: 'Save',
		cancel: 'Cancel',
		pressKeys: 'Press keys',
		fullscreenShortcutUpdated: 'Fullscreen shortcut updated!',
		areaShortcutUpdated: 'Area shortcut updated!',
		areaSaved: 'Area saved',
		selectAreaToCapture: 'Select capture area',
		defineFixedArea: 'Define Fixed Area',
		fixedAreaActive: 'Fixed Area Active',
		fixedAreaInactive: 'Fixed Area (disabled)',
		redefineArea: 'Redefine area',

		// Folder Manager
		continueTest: 'Continue Test',
		newTest: 'New Test',
		openFolderInFinder: 'Open folder in Finder',

		// Image Gallery
		imageGallery: 'Image Gallery',
		noImagesYet: 'No images captured yet',
		useShortcut: 'Use the shortcut to start',
		view: 'View',
		edit: 'Edit',
		deleteImage: 'Delete',

		// Image Editor
		imageEditor: 'Image Editor',
		select: 'Select',
		arrow: 'Arrow',
		line: 'Line',
		rectangle: 'Rectangle',
		circle: 'Circle',
		text: 'Text',
		pen: 'Drawing',
		stickerClick: 'Click',
		stickerThumbsDown: 'Thumbs Down',
		color: 'Color',
		zoomOut: 'Zoom Out',
		zoomIn: 'Zoom In',
		fitToScreen: 'Fit to screen',
		saveEdits: 'Save Edits',
		undo: 'Undo',
		redo: 'Redo',
		deleteSelected: 'Delete',
		save: 'Save',
		close: 'Close',

		// Notes Panel
		notes: 'Notes',
		notesSubtitle: 'Use for BDD, links, test data, etc.',
		closeNotes: 'Close notes',
		openNotes: 'Open Notes',
		autosaved: 'Auto-saved',
		pasteImagesHere: 'Paste images (Cmd+V) or type your notes here...',
		removeImage: 'Remove image',
		tipAutoSave: 'Ctrl+S or Cmd+S to save manually',

		// Settings
		settings: 'Settings',
		pdfOrientation: 'PDF Orientation',
		portrait: '📄 Portrait',
		landscape: '📃 Landscape',
		language: 'Language / Idioma',
		portuguese: '🇧🇷 Português',
		english: '🇺🇸 English',
		theme: 'Theme / Tema',
		themeBlue: 'Blue (default)',
		themeDark: 'Dark',
		themeGrey: 'Grey',
		themeRose: 'Rose',
		themeLight: 'Light',
		themeGreen: 'Green',
		copyToClipboard: 'Copy screenshots to clipboard',
		copyToClipboardDesc: 'Allows pasting with Ctrl+V in other programs',
		captureShortcuts: 'Capture Shortcuts',
		quickPrint: 'Quick Print',
		quickPrintDesc: 'Always copies, never saves to folder',
		fullScreenDesc: 'Captures selected monitor and saves',
		areaDesc: 'Captures selected area and saves',
		shortcutRegistrationFailed: 'Failed to Register Shortcuts',
		shortcutRegistrationFailedMessage:
			'The following shortcuts could not be registered:',
		shortcutConflictHint: 'Another application may be using these keys.',

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
		viewPDF: 'View PDF',
		ok: 'OK',
		errorSavingPDF: 'Error saving PDF',
		pdfAlreadyExists: 'A PDF file with this name already exists',
		replace: 'Replace',
		createNewCopy: 'Create new copy',
		cancelAction: 'Cancel',
		errorShowingDialog: 'Error showing dialog',
		errorFindingFilename: 'Error finding available name',
		errorGeneratingPDF: 'Error generating PDF',
		confirmNewTest: 'Start a new test? Current test data will be saved.',
		confirmNewTestLoseData: 'Start a new test? Current data will be lost.',
		confirmDeleteImage: 'Delete',
		noTestFoundInFolder:
			'No test was found in this folder.\n\nPlease create a new test by clicking "+ New Test".',
		pdfFilename: 'Evidence_',
		confirmUnsavedTitle: 'Unsaved Changes',
		confirmUnsavedMessage:
			'Do you want to save the changes before closing the editor?',
		saveButton: 'Save',
		discardButton: 'Discard',
		closeEditorFirst:
			'Please save your image edits before starting a new test or continuing another test.',
		saveEditsBeforePDF:
			'Please save your image edits before generating the PDF.',

		// PDF Content
		qaTestEvidence: 'QA Test Evidence',
	},
};

export type Language = 'pt' | 'en';

export const getTranslation = (key: string, lang: Language = 'pt'): string => {
	return translations[lang][key as keyof typeof translations.pt] || key;
};

import { useCallback, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { TestRecord } from '../interfaces';
import { HeaderData, ImageData } from '../interfaces';
import FolderManager from './FolderManager';
import Header from './Header';
import ImageEditor from './ImageEditor';
import ImageGallery from './ImageGallery';
import NotesPanel from './NotesPanel';
import Toolbar from './Toolbar';

interface MainLayoutProps {
	headerData: HeaderData;
	setHeaderData: (data: HeaderData) => void;
	currentFolder: string;
	images: ImageData[];
	onSaveHeaderData: () => void;
	onNewTest: () => void;
	onLoadTest: (test: TestRecord) => void;
	executePendingRename: () => Promise<boolean>;
	onFolderChange: (folder: string, isNewFolder?: boolean) => void;
	selectedImage: ImageData | null;
	showEditor: boolean;
	isNotesPanelOpen: boolean;
	setIsNotesPanelOpen: (open: boolean) => void;
	handleImageSelect: (image: ImageData) => void;
	handleImageDelete: (image: ImageData) => Promise<void>;
	handleImagePreview: (image: ImageData) => Promise<void>;
	handleImageReorder: (newOrder: ImageData[]) => void;
	handleCloseEditor: () => void;
	handleSaveEdited: (dataUrl: string) => Promise<void>;
}

export default function MainLayout({
	headerData,
	setHeaderData,
	currentFolder,
	images,
	onSaveHeaderData,
	onNewTest,
	onLoadTest,
	executePendingRename,
	onFolderChange,
	selectedImage,
	showEditor,
	isNotesPanelOpen,
	setIsNotesPanelOpen,
	handleImageSelect,
	handleImageDelete,
	handleImagePreview,
	handleImageReorder,
	handleCloseEditor,
	handleSaveEdited,
}: MainLayoutProps) {
	const { t } = useLanguage();

	const [galleryWidth, setGalleryWidth] = useState(320);
	const isResizing = useRef(false);

	const handleResizerMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		isResizing.current = true;

		const onMouseMove = (moveEvent: MouseEvent) => {
			if (!isResizing.current) return;
			const newWidth = Math.max(200, Math.min(600, moveEvent.clientX));
			setGalleryWidth(newWidth);
		};

		const onMouseUp = () => {
			isResizing.current = false;
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
		};

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
	}, []);

	return (
		<div className="h-screen flex bg-slate-900">
			{/* Conteúdo principal - empurrado para esquerda quando painel abre */}
			<div className="flex-1 flex flex-col overflow-hidden">
				<Header headerData={headerData} setHeaderData={setHeaderData} />

				{/* Barra unificada em uma única linha: [Continuar][Novo] | [Área Fixa][Monitor] [pasta flex-1] [N imgs][Gerar PDF] */}
				<div className="bg-slate-800 border-b border-slate-700 px-3 py-2 flex items-center gap-2">
					{/* Esquerda: gestão de testes */}
					<FolderManager
						currentFolder={currentFolder}
						onFolderChange={onFolderChange}
						executePendingRename={executePendingRename}
						headerData={headerData}
						showEditor={showEditor}
						onLoadTest={onLoadTest}
						onNewTest={onNewTest}
					/>
					<div className="w-px h-5 bg-slate-600 flex-shrink-0" />
					{/* Direita: ferramentas de captura + pasta + PDF */}
					<Toolbar
						currentFolder={currentFolder}
						images={images}
						headerData={headerData}
						setHeaderData={setHeaderData}
						onSaveHeaderData={onSaveHeaderData}
						onNewTest={onNewTest}
						executePendingRename={executePendingRename}
						showEditor={showEditor}
					/>
				</div>

				<button
					onClick={() => setIsNotesPanelOpen(!isNotesPanelOpen)}
					className="fixed top-3 right-3 text-white p-2.5 rounded-md shadow-lg transition-all z-50 border bg-slate-700 hover:bg-slate-600 border-slate-600"
					style={{ WebkitAppRegion: 'no-drag' } as any}
					title={isNotesPanelOpen ? t('closeNotes') : t('openNotes')}
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
						/>
					</svg>
				</button>

				<div className="flex-1 flex overflow-hidden">
					<ImageGallery
						images={images}
						onImageSelect={handleImageSelect}
						onImageDelete={handleImageDelete}
						onImagePreview={handleImagePreview}
						onImageReorder={handleImageReorder}
						selectedImage={selectedImage}
						width={galleryWidth}
					/>

					{/* Resizer handle */}
					<div
						onMouseDown={handleResizerMouseDown}
						className="w-1.5 bg-slate-700 hover:bg-primary-500 cursor-col-resize flex-shrink-0 transition-colors"
						title="Arraste para redimensionar a galeria"
					/>

					{showEditor && selectedImage && (
						<ImageEditor
							image={selectedImage}
							onClose={handleCloseEditor}
							onSave={handleSaveEdited}
						/>
					)}
				</div>
			</div>

			{/* NotesPanel na lateral direita - altura completa da tela */}
			<NotesPanel
				currentFolder={currentFolder}
				isOpen={isNotesPanelOpen}
				onToggle={() => setIsNotesPanelOpen(!isNotesPanelOpen)}
			/>
		</div>
	);
}

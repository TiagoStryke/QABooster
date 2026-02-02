import { HeaderData, ImageData } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
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

	return (
		<div className="h-screen flex bg-slate-900">
			{/* Conteúdo principal - empurrado para esquerda quando painel abre */}
			<div className="flex-1 flex flex-col overflow-hidden">
				<Header headerData={headerData} setHeaderData={setHeaderData} />

				<Toolbar
					currentFolder={currentFolder}
					images={images}
					headerData={headerData}
					onSaveHeaderData={onSaveHeaderData}
					onNewTest={onNewTest}
				/>

				<FolderManager
					currentFolder={currentFolder}
					onFolderChange={onFolderChange}
					headerData={headerData}
					showEditor={showEditor}
				/>

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

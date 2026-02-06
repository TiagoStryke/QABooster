import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ipcService } from '../services/ipc-service';

interface NotesPanelProps {
	currentFolder: string;
	isOpen: boolean;
	onToggle: () => void;
}

export default function NotesPanel({
	currentFolder,
	isOpen,
	onToggle,
}: NotesPanelProps) {
	const { t } = useLanguage();
	const [content, setContent] = useState('');
	const [images, setImages] = useState<string[]>([]);

	useEffect(() => {
		loadNotes();
	}, [currentFolder]);

	// Auto-save quando conteúdo muda
	useEffect(() => {
		if (currentFolder && content !== undefined) {
			const timeoutId = setTimeout(() => {
				saveNotes();
			}, 1000); // Debounce de 1 segundo

			return () => clearTimeout(timeoutId);
		}
	}, [content, images, currentFolder]);

	const loadNotes = async () => {
		if (currentFolder) {
			const result = await ipcService.loadNotes(currentFolder);
			if (result.success && result.data) {
				setContent(result.data.text || '');
				setImages(result.data.images || []);
			} else {
				setContent('');
				setImages([]);
			}
		}
	};

	const saveNotes = async () => {
		if (currentFolder) {
			await ipcService.saveNotes(currentFolder, {
				text: content,
				images,
			});
		}
	};

	const handlePaste = async (e: React.ClipboardEvent) => {
		const items = e.clipboardData?.items;
		if (!items) return;

		for (let i = 0; i < items.length; i++) {
			if (items[i].type.indexOf('image') !== -1) {
				e.preventDefault();
				const blob = items[i].getAsFile();
				if (blob) {
					const reader = new FileReader();
					reader.onload = () => {
						const base64 = reader.result as string;
						setImages([...images, base64]);
					};
					reader.readAsDataURL(blob);
				}
			}
		}
	};

	const removeImage = (index: number) => {
		setImages(images.filter((_, i) => i !== index));
	};

	return (
		<div
			className={`bg-slate-900 border-l border-slate-700 flex flex-col shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${
				isOpen ? 'w-[400px]' : 'w-0 border-0'
			}`}
		>
			{/* Header com botão de fechar */}
			<div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
				<div>
					<h2 className="text-sm font-medium text-slate-300">{t('notes')}</h2>
					<p className="text-xs text-slate-500 mt-0.5">{t('notesSubtitle')}</p>
				</div>
				<button
					onClick={onToggle}
					className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
					title={t('closeNotes')}
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
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			{/* Editor de texto - estilo Sublime */}
			<div className="flex-1 flex flex-col overflow-hidden">
				<textarea
					value={content}
					onChange={(e) => setContent(e.target.value)}
					onPaste={handlePaste}
					placeholder={t('pasteImagesHere')}
					className="flex-1 bg-slate-900 text-slate-200 text-sm p-4 border-none focus:outline-none resize-none font-mono leading-relaxed"
					style={{ caretColor: '#3b82f6' }}
				/>

				{/* Imagens coladas */}
				{images.length > 0 && (
					<div className="border-t border-slate-700 p-4 space-y-3 overflow-y-auto max-h-80">
						{images.map((img, index) => (
							<div key={index} className="relative group">
								<img
									src={img}
									alt={`Imagem ${index + 1}`}
									className="w-full rounded-lg border border-slate-700"
								/>
								<button
									onClick={() => removeImage(index)}
									className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-md shadow-lg"
									title={t('removeImage')}
								>
									<svg
										className="w-3 h-3"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Footer com dica */}
			<div className="bg-slate-800 border-t border-slate-700 px-4 py-2">
				<p className="text-xs text-slate-500">
					💡 {t('autosaved')} • {t('tipAutoSave')}
				</p>
			</div>
		</div>
	);
}

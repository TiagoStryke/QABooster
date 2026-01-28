import { useEffect, useState } from 'react';

const { ipcRenderer } = window.require('electron');

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
	const [content, setContent] = useState('');
	const [images, setImages] = useState<string[]>([]);

	useEffect(() => {
		loadNotes();
	}, [currentFolder]);

	// Expande/contrai a janela quando o painel abre/fecha
	useEffect(() => {
		if (isOpen) {
			ipcRenderer.send('expand-window', 400); // 400px extra para o painel
		} else {
			ipcRenderer.send('contract-window');
		}
	}, [isOpen]);

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
			const result = await ipcRenderer.invoke('load-notes', currentFolder);
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
			await ipcRenderer.invoke('save-notes', currentFolder, {
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
		<>
			{/* Botão único estilo VSCode Chat - dois painéis lado a lado */}
			<button
				onClick={onToggle}
				className={`fixed top-3 right-3 text-white p-2.5 rounded-md shadow-lg transition-all z-50 border ${
					isOpen
						? 'bg-blue-600 hover:bg-blue-700 border-blue-500'
						: 'bg-slate-700 hover:bg-slate-600 border-slate-600'
				}`}
				style={{ WebkitAppRegion: 'no-drag' } as any}
				title={isOpen ? 'Fechar Anotações' : 'Abrir Anotações'}
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

			{/* Painel só renderiza quando está aberto */}
			{isOpen && (
				<div className="w-[400px] bg-slate-900 border-l border-slate-700 flex flex-col h-full flex-shrink-0">
					{/* Header minimalista */}
					<div className="bg-slate-800 border-b border-slate-700 px-4 py-3">
						<h2 className="text-sm font-medium text-slate-300">
							Anotações do Teste
						</h2>
						<p className="text-xs text-slate-500 mt-0.5">
							Use para BDD, links, massas, etc.
						</p>
					</div>

					{/* Editor de texto - estilo Sublime */}
					<div className="flex-1 flex flex-col overflow-hidden">
						<textarea
							value={content}
							onChange={(e) => setContent(e.target.value)}
							onPaste={handlePaste}
							placeholder="Cole imagens (Cmd+V) ou digite suas anotações aqui..."
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
											title="Remover imagem"
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
							'💡' Auto-salvo • Cmd+V para colar imagem
						</p>
					</div>
				</div>
			)}
		</>
	);
}

import { HeaderData } from '../App';
import { useLanguage } from '../contexts/LanguageContext';

const { ipcRenderer } = window.require('electron');

interface FolderManagerProps {
	currentFolder: string;
	onFolderChange: (folder: string, isNewFolder?: boolean) => void;
	headerData: HeaderData;
}

export default function FolderManager({
	currentFolder,
	onFolderChange,
	headerData,
}: FolderManagerProps) {
	const { t } = useLanguage();

	const handleContinueTest = async () => {
		const folder = await ipcRenderer.invoke('select-folder');
		if (folder) {
			// Verifica se existe JSON na pasta
			const result = await ipcRenderer.invoke('load-header-data', folder);
			if (result.success && result.data) {
				// Pasta com teste existente - isNewFolder = false
				onFolderChange(folder, false);
			} else {
				// Pasta sem teste
				alert(t('noTestFoundInFolder'));
			}
		}
	};

	const handleNewTest = async () => {
		// Abre dialog para selecionar onde será salvo
		const baseFolder = await ipcRenderer.invoke('select-folder');
		if (!baseFolder) return;

		// Cria pasta com data
		const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
		const folderName = date; // Inicialmente só com data
		const folder = await ipcRenderer.invoke(
			'create-subfolder',
			baseFolder,
			folderName,
		);

		if (folder) {
			// Pasta nova - isNewFolder = true
			onFolderChange(folder, true);
		}
	};

	return (
		<div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center gap-3">
			<button
				onClick={handleContinueTest}
				className="btn-secondary text-xs py-1.5 px-3"
			>
				<svg
					className="w-4 h-4 inline mr-1"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
					/>
				</svg>
				{t('continueTest')}
			</button>

			<button
				onClick={handleNewTest}
				className="btn-primary text-xs py-1.5 px-3"
			>
				<svg
					className="w-4 h-4 inline mr-1"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 4v16m8-8H4"
					/>
				</svg>
				{t('newTest')}
			</button>

			{currentFolder && (
				<div className="flex-1 flex items-center gap-2 text-xs bg-slate-900 px-3 py-1.5 rounded-lg">
					<svg
						className="w-4 h-4 text-slate-400 flex-shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
						/>
					</svg>
					<span className="text-slate-300 truncate">{currentFolder}</span>
				</div>
			)}
		</div>
	);
}

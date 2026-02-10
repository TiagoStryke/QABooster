import { useLanguage } from '../contexts/LanguageContext';
import { useAppSettings } from '../hooks/useAppSettings';
import { HeaderData } from '../interfaces';
import { ipcService } from '../services/ipc-service';

interface FolderManagerProps {
	currentFolder: string;
	onFolderChange: (folder: string, isNewFolder?: boolean) => void;
	headerData: HeaderData;
	showEditor: boolean;
}

export default function FolderManager({
	currentFolder,
	onFolderChange,
	headerData,
	showEditor,
}: FolderManagerProps) {
	const { t } = useLanguage();
	const { settings } = useAppSettings();

	const handleContinueTest = async () => {
		if (showEditor) {
			alert(t('closeEditorFirst'));
			return;
		}
		const folder = await ipcService.selectFolder();
		if (folder) {
			// Valida se é uma pasta de teste válida
			const validationResult = await ipcService.isValidTestFolder(folder);

			if (validationResult.success && validationResult.isValid) {
				// Verifica se existe headerData.json na pasta
				const result = await ipcService.loadHeaderData(folder);
				if (result) {
					onFolderChange(folder, false);
				} else {
					alert(t('noTestFoundInFolder'));
				}
			} else {
				// Pasta não segue a estrutura esperada, mas pode conter headerData
				const result = await ipcService.loadHeaderData(folder);
				if (result) {
					onFolderChange(folder, false);
				} else {
					alert(t('noTestFoundInFolder'));
				}
			}
		}
	};

	const handleNewTest = async () => {
		if (showEditor) {
			alert(t('closeEditorFirst'));
			return;
		}

		// Valida se rootFolder está configurada
		if (!settings.rootFolder) {
			alert(t('noRootFolderConfigured'));
			return;
		}

		// NÃO cria estrutura ainda - apenas marca como "novo teste pendente"
		// A estrutura será criada quando o usuário preencher o header completo
		// Por enquanto, sinaliza para App que é um novo teste
		onFolderChange('', true);
	};

	const handleOpenFolder = async () => {
		if (currentFolder) {
			await ipcService.openFolderInFinder(currentFolder);
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
					<span className="text-slate-300 truncate flex-1">
						{currentFolder}
					</span>
					<button
						onClick={handleOpenFolder}
						className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
						title={t('openFolderInFinder')}
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
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							/>
						</svg>
					</button>
				</div>
			)}
		</div>
	);
}

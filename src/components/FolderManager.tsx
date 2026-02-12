import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppSettings } from '../hooks/useAppSettings';
import type { TestRecord } from '../interfaces';
import { HeaderData } from '../interfaces';
import { ipcService } from '../services/ipc-service';
import TestSelector from './TestSelector';

interface FolderManagerProps {
	currentFolder: string;
	onFolderChange: (folder: string, isNewFolder?: boolean) => void;
	executePendingRename: () => Promise<boolean>;
	headerData: HeaderData;
	showEditor: boolean;
	onLoadTest: (test: TestRecord) => void;
}

export default function FolderManager({
	currentFolder,
	onFolderChange,
	executePendingRename,
	headerData,
	showEditor,
	onLoadTest,
}: FolderManagerProps) {
	const { t } = useLanguage();
	const { settings } = useAppSettings();
	const [showTestSelector, setShowTestSelector] = useState(false);

	const handleContinueTest = async () => {
		if (showEditor) {
			alert(t('closeEditorFirst'));
			return;
		}

		// Execute pending rename BEFORE continuing test
		await executePendingRename();

		// Open test selector modal
		setShowTestSelector(true);
	};

	const handleTestSelected = async (test: TestRecord) => {
		setShowTestSelector(false);

		// Load the selected test
		onLoadTest(test);

		// Set the folder
		onFolderChange(test.folderPath, false);
	};

	const handleNewTest = async () => {
		if (showEditor) {
			alert(t('closeEditorFirst'));
			return;
		}

		// Clear currentFolder in backend (main process)
		ipcService.clearCurrentFolder();

		// Sinaliza para App que é um novo teste (limpa tudo)
		// A estrutura de pastas será criada automaticamente quando
		// o usuário preencher o cabeçalho completo
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

			{showTestSelector && (
				<TestSelector
					onSelect={handleTestSelected}
					onClose={() => setShowTestSelector(false)}
				/>
			)}
		</div>
	);
}

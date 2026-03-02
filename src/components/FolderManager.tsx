import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppSettings } from '../hooks/useAppSettings';
import type { TestRecord } from '../interfaces';
import { HeaderData } from '../interfaces';
import TestSelector from './TestSelector';

interface FolderManagerProps {
	currentFolder: string;
	onFolderChange: (folder: string, isNewFolder?: boolean) => void;
	executePendingRename: () => Promise<boolean>;
	headerData: HeaderData;
	showEditor: boolean;
	onLoadTest: (test: TestRecord) => void;
	onNewTest: () => void;
}

export default function FolderManager({
	currentFolder,
	onFolderChange,
	executePendingRename,
	headerData,
	showEditor,
	onLoadTest,
	onNewTest,
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

	const handleNewTestClick = () => {
		if (showEditor) {
			alert(t('closeEditorFirst'));
			return;
		}

		// Verificar se rootFolder está configurado
		if (!settings.rootFolder) {
			alert(t('configureRootFolderFirst'));
			return;
		}

		// Call parent's handleNewTest (only clears UI, doesn't create folder)
		onNewTest();
	};

	return (
		<>
			{/* Apenas os botões de controle de teste */}
			<button
				onClick={handleContinueTest}
				className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0"
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
				onClick={handleNewTestClick}
				className="btn-primary text-xs py-1.5 px-3 flex-shrink-0"
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

			{showTestSelector && (
				<TestSelector
					onSelect={handleTestSelected}
					onClose={() => setShowTestSelector(false)}
				/>
			)}
		</>
	);
}

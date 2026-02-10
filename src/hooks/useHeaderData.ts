import { useEffect, useState } from 'react';
import { HeaderData } from '../interfaces';
import { ipcService } from '../services/ipc-service';

interface UseHeaderDataParams {
	currentFolder: string;
}

interface UseHeaderDataReturn {
	headerData: HeaderData;
	setHeaderData: (data: HeaderData) => void;
	resetHeaderData: () => void;
}

/**
 * Manages header data state and auto-save
 * Handles debounced auto-save to IPC
 * NEW: No longer manages executor (moved to AppSettings)
 */
export function useHeaderData({
	currentFolder,
}: UseHeaderDataParams): UseHeaderDataReturn {
	const [headerData, setHeaderData] = useState<HeaderData>({
		testName: '',
		system: '',
		testCycle: '',
		testCase: '',
		testType: '',
		testTypeValue: '',
	});

	// Auto-save headerData when it changes (with debounce)
	useEffect(() => {
		if (!currentFolder) return;

		const folderToSave = currentFolder;
		const dataToSave = headerData;

		const timeoutId = setTimeout(() => {
			if (folderToSave && dataToSave.testCase) {
				ipcService.saveHeaderData(folderToSave, dataToSave);
			}
		}, 1000);

		return () => clearTimeout(timeoutId);
	}, [headerData, currentFolder]);

	const resetHeaderData = () => {
		setHeaderData({
			testName: '',
			system: '',
			testCycle: '',
			testCase: '',
			testType: '',
			testTypeValue: '',
		});
	};

	return {
		headerData,
		setHeaderData,
		resetHeaderData,
	};
}

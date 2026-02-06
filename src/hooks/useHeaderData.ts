import { useEffect, useRef, useState } from 'react';
import { HeaderData } from '../interfaces';
import { ipcService } from '../services/ipc-service';

interface UseHeaderDataParams {
	currentFolder: string;
}

interface UseHeaderDataReturn {
	headerData: HeaderData;
	setHeaderData: (data: HeaderData) => void;
	executorRef: React.RefObject<string>;
	resetHeaderData: () => void;
}

/**
 * Manages header data state, executor persistence, and auto-save
 * Handles localStorage sync for executor and debounced auto-save to IPC
 */
export function useHeaderData({
	currentFolder,
}: UseHeaderDataParams): UseHeaderDataReturn {
	const [headerData, setHeaderData] = useState<HeaderData>({
		testName: '',
		executor: localStorage.getItem('qabooster-executor') || '',
		system: '',
		testCycle: '',
		testCase: '',
	});

	const executorRef = useRef(localStorage.getItem('qabooster-executor') || '');

	// Save executor to localStorage when it changes
	useEffect(() => {
		if (headerData.executor) {
			localStorage.setItem('qabooster-executor', headerData.executor);
			executorRef.current = headerData.executor;
		}
	}, [headerData.executor]);

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
		const savedExecutor = executorRef.current;
		setHeaderData({
			testName: '',
			executor: savedExecutor,
			system: '',
			testCycle: '',
			testCase: '',
		});
	};

	return {
		headerData,
		setHeaderData,
		executorRef,
		resetHeaderData,
	};
}

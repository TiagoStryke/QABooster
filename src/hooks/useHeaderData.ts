import { useEffect, useState } from 'react';
import { HeaderData } from '../interfaces';

interface UseHeaderDataParams {
	currentFolder: string;
}

interface UseHeaderDataReturn {
	headerData: HeaderData;
	setHeaderData: (data: HeaderData) => void;
	resetHeaderData: () => void;
}

/**
 * Manages header data state
 * Simple state management - does NOT initialize from localStorage
 * useFolderManager is responsible for loading/saving
 */
export function useHeaderData({
	currentFolder,
}: UseHeaderDataParams): UseHeaderDataReturn {
	// Simple state initialization - always start empty
	const [headerData, setHeaderData] = useState<HeaderData>({
		testName: '',
		system: '',
		testCycle: '',
		testCase: '',
		testType: '',
		testTypeValue: '',
	});

	// Save to localStorage whenever headerData changes (for screenshot shortcut)
	useEffect(() => {
		try {
			localStorage.setItem('qabooster-headerData', JSON.stringify(headerData));
		} catch (error) {
			console.error('Error saving headerData to localStorage:', error);
		}
	}, [headerData]);

	const resetHeaderData = () => {
		const emptyData = {
			testName: '',
			system: '',
			testCycle: '',
			testCase: '',
			testType: '',
			testTypeValue: '',
		};
		setHeaderData(emptyData);
		localStorage.setItem('qabooster-headerData', JSON.stringify(emptyData));
	};

	return {
		headerData,
		setHeaderData,
		resetHeaderData,
	};
}

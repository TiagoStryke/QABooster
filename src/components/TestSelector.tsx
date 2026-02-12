/**
 * TestSelector Component
 *
 * Modal for selecting existing tests from database
 * Replaces old "Continuar Teste" folder picker
 *
 * Features:
 * - Search/filter by system, card, cycle, status
 * - Preview test metadata
 * - Delete tests
 * - Sort by updated date
 */

import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ipcService } from '../services/ipc-service';

interface TestRecord {
	id: string;
	createdAt: string;
	updatedAt: string;
	status: 'in-progress' | 'completed';
	headerData: {
		testName: string;
		system: string;
		testCycle: string;
		testCase: string;
		testType: string;
		testTypeValue: string;
	};
	folderPath: string;
	screenshots: Array<{
		filename: string;
		capturedAt: string;
		edited: boolean;
	}>;
	notes: string;
	pdfGenerated: boolean;
	pdfPath?: string;
}

interface TestSelectorProps {
	onSelect: (test: TestRecord) => void;
	onClose: () => void;
}

export default function TestSelector({ onSelect, onClose }: TestSelectorProps) {
	const { t } = useLanguage();
	const [tests, setTests] = useState<TestRecord[]>([]);
	const [filteredTests, setFilteredTests] = useState<TestRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [filterStatus, setFilterStatus] = useState<
		'all' | 'in-progress' | 'completed'
	>('all');

	// Load all tests on mount
	useEffect(() => {
		loadTests();
	}, []);

	// Filter tests when search or filter changes
	useEffect(() => {
		filterTests();
	}, [searchQuery, filterStatus, tests]);

	const loadTests = async () => {
		try {
			setLoading(true);
			const allTests = await ipcService.getAllTests();
			setTests(allTests);
		} catch (error) {
			console.error('Failed to load tests:', error);
		} finally {
			setLoading(false);
		}
	};

	const filterTests = () => {
		let filtered = tests;

		// Filter by status
		if (filterStatus !== 'all') {
			filtered = filtered.filter((test) => test.status === filterStatus);
		}

		// Filter by search query (searches in multiple fields)
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(test) =>
					test.headerData.system.toLowerCase().includes(query) ||
					test.headerData.testTypeValue.toLowerCase().includes(query) ||
					test.headerData.testCycle.toLowerCase().includes(query) ||
					test.headerData.testCase.toLowerCase().includes(query) ||
					test.headerData.testName.toLowerCase().includes(query),
			);
		}

		setFilteredTests(filtered);
	};

	const handleDelete = async (testId: string) => {
		if (!confirm(t('confirmDeleteTest'))) return;

		try {
			const success = await ipcService.deleteTest(testId);
			if (success) {
				// Reload tests after deletion
				await loadTests();
			} else {
				alert(t('deleteTestFailed'));
			}
		} catch (error) {
			console.error('Failed to delete test:', error);
			alert(t('deleteTestFailed'));
		}
	};

	const formatDate = (isoDate: string): string => {
		const date = new Date(isoDate);
		return date.toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const getStatusBadge = (status: string) => {
		if (status === 'completed') {
			return (
				<span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-500/20 text-green-400">
					{t('completed')}
				</span>
			);
		}
		return (
			<span className="px-2 py-0.5 text-xs font-semibold rounded bg-yellow-500/20 text-yellow-400">
				{t('inProgress')}
			</span>
		);
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
				{/* Header */}
				<div className="p-6 border-b border-slate-700">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-2xl font-bold text-slate-100">
							{t('selectTest')}
						</h2>
						<button
							onClick={onClose}
							className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
						>
							×
						</button>
					</div>

					{/* Search and Filters */}
					<div className="flex gap-3">
						<input
							type="text"
							placeholder={t('searchTests')}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="flex-1 px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:border-primary-500 focus:outline-none"
						/>
						<select
							value={filterStatus}
							onChange={(e) => setFilterStatus(e.target.value as any)}
							className="px-4 py-2 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:border-primary-500 focus:outline-none"
						>
							<option value="all">{t('allTests')}</option>
							<option value="in-progress">{t('inProgress')}</option>
							<option value="completed">{t('completed')}</option>
						</select>
					</div>
				</div>

				{/* Test List */}
				<div className="flex-1 overflow-y-auto p-6">
					{loading ? (
						<div className="text-center text-slate-400 py-12">
							{t('loading')}...
						</div>
					) : filteredTests.length === 0 ? (
						<div className="text-center text-slate-400 py-12">
							{searchQuery || filterStatus !== 'all'
								? t('noTestsFound')
								: t('noTestsYet')}
						</div>
					) : (
						<div className="space-y-2">
							{filteredTests.map((test) => (
								<div
									key={test.id}
									className="relative bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700 transition-colors border border-slate-600 cursor-pointer group"
									onClick={() => onSelect(test)}
								>
									{/* Delete button - top right corner */}
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleDelete(test.id);
										}}
										className="absolute top-2 right-2 p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
										title={t('deleteTest')}
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
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>

									{/* Badges */}
									<div className="flex items-center gap-2 mb-2">
										{getStatusBadge(test.status)}
										{test.pdfGenerated && (
											<span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/20 text-blue-400">
												PDF
											</span>
										)}
									</div>

									{/* Test Info - Compact 2 columns */}
									<div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
										<div>
											<span className="text-slate-400">{t('system')}:</span>{' '}
											<span className="text-slate-200 font-medium">
												{test.headerData.system || '-'}
											</span>
										</div>
										<div>
											<span className="text-slate-400">{t('testType')}:</span>{' '}
											<span className="text-slate-200 font-medium">
												{test.headerData.testTypeValue || '-'}
											</span>
										</div>
										<div>
											<span className="text-slate-400">{t('testCycle')}:</span>{' '}
											<span className="text-slate-200">
												{test.headerData.testCycle || '-'}
											</span>
										</div>
										<div>
											<span className="text-slate-400">{t('testCase')}:</span>{' '}
											<span className="text-slate-200">
												{test.headerData.testCase || '-'}
											</span>
										</div>
									</div>

									{/* Footer info */}
									<div className="mt-1.5 text-xs text-slate-400 flex items-center gap-3">
										<span>📸 {test.screenshots.length}</span>
										<span>🕒 {formatDate(test.updatedAt)}</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-4 border-t border-slate-700 text-center text-sm text-slate-400">
					{filteredTests.length} {t('testsFound')}
				</div>
			</div>
		</div>
	);
}

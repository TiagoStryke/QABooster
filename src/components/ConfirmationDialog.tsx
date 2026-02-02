import { useLanguage } from '../contexts/LanguageContext';

interface ConfirmationDialogProps {
	isOpen: boolean;
	title: string;
	message: string;
	onSave: () => void;
	onDiscard: () => void;
	onCancel: () => void;
}

export default function ConfirmationDialog({
	isOpen,
	title,
	message,
	onSave,
	onDiscard,
	onCancel,
}: ConfirmationDialogProps) {
	const { t } = useLanguage();

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
			<div className="bg-slate-800 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 border border-slate-700">
				<h2 className="text-xl font-semibold text-slate-100 mb-3">{title}</h2>
				<p className="text-slate-300 mb-6">{message}</p>

				<div className="flex gap-3 justify-end">
					<button
						onClick={onCancel}
						className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
					>
						{t('cancel')}
					</button>
					<button
						onClick={onDiscard}
						className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
					>
						{t('discardButton')}
					</button>
					<button
						onClick={onSave}
						className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium"
					>
						{t('saveButton')}
					</button>
				</div>
			</div>
		</div>
	);
}

/**
 * ShortcutEditor Component
 *
 * Componente reutilizável para edição de atalhos de teclado
 */

import { useLanguage } from '../contexts/LanguageContext';
import type { ShortcutType } from '../hooks/useSettingsState';

interface ShortcutEditorProps {
	type: ShortcutType;
	icon: string;
	titleKey: string;
	descKey: string;
	currentShortcut: string;
	isEditing: boolean;
	tempShortcut: string;
	onEdit: (type: ShortcutType) => void;
	onSave: () => void;
	onCancel: () => void;
	onKeyDown: (e: React.KeyboardEvent) => void;
}

export default function ShortcutEditor({
	type,
	icon,
	titleKey,
	descKey,
	currentShortcut,
	isEditing,
	tempShortcut,
	onEdit,
	onSave,
	onCancel,
	onKeyDown,
}: ShortcutEditorProps) {
	const { t } = useLanguage();

	return (
		<div className="mb-3 bg-slate-900 p-3 rounded">
			<div className="flex items-center justify-between mb-2">
				<div className="flex-1">
					<div className="text-sm font-semibold text-slate-300">
						{icon} {t(titleKey)}
					</div>
					<div className="text-xs text-slate-400 mt-0.5">{t(descKey)}</div>
				</div>
			</div>
			{isEditing ? (
				<div className="flex gap-2 mt-2">
					<input
						type="text"
						className="input-field text-xs flex-1 py-1 px-2"
						value={tempShortcut}
						readOnly
						onKeyDown={onKeyDown}
						placeholder={t('pressKeys')}
						autoFocus
					/>
					<button
						onClick={onSave}
						className="btn-secondary text-xs py-1 px-2"
						disabled={!tempShortcut}
					>
						✓
					</button>
					<button
						onClick={onCancel}
						className="btn-secondary text-xs py-1 px-2"
					>
						✕
					</button>
				</div>
			) : (
				<div className="flex items-center gap-2 mt-2">
					<code className="text-xs bg-slate-800 px-2 py-1 rounded text-blue-400">
						{currentShortcut}
					</code>
					<button
						onClick={() => onEdit(type)}
						className="btn-secondary text-xs py-1 px-2"
					>
						✏️ {t('edit')}
					</button>
				</div>
			)}
		</div>
	);
}

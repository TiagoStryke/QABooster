export type Theme = 'blue' | 'dark' | 'grey' | 'rose' | 'light' | 'green';

export const themes = {
	blue: {
		name: 'Azul',
		primary: '#3b82f6',
		primaryDark: '#2563eb',
		primaryLight: '#60a5fa',
		background: '#0f172a',
		backgroundLight: '#1e293b',
		backgroundLighter: '#334155',
		text: '#f1f5f9',
		textSecondary: '#cbd5e1',
		textTertiary: '#94a3b8',
		border: '#475569',
		success: '#10b981',
		error: '#ef4444',
		warning: '#f59e0b',
	},
	dark: {
		name: 'Dark',
		primary: '#6366f1',
		primaryDark: '#4f46e5',
		primaryLight: '#818cf8',
		background: '#000000',
		backgroundLight: '#0a0a0a',
		backgroundLighter: '#171717',
		text: '#ffffff',
		textSecondary: '#d4d4d4',
		textTertiary: '#a3a3a3',
		border: '#262626',
		success: '#22c55e',
		error: '#ef4444',
		warning: '#f59e0b',
	},
	grey: {
		name: 'Cinza',
		primary: '#6b7280',
		primaryDark: '#4b5563',
		primaryLight: '#9ca3af',
		background: '#111827',
		backgroundLight: '#1f2937',
		backgroundLighter: '#374151',
		text: '#f9fafb',
		textSecondary: '#d1d5db',
		textTertiary: '#9ca3af',
		border: '#4b5563',
		success: '#10b981',
		error: '#ef4444',
		warning: '#f59e0b',
	},
	rose: {
		name: 'Rosa',
		primary: '#f472b6',
		primaryDark: '#ec4899',
		primaryLight: '#f9a8d4',
		background: '#1a0a1a',
		backgroundLight: '#2d1b2e',
		backgroundLighter: '#3e2640',
		text: '#fdf2f8',
		textSecondary: '#f9d5ee',
		textTertiary: '#f5b8d8',
		border: '#6b2b5e',
		success: '#10b981',
		error: '#ef4444',
		warning: '#f59e0b',
	},
	light: {
		name: 'Claro',
		primary: '#3b82f6',
		primaryDark: '#2563eb',
		primaryLight: '#60a5fa',
		background: '#ffffff',
		backgroundLight: '#f8fafc',
		backgroundLighter: '#f1f5f9',
		text: '#0f172a',
		textSecondary: '#334155',
		textTertiary: '#64748b',
		border: '#cbd5e1',
		success: '#10b981',
		error: '#ef4444',
		warning: '#f59e0b',
	},
	green: {
		name: 'Verde',
		primary: '#10b981',
		primaryDark: '#059669',
		primaryLight: '#34d399',
		background: '#064e3b',
		backgroundLight: '#065f46',
		backgroundLighter: '#047857',
		text: '#ecfdf5',
		textSecondary: '#d1fae5',
		textTertiary: '#a7f3d0',
		border: '#059669',
		success: '#10b981',
		error: '#ef4444',
		warning: '#f59e0b',
	},
};

export const applyTheme = (theme: Theme) => {
	const root = document.documentElement;
	const colors = themes[theme];

	root.style.setProperty('--color-primary', colors.primary);
	root.style.setProperty('--color-primary-dark', colors.primaryDark);
	root.style.setProperty('--color-primary-light', colors.primaryLight);
	root.style.setProperty('--color-background', colors.background);
	root.style.setProperty('--color-background-light', colors.backgroundLight);
	root.style.setProperty(
		'--color-background-lighter',
		colors.backgroundLighter,
	);
	root.style.setProperty('--color-text', colors.text);
	root.style.setProperty('--color-text-secondary', colors.textSecondary);
	root.style.setProperty('--color-text-tertiary', colors.textTertiary);
	root.style.setProperty('--color-border', colors.border);
	root.style.setProperty('--color-success', colors.success);
	root.style.setProperty('--color-error', colors.error);
	root.style.setProperty('--color-warning', colors.warning);
};

import { useEffect } from 'react';
import { applyTheme, Theme } from '../theme/themes';

/**
 * Manages theme initialization and changes
 * Loads saved theme from localStorage and listens for theme change events
 */
export function useThemeManager() {
	useEffect(() => {
		// Load and apply saved theme
		const savedTheme =
			(localStorage.getItem('qabooster-theme') as Theme) || 'blue';
		applyTheme(savedTheme);

		// Listen for theme changes
		const handleThemeChange = (e: CustomEvent) => {
			applyTheme(e.detail);
		};

		window.addEventListener(
			'theme-changed',
			handleThemeChange as EventListener,
		);

		return () => {
			window.removeEventListener(
				'theme-changed',
				handleThemeChange as EventListener,
			);
		};
	}, []);
}

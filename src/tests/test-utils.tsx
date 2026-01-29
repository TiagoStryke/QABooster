import { cleanup, render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { afterEach } from 'vitest';
import { LanguageProvider } from '../contexts/LanguageContext';

/**
 * Custom render que já inclui LanguageProvider e cleanup automático
 */
function customRender(
	ui: ReactElement,
	options?: Omit<RenderOptions, 'wrapper'>,
) {
	return render(ui, { wrapper: LanguageProvider, ...options });
}

// Cleanup automático após cada teste
afterEach(() => {
	cleanup();
});

export * from '@testing-library/react';
export { customRender as render };


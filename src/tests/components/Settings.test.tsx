import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Settings from '../../components/Settings';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { setupIpcMock } from '../mocks/electron.mock';

describe('Settings', () => {
	let mockIpc: ReturnType<typeof setupIpcMock>;
	const mockOnClose = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		mockIpc = setupIpcMock();
	});

	afterEach(() => {
		cleanup();
	});

	const renderComponent = (isOpen = true) => {
		return render(
			<LanguageProvider>
				<Settings isOpen={isOpen} onClose={mockOnClose} />
			</LanguageProvider>,
		);
	};

	it('não deve renderizar quando isOpen é false', () => {
		const { container } = renderComponent(false);
		expect(container.firstChild).toBeNull();
	});

	it('deve renderizar modal quando isOpen é true', () => {
		renderComponent();
		expect(screen.getByText(/Configurações|Settings/i)).toBeInTheDocument();
	});

	it('deve exibir todos os temas disponíveis', () => {
		renderComponent();

		expect(screen.getByText(/Blue|Azul/i)).toBeInTheDocument();
		expect(screen.getByText(/Dark|Escuro/i)).toBeInTheDocument();
		expect(screen.getByText(/Grey|Cinza/i)).toBeInTheDocument();
		expect(screen.getByText(/Rose|Rosa/i)).toBeInTheDocument();
		expect(screen.getByText(/Light|Claro/i)).toBeInTheDocument();
		expect(screen.getByText(/Green|Verde/i)).toBeInTheDocument();
	});

	it('deve trocar tema e salvar no localStorage', async () => {
		const user = userEvent.setup();
		renderComponent();

		const darkButton = screen.getByText(/Dark|Escuro/i);
		await user.click(darkButton);

		expect(localStorage.getItem('qabooster-theme')).toBe('dark');
	});

	it('deve disparar evento customizado ao trocar tema', async () => {
		const user = userEvent.setup();
		const eventHandler = vi.fn();
		window.addEventListener('theme-changed', eventHandler);

		renderComponent();

		const darkButton = screen.getByText(/Dark|Escuro/i);
		await user.click(darkButton);

		expect(eventHandler).toHaveBeenCalled();
		window.removeEventListener('theme-changed', eventHandler);
	});

	it('deve trocar idioma e salvar no localStorage', async () => {
		const user = userEvent.setup();
		renderComponent();

		// Find English button
		const languageButtons = screen.getAllByRole('button');
		const englishButton = languageButtons.find((btn) =>
			btn.textContent?.includes('English'),
		);

		if (englishButton) {
			await user.click(englishButton);
			expect(localStorage.getItem('qabooster-language')).toBe('en');
		}
	});

	it('deve disparar evento customizado ao trocar idioma', async () => {
		const user = userEvent.setup();
		const eventHandler = vi.fn();
		window.addEventListener('language-changed', eventHandler);

		renderComponent();

		const languageButtons = screen.getAllByRole('button');
		const englishButton = languageButtons.find((btn) =>
			btn.textContent?.includes('English'),
		);

		if (englishButton) {
			await user.click(englishButton);
			expect(eventHandler).toHaveBeenCalled();
		}

		window.removeEventListener('language-changed', eventHandler);
	});

	it('deve trocar orientação do PDF', async () => {
		const user = userEvent.setup();
		renderComponent();

		// Find Portrait button
		const orientationButtons = screen.getAllByRole('button');
		const portraitButton = orientationButtons.find(
			(btn) =>
				btn.textContent?.includes('Retrato') ||
				btn.textContent?.includes('Portrait'),
		);

		if (portraitButton) {
			await user.click(portraitButton);
			expect(localStorage.getItem('qabooster-pdf-orientation')).toBe(
				'portrait',
			);
		}
	});

	it('deve disparar evento ao trocar orientação do PDF', async () => {
		const user = userEvent.setup();
		const eventHandler = vi.fn();
		window.addEventListener('pdf-orientation-changed', eventHandler);

		renderComponent();

		const orientationButtons = screen.getAllByRole('button');
		const portraitButton = orientationButtons.find(
			(btn) =>
				btn.textContent?.includes('Retrato') ||
				btn.textContent?.includes('Portrait'),
		);

		if (portraitButton) {
			await user.click(portraitButton);
			expect(eventHandler).toHaveBeenCalled();
		}

		window.removeEventListener('pdf-orientation-changed', eventHandler);
	});

	it('deve ativar/desativar cópia automática para clipboard', async () => {
		const user = userEvent.setup();
		renderComponent();

		// Find checkbox or toggle button
		const checkboxes = screen.getAllByRole('checkbox');
		if (checkboxes.length > 0) {
			await user.click(checkboxes[0]);

			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith(
					'set-copy-to-clipboard',
					expect.any(Boolean),
				);
			});
		}
	});

	it('deve fechar ao clicar fora do modal', async () => {
		vi.useFakeTimers();
		renderComponent();

		// Avança o timer para permitir que o listener seja adicionado
		vi.advanceTimersByTime(150);

		// Simula clique fora do modal
		const clickEvent = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
		});

		document.body.dispatchEvent(clickEvent);

		await waitFor(() => {
			expect(mockOnClose).toHaveBeenCalled();
		});

		vi.useRealTimers();
	});

	it('deve aplicar tema selecionado ao montar', () => {
		localStorage.setItem('qabooster-theme', 'rose');
		renderComponent();

		// Rose theme button should be marked as selected
		const roseButton = screen.getByText(/Rose|Rosa/i);
		expect(roseButton.closest('button')).toHaveClass('ring-2');
	});

	it('deve aplicar idioma selecionado ao montar', () => {
		localStorage.setItem('qabooster-language', 'en');
		renderComponent();

		// English button should be marked as selected
		const languageButtons = screen.getAllByRole('button');
		const englishButton = languageButtons.find((btn) =>
			btn.textContent?.includes('English'),
		);

		expect(englishButton).toHaveClass('ring-2');
	});

	it('deve enviar preferência de clipboard ao main process ao montar', () => {
		localStorage.setItem('qabooster-copy-to-clipboard', 'true');
		renderComponent();

		expect(mockIpc.invoke).toHaveBeenCalledWith('set-copy-to-clipboard', true);
	});
});

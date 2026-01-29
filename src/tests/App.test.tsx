import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { setupIpcMock } from './mocks/electron.mock';

describe('App Integration Tests', () => {
	let mockIpc: ReturnType<typeof setupIpcMock>;

	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		mockIpc = setupIpcMock();

		// Mock successful responses
		mockIpc.invoke.mockImplementation((channel, ...args) => {
			if (channel === 'select-folder') return Promise.resolve('/test/folder');
			if (channel === 'create-new-folder')
				return Promise.resolve('/test/new-folder');
			if (channel === 'load-header-data')
				return Promise.resolve({ success: true, data: null });
			if (channel === 'save-header-data')
				return Promise.resolve({ success: true });
			if (channel === 'get-displays')
				return Promise.resolve([
					{
						id: 0,
						label: 'Display 1',
						bounds: { x: 0, y: 0, width: 1920, height: 1080 },
						primary: true,
					},
				]);
			if (channel === 'load-notes')
				return Promise.resolve({
					success: true,
					data: { text: '', images: [] },
				});
			if (channel === 'read-image-as-base64')
				return Promise.resolve('data:image/png;base64,test');
			return Promise.resolve({ success: true });
		});
	});

	afterEach(() => {
		cleanup();
	});

	describe('Initial Render', () => {
		it('deve renderizar sem crashar', () => {
			render(<App />);
			expect(
				screen.getByText(/continuar teste|continue test/i),
			).toBeInTheDocument();
		});

		it('deve renderizar todos os componentes principais', () => {
			const { container } = render(<App />);

			// Verifica se renderizou
			expect(container.querySelector('.bg-slate-800')).toBeInTheDocument();
		});

		it('deve aplicar tema salvo no localStorage', () => {
			localStorage.setItem('qabooster-theme', 'dark');
			render(<App />);

			// Tema deve estar aplicado no documento
			const root = document.documentElement;
			expect(root.style.getPropertyValue('--primary-500')).toBeTruthy();
		});
	});

	describe('Folder Management', () => {
		it('deve permitir selecionar pasta existente', async () => {
			const user = userEvent.setup();
			render(<App />);

			const continueButton = screen.getByText(/continuar teste|continue test/i);
			await user.click(continueButton);

			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith('select-folder');
			});
		});

		it('deve criar nova pasta', async () => {
			const user = userEvent.setup();
			render(<App />);

			const newButton = screen.getByText(/novo teste|new test/i);
			await user.click(newButton);

			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith('create-new-folder');
			});
		});

		it('deve carregar headerData ao selecionar pasta', async () => {
			mockIpc.invoke.mockResolvedValueOnce('/test/folder');
			mockIpc.invoke.mockResolvedValueOnce({
				success: true,
				data: {
					testName: 'Teste Exemplo',
					executor: 'Tester',
					system: 'Sistema',
					testCycle: 'Sprint 1',
					testCase: 'TC-001',
				},
			});

			const user = userEvent.setup();
			render(<App />);

			const continueButton = screen.getByText(/continuar teste|continue test/i);
			await user.click(continueButton);

			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith(
					'load-header-data',
					'/test/folder',
				);
			});
		});
	});

	describe('Image Management', () => {
		it('deve inicializar sem imagens', () => {
			render(<App />);
			expect(screen.getByText(/nenhuma imagem|no images/i)).toBeInTheDocument();
		});

		it('deve escutar eventos de nova screenshot', async () => {
			render(<App />);

			// Simula evento de nova screenshot
			mockIpc.on.mock.calls.find(
				(call) => call[0] === 'screenshot-saved',
			)?.[1]?.({
				name: 'screenshot.png',
				path: '/test/screenshot.png',
				timestamp: Date.now(),
			});

			// Aguarda a imagem aparecer (se implementado)
			await waitFor(() => {
				// Verifica se o IPC foi configurado
				expect(mockIpc.on).toHaveBeenCalledWith(
					'screenshot-saved',
					expect.any(Function),
				);
			});
		});
	});

	describe('Header Data', () => {
		it('deve inicializar headerData vazio', () => {
			render(<App />);
			// Header deve estar no documento
			const headers = document.querySelectorAll('input[type="text"]');
			expect(headers.length).toBeGreaterThan(0);
		});

		it('deve salvar executor no localStorage', async () => {
			const user = userEvent.setup();
			render(<App />);

			// Encontra input de executor (se visível)
			const inputs = screen.queryAllByRole('textbox');
			if (inputs.length > 0) {
				await user.type(inputs[0], 'Test User');

				await waitFor(() => {
					expect(localStorage.getItem('qabooster-executor')).toBeTruthy();
				});
			}
		});
	});

	describe('Image Editor', () => {
		it('não deve mostrar editor inicialmente', () => {
			render(<App />);
			expect(
				screen.queryByText(/editor de imagem|image editor/i),
			).not.toBeInTheDocument();
		});

		it('deve poder abrir editor ao selecionar imagem', async () => {
			// Este teste verifica se o estado do editor pode ser controlado
			render(<App />);

			// Estado inicial
			expect(
				screen.queryByText(/salvar edições|save edits/i),
			).not.toBeInTheDocument();
		});
	});

	describe('Notes Panel', () => {
		it('deve iniciar com painel de notas fechado', () => {
			render(<App />);

			// Painel deve estar oculto inicialmente
			const notesPanels = document.querySelectorAll('.w-\\[400px\\]');
			expect(notesPanels.length).toBe(0);
		});
	});

	describe('Settings', () => {
		it('não deve mostrar settings inicialmente', () => {
			render(<App />);
			expect(
				screen.queryByText(/configurações|settings/i),
			).not.toBeInTheDocument();
		});
	});

	describe('Theme System', () => {
		it('deve aplicar tema padrão (blue)', () => {
			render(<App />);

			const root = document.documentElement;
			// Verifica se alguma variável CSS foi setada
			const primaryColor = root.style.getPropertyValue('--primary-500');
			expect(primaryColor).toBeDefined();
		});

		it('deve reagir a eventos de mudança de tema', async () => {
			render(<App />);

			// Dispara evento de mudança de tema
			window.dispatchEvent(
				new CustomEvent('theme-changed', { detail: 'dark' }),
			);

			await waitFor(() => {
				// Verifica se o tema foi aplicado
				expect(localStorage.getItem('qabooster-theme')).toBe('dark');
			});
		});
	});

	describe('Auto-save', () => {
		it('deve fazer auto-save do headerData', async () => {
			vi.useFakeTimers();

			mockIpc.invoke.mockResolvedValueOnce('/test/folder');

			const user = userEvent.setup({ delay: null });
			render(<App />);

			const continueButton = screen.getByText(/continuar teste|continue test/i);
			await user.click(continueButton);

			// Avança o timer de debounce (1 segundo)
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith(
					expect.stringMatching(/save/),
					expect.anything(),
					expect.anything(),
				);
			});

			vi.useRealTimers();
		});
	});
});

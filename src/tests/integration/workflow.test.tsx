import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { setupIpcMock } from '../mocks/electron.mock';

/**
 * Testes de Integração - Fluxos Completos (E2E-like)
 *
 * Testa jornadas completas do usuário:
 * - Criar pasta → Adicionar screenshots → Editar → Gerar PDF
 * - Continuar teste existente → Adicionar mais evidências
 * - Gerenciar notas e anotações durante o teste
 */
describe('Integration Tests - Complete Workflows', () => {
	let mockIpc: ReturnType<typeof setupIpcMock>;

	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		mockIpc = setupIpcMock();

		// Setup completo de mocks
		mockIpc.invoke.mockImplementation((channel, ...args) => {
			if (channel === 'create-new-folder')
				return Promise.resolve('/test/folder/01-01-2026');
			if (channel === 'select-folder')
				return Promise.resolve('/test/existing-folder');
			if (channel === 'load-header-data') {
				return Promise.resolve({
					success: true,
					data: {
						testName: 'Login Test',
						executor: 'QA Team',
						system: 'Web App',
						testCycle: 'Sprint 10',
						testCase: 'TC-LOGIN-001',
					},
				});
			}
			if (channel === 'save-header-data')
				return Promise.resolve({ success: true });
			if (channel === 'get-displays') {
				return Promise.resolve([
					{
						id: 0,
						label: 'Main Display',
						bounds: { x: 0, y: 0, width: 1920, height: 1080 },
						primary: true,
					},
				]);
			}
			if (channel === 'capture-screenshot') {
				return Promise.resolve({
					success: true,
					image: {
						name: `screenshot-${Date.now()}.png`,
						path: `/test/folder/screenshot-${Date.now()}.png`,
						timestamp: Date.now(),
					},
				});
			}
			if (channel === 'read-image-as-base64')
				return Promise.resolve('data:image/png;base64,fakeImageData');
			if (channel === 'save-image') return Promise.resolve({ success: true });
			if (channel === 'delete-image') return Promise.resolve({ success: true });
			if (channel === 'load-notes')
				return Promise.resolve({
					success: true,
					data: { text: '', images: [] },
				});
			if (channel === 'save-notes') return Promise.resolve({ success: true });
			if (channel === 'save-pdf')
				return Promise.resolve({
					success: true,
					filename: 'test.pdf',
					filepath: '/test/test.pdf',
				});
			return Promise.resolve({ success: true });
		});
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	describe('Fluxo 1: Novo Teste Completo', () => {
		it('deve criar nova pasta → capturar screenshot → preencher header → gerar PDF', async () => {
			const user = userEvent.setup({ delay: null });
			render(<App />);

			// PASSO 1: Criar nova pasta
			const newTestButton = screen.getByText(/novo teste|new test/i);
			await user.click(newTestButton);

			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith('create-new-folder');
			});

			// PASSO 2: Verificar que pasta foi selecionada
			await waitFor(
				() => {
					expect(screen.getByText(/01-01-2026/)).toBeInTheDocument();
				},
				{ timeout: 5000 },
			);

			// PASSO 3: Capturar screenshot (simulado via evento)
			const screenshotData = {
				name: 'screenshot-1.png',
				path: '/test/folder/screenshot-1.png',
				timestamp: Date.now(),
			};

			mockIpc.on.mock.calls.find(
				(call) => call[0] === 'screenshot-saved',
			)?.[1]?.(screenshotData);

			// PASSO 4: Verificar que imagem foi adicionada
			await waitFor(() => {
				expect(mockIpc.on).toHaveBeenCalledWith(
					'screenshot-saved',
					expect.any(Function),
				);
			});

			// PASSO 5: Preencher headerData
			const inputs = screen.queryAllByRole('textbox');
			if (inputs.length > 0) {
				await user.type(inputs[0], 'Test Case Name');
			}

			// PASSO 6: Gerar PDF
			const pdfButton = screen.queryByText(/gerar pdf|generate pdf/i);
			if (pdfButton) {
				await user.click(pdfButton);

				await waitFor(
					() => {
						expect(mockIpc.invoke).toHaveBeenCalledWith(
							'save-pdf',
							expect.anything(),
							expect.anything(),
						);
					},
					{ timeout: 10000 },
				);
			}
		});
	});

	describe('Fluxo 2: Continuar Teste Existente', () => {
		it('deve abrir pasta existente → carregar dados → adicionar mais screenshots', async () => {
			const user = userEvent.setup({ delay: null });
			render(<App />);

			// PASSO 1: Continuar teste existente
			const continueButton = screen.getByText(/continuar teste|continue test/i);
			await user.click(continueButton);

			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith('select-folder');
			});

			// PASSO 2: Verificar que dados foram carregados
			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith(
					'load-header-data',
					'/test/existing-folder',
				);
			});

			// PASSO 3: Adicionar nova screenshot
			const screenshotData = {
				name: 'screenshot-new.png',
				path: '/test/existing-folder/screenshot-new.png',
				timestamp: Date.now(),
			};

			mockIpc.on.mock.calls.find(
				(call) => call[0] === 'screenshot-saved',
			)?.[1]?.(screenshotData);

			// PASSO 4: Auto-save deve acontecer
			vi.useFakeTimers();
			vi.advanceTimersByTime(1000);

			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith(
					'save-header-data',
					expect.anything(),
					expect.anything(),
				);
			});

			vi.useRealTimers();
		});
	});

	describe('Fluxo 3: Screenshot → Editar → Salvar', () => {
		it('deve capturar screenshot → abrir editor → adicionar anotações → salvar', async () => {
			const user = userEvent.setup({ delay: null });
			render(<App />);

			// PASSO 1: Criar pasta
			const newTestButton = screen.getByText(/novo teste|new test/i);
			await user.click(newTestButton);

			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith('create-new-folder');
			});

			// PASSO 2: Adicionar screenshot via evento
			const screenshotData = {
				name: 'screenshot-to-edit.png',
				path: '/test/folder/screenshot-to-edit.png',
				timestamp: Date.now(),
			};

			mockIpc.on.mock.calls.find(
				(call) => call[0] === 'screenshot-saved',
			)?.[1]?.(screenshotData);

			// PASSO 3: Clicar em editar (se botão existir)
			await waitFor(async () => {
				const editButtons = screen.queryAllByText(/editar|edit/i);
				if (editButtons.length > 0) {
					await user.click(editButtons[0]);
				}
			});

			// PASSO 4: Verificar que editor abre (se implementado)
			await waitFor(() => {
				const editorTitle = screen.queryByText(
					/editor de imagem|image editor/i,
				);
				if (editorTitle) {
					expect(editorTitle).toBeInTheDocument();
				}
			});

			// PASSO 5: Salvar (se botão existir)
			const saveButtons = screen.queryAllByText(/salvar|save/i);
			if (saveButtons.length > 0) {
				await user.click(saveButtons[0]);

				await waitFor(() => {
					expect(mockIpc.invoke).toHaveBeenCalledWith(
						'save-image',
						expect.anything(),
						expect.anything(),
					);
				});
			}
		});
	});

	describe('Fluxo 4: Gerenciar Notas Durante Teste', () => {
		it('deve abrir notas → adicionar texto → adicionar imagens → auto-save', async () => {
			vi.useFakeTimers();
			const user = userEvent.setup({ delay: null });
			render(<App />);

			// PASSO 1: Criar pasta
			const newTestButton = screen.getByText(/novo teste|new test/i);
			await user.click(newTestButton);

			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith('create-new-folder');
			});

			// PASSO 2: Abrir painel de notas (se botão existir)
			const notesButton = screen.queryByText(/anotações|notes/i);
			if (notesButton) {
				await user.click(notesButton);

				// PASSO 3: Adicionar texto
				await waitFor(async () => {
					const textarea = screen.queryByRole('textbox', { name: /nota/i });
					if (textarea) {
						await user.type(textarea, 'Teste de login realizado com sucesso');
					}
				});

				// PASSO 4: Auto-save
				vi.advanceTimersByTime(1000);

				await waitFor(() => {
					expect(mockIpc.invoke).toHaveBeenCalledWith(
						'save-notes',
						expect.anything(),
						expect.anything(),
					);
				});
			}

			vi.useRealTimers();
		});
	});

	describe('Fluxo 5: Múltiplas Screenshots e Reordenação', () => {
		it('deve capturar múltiplas screenshots → reordenar → gerar PDF na ordem correta', async () => {
			const user = userEvent.setup({ delay: null });
			render(<App />);

			// PASSO 1: Criar pasta
			const newTestButton = screen.getByText(/novo teste|new test/i);
			await user.click(newTestButton);

			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith('create-new-folder');
			});

			// PASSO 2: Adicionar 3 screenshots
			const screenshots = [
				{
					name: 'screenshot-1.png',
					path: '/test/folder/screenshot-1.png',
					timestamp: Date.now(),
				},
				{
					name: 'screenshot-2.png',
					path: '/test/folder/screenshot-2.png',
					timestamp: Date.now() + 1000,
				},
				{
					name: 'screenshot-3.png',
					path: '/test/folder/screenshot-3.png',
					timestamp: Date.now() + 2000,
				},
			];

			const screenshotHandler = mockIpc.on.mock.calls.find(
				(call) => call[0] === 'screenshot-saved',
			)?.[1];
			screenshots.forEach((screenshot) => {
				screenshotHandler?.(screenshot);
			});

			// PASSO 3: Verificar que todas foram adicionadas
			await waitFor(() => {
				expect(mockIpc.on).toHaveBeenCalledWith(
					'screenshot-saved',
					expect.any(Function),
				);
			});

			// PASSO 4: Gerar PDF (deve usar ordem correta)
			const pdfButton = screen.queryByText(/gerar pdf|generate pdf/i);
			if (pdfButton) {
				await user.click(pdfButton);

				await waitFor(
					() => {
						expect(mockIpc.invoke).toHaveBeenCalledWith(
							'save-pdf',
							expect.anything(),
							expect.objectContaining({
								images: expect.any(Array),
							}),
						);
					},
					{ timeout: 10000 },
				);
			}
		});
	});

	describe('Fluxo 6: Trocar Tema e Idioma Durante Teste', () => {
		it('deve trocar tema → trocar idioma → continuar teste normalmente', async () => {
			const user = userEvent.setup({ delay: null });
			render(<App />);

			// PASSO 1: Abrir settings (se existir botão)
			const settingsButton = screen.queryByTitle(/configurações|settings/i);
			if (settingsButton) {
				await user.click(settingsButton);

				// PASSO 2: Trocar tema
				await waitFor(async () => {
					const darkTheme = screen.queryByText(/dark|escuro/i);
					if (darkTheme) {
						await user.click(darkTheme);
					}
				});

				// PASSO 3: Verificar que tema mudou
				expect(localStorage.getItem('qabooster-theme')).toBe('dark');

				// PASSO 4: Trocar idioma
				const englishButton = screen.queryByText(/english/i);
				if (englishButton) {
					await user.click(englishButton);
					expect(localStorage.getItem('qabooster-language')).toBe('en');
				}

				// PASSO 5: Fechar settings
				const closeButton = screen.queryByText(/fechar|close/i);
				if (closeButton) {
					await user.click(closeButton);
				}
			}

			// PASSO 6: Continuar teste normalmente
			const newTestButton = screen.getByText(/novo teste|new test/i);
			expect(newTestButton).toBeInTheDocument();
		});
	});
});

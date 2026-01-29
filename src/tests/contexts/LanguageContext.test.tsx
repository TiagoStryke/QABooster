import {
    act,
    render,
    renderHook,
    screen,
    waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider, useLanguage } from '../../contexts/LanguageContext';

describe('LanguageContext', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	describe('LanguageProvider', () => {
		it('deve renderizar children corretamente', () => {
			render(
				<LanguageProvider>
					<div>Test Content</div>
				</LanguageProvider>,
			);

			expect(screen.getByText('Test Content')).toBeInTheDocument();
		});

		it('deve inicializar com idioma padrão português', () => {
			const { result } = renderHook(() => useLanguage(), {
				wrapper: LanguageProvider,
			});

			expect(result.current.language).toBe('pt');
		});

		it('deve inicializar com idioma salvo no localStorage', () => {
			localStorage.setItem('qabooster-language', 'en');

			const { result } = renderHook(() => useLanguage(), {
				wrapper: LanguageProvider,
			});

			expect(result.current.language).toBe('en');
		});

		it('deve trocar idioma corretamente', () => {
			const { result } = renderHook(() => useLanguage(), {
				wrapper: LanguageProvider,
			});

			act(() => {
				result.current.setLanguage('en');
			});

			expect(result.current.language).toBe('en');
			expect(localStorage.getItem('qabooster-language')).toBe('en');
		});

		it('deve disparar evento customizado ao trocar idioma', () => {
			const eventSpy = vi.fn();
			window.addEventListener('language-changed', eventSpy);

			const { result } = renderHook(() => useLanguage(), {
				wrapper: LanguageProvider,
			});

			act(() => {
				result.current.setLanguage('en');
			});

			expect(eventSpy).toHaveBeenCalledTimes(1);
			expect((eventSpy.mock.calls[0][0] as CustomEvent).detail).toBe('en');

			window.removeEventListener('language-changed', eventSpy);
		});

		it('deve atualizar idioma quando evento customizado é disparado', async () => {
			const { result } = renderHook(() => useLanguage(), {
				wrapper: LanguageProvider,
			});

			expect(result.current.language).toBe('pt');

			act(() => {
				window.dispatchEvent(
					new CustomEvent('language-changed', { detail: 'en' }),
				);
			});

			await waitFor(() => {
				expect(result.current.language).toBe('en');
			});
		});
	});

	describe('useLanguage hook', () => {
		it('deve lançar erro se usado fora do provider', () => {
			// Suprime console.error para o teste
			const consoleError = vi
				.spyOn(console, 'error')
				.mockImplementation(() => {});

			expect(() => {
				renderHook(() => useLanguage());
			}).toThrow('useLanguage must be used within a LanguageProvider');

			consoleError.mockRestore();
		});

		it('deve retornar função t que traduz chaves corretamente', () => {
			const { result } = renderHook(() => useLanguage(), {
				wrapper: LanguageProvider,
			});

			// Testa tradução em português
			expect(result.current.t('appTitle')).toBe(
				'QA Booster - Gerador de evidências de testes',
			);
			expect(result.current.t('newTest')).toBe('Novo Teste');

			// Troca para inglês
			act(() => {
				result.current.setLanguage('en');
			});

			// Testa tradução em inglês
			expect(result.current.t('appTitle')).toBe(
				'QA Booster - Test Evidence Generator',
			);
			expect(result.current.t('newTest')).toBe('New Test');
		});

		it('deve retornar chave quando tradução não existe', () => {
			const { result } = renderHook(() => useLanguage(), {
				wrapper: LanguageProvider,
			});

			expect(result.current.t('nonExistentKey')).toBe('nonExistentKey');
		});

		it('deve manter consistência entre múltiplas instâncias do hook', () => {
			const { result: result1 } = renderHook(() => useLanguage(), {
				wrapper: LanguageProvider,
			});

			const { result: result2 } = renderHook(() => useLanguage(), {
				wrapper: LanguageProvider,
			});

			expect(result1.current.language).toBe(result2.current.language);

			act(() => {
				result1.current.setLanguage('en');
			});

			// Ambos devem ter o mesmo idioma (via localStorage e evento)
			expect(localStorage.getItem('qabooster-language')).toBe('en');
		});
	});

	describe('Integração com localStorage', () => {
		it('deve persistir idioma ao trocar', () => {
			const { result } = renderHook(() => useLanguage(), {
				wrapper: LanguageProvider,
			});

			act(() => {
				result.current.setLanguage('en');
			});

			expect(localStorage.getItem('qabooster-language')).toBe('en');

			// Simula reload/remount
			const { result: result2 } = renderHook(() => useLanguage(), {
				wrapper: LanguageProvider,
			});

			expect(result2.current.language).toBe('en');
		});

		it('deve lidar com valores inválidos no localStorage', () => {
			localStorage.setItem('qabooster-language', 'invalid' as any);

			const { result } = renderHook(() => useLanguage(), {
				wrapper: LanguageProvider,
			});

			// Deve aceitar qualquer valor do localStorage (sem validação estrita)
			expect(result.current.language).toBe('invalid');
		});
	});

	describe('Cleanup', () => {
		it('deve remover event listener ao desmontar', () => {
			const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

			const { unmount } = renderHook(() => useLanguage(), {
				wrapper: LanguageProvider,
			});

			unmount();

			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				'language-changed',
				expect.any(Function),
			);

			removeEventListenerSpy.mockRestore();
		});
	});
});

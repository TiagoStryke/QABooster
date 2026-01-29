import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { vi } from 'vitest';

// Configurar React Testing Library para funcionar melhor com React 18
configure({
	asyncUtilTimeout: 5000,
	// Desabilitar act warnings automático
	reactStrictMode: false,
});

// Mock do Electron IPC
const mockIpcRenderer = {
	invoke: vi.fn(),
	on: vi.fn(),
	send: vi.fn(),
	removeAllListeners: vi.fn(),
};

global.ipcRenderer = mockIpcRenderer as any;

// Mock do window.require para Electron - SEM sobrescrever window completo
if (typeof window !== 'undefined') {
	(window as any).require = vi.fn((module: string) => {
		if (module === 'electron') {
			return {
				ipcRenderer: mockIpcRenderer,
			};
		}
		return {};
	});

	// Apenas adicionar mocks específicos, não sobrescrever
	if (!window.addEventListener) {
		window.addEventListener = vi.fn() as any;
	}
	if (!window.removeEventListener) {
		window.removeEventListener = vi.fn() as any;
	}
	if (!window.dispatchEvent) {
		window.dispatchEvent = vi.fn(() => true) as any;
	}
	if (!window.getComputedStyle) {
		window.getComputedStyle = vi.fn(() => ({
			getPropertyValue: vi.fn(() => ''),
		})) as any;
	}
}

// Mock do localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
		get length() {
			return Object.keys(store).length;
		},
		key: (index: number) => {
			const keys = Object.keys(store);
			return keys[index] || null;
		},
	};
})();

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
	writable: true,
});

// Mock do matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock do AudioContext
class MockAudioContext {
	currentTime = 0;
	destination = {};
	createOscillator = vi.fn(() => ({
		connect: vi.fn(),
		frequency: { value: 0 },
		type: 'sine',
		start: vi.fn(),
		stop: vi.fn(),
	}));
	createGain = vi.fn(() => ({
		connect: vi.fn(),
		gain: {
			value: 0,
			setValueAtTime: vi.fn(),
			exponentialRampToValueAtTime: vi.fn(),
		},
	}));
}

global.AudioContext = MockAudioContext as any;

// Mock do CustomEvent para testes de eventos customizados
global.CustomEvent = class CustomEvent extends Event {
	detail: any;
	constructor(event: string, params?: any) {
		super(event, params);
		this.detail = params?.detail;
	}
} as any;

// Fix para o erro "Right-hand side of 'instanceof' is not an object"
// O problema é que jsdom às vezes não inicializa document.activeElement corretamente
Object.defineProperty(document, 'activeElement', {
	get() {
		return document.body;
	},
	configurable: true,
});

import { vi } from 'vitest';

/**
 * Mock do Fabric.js Canvas
 * Simula operações básicas do editor de imagens
 */
export const createMockFabricCanvas = () => ({
	setWidth: vi.fn(),
	setHeight: vi.fn(),
	setBackgroundImage: vi.fn((img: any, callback: Function) => callback()),
	add: vi.fn(),
	remove: vi.fn(),
	getObjects: vi.fn(() => []),
	discardActiveObject: vi.fn(),
	requestRenderAll: vi.fn(),
	renderAll: vi.fn(),
	toDataURL: vi.fn(() => 'data:image/png;base64,fake'),
	dispose: vi.fn(),
	on: vi.fn(),
	off: vi.fn(),
	setActiveObject: vi.fn(),
	getActiveObject: vi.fn(),
	clear: vi.fn(),
	setZoom: vi.fn(),
	isDrawingMode: false,
	backgroundColor: '#ffffff',
});

/**
 * Mock de objetos Fabric (Arrow, Circle, Text, etc)
 */
export const createMockFabricObject = (type: string) => ({
	type,
	set: vi.fn(),
	scale: vi.fn(),
	setCoords: vi.fn(),
	getBoundingRect: vi.fn(() => ({ left: 0, top: 0, width: 100, height: 100 })),
});

/**
 * Mock do módulo fabric completo
 */
export const mockFabric = {
	Canvas: vi.fn(function (this: any, element: any) {
		return createMockFabricCanvas();
	}),
	Image: {
		fromURL: vi.fn((url: string, callback: Function) => {
			const mockImg = createMockFabricObject('image');
			callback(mockImg);
		}),
	},
	Line: vi.fn(function (this: any, coords: number[], options: any) {
		return createMockFabricObject('line');
	}),
	Circle: vi.fn(function (this: any, options: any) {
		return createMockFabricObject('circle');
	}),
	IText: vi.fn(function (this: any, text: string, options: any) {
		return createMockFabricObject('i-text');
	}),
	Rect: vi.fn(function (this: any, options: any) {
		return createMockFabricObject('rect');
	}),
	Triangle: vi.fn(function (this: any, options: any) {
		return createMockFabricObject('triangle');
	}),
};

// Exporta para usar em vi.mock()
export default mockFabric;

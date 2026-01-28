import '@testing-library/jest-dom';
import { vi } from 'vitest';





































































































































































































































**Status**: 🟡 Em Desenvolvimento Ativo**Testes passando**: 17/18 (Theme System)  **Última atualização**: 28/01/2026  ---- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)- [React Testing Library](https://testing-library.com/react)- [Vitest Docs](https://vitest.dev/)## 🔗 Recursos5. **Mantenha testes isolados**: Cada teste deve funcionar independentemente4. **Use mocks com moderação**: Apenas quando necessário (IPC, APIs externas)3. **Evite testes frágeis**: Não dependa de IDs ou classes CSS2. **Teste comportamento, não implementação**: Foque no que o usuário vê1. **Escreva testes legíveis**: Use `describe` e `it` descritivos## 💡 Dicas6. ⏳ **Fase 6**: CI/CD + Coverage Reports + Badges5. ⏳ **Fase 5**: Testes de Integração4. ⏳ **Fase 4**: Componente ImageEditor (complexo - Fabric.js)3. ⏳ **Fase 3**: Componentes Principais (Toolbar, Gallery, Notes)2. 🚧 **Fase 2**: Contextos + Componentes Base (EM ANDAMENTO)1. ✅ **Fase 1**: Setup + Mocks + Theme System (CONCLUÍDO)## 🎯 Próximos Passos- `**/*.d.ts` - Arquivos de tipo TypeScript- `*.config.*` - Arquivos de configuração- `/node_modules/` - Dependências- `/dist/` - Código compilado- `/electron/` - Processo principal do Electron (testes E2E futuros)### Excluídos da Cobertura- **Statements**: 80%- **Branches**: 80%- **Funções**: 80%- **Linhas**: 80%## 📈 Metas de Cobertura```});  localStorage.clear();beforeEach(() => {```typescript**Solução**: Limpe o localStorage no `beforeEach`:### Problema: localStorage não persiste entre testes```const mockIpc = setupIpcMock();import { setupIpcMock } from '../mocks/electron.mock';```typescript**Solução**: Verifique se o mock está no `setup.ts` ou importe no teste:### Problema: Mock não está funcionando**Solução**: Conflito de React. Remova testes duplicados ou isole em suítes separadas.### Problema: "Should not already be working"```npm run test:run```bash**Solução**: Use `--run` para desabilitar watch mode### Problema: Testes lentos## 🐛 Troubleshooting```});  expect(mockIpc.invoke).toHaveBeenCalledWith('select-folder');  await user.click(screen.getByText('Selecionar Pasta'));    render(<FolderManager />);  );    mockElectronResponses.selectFolder('/pasta')  mockIpc.invoke.mockResolvedValueOnce(  const mockIpc = setupIpcMock();it('deve chamar IPC ao selecionar pasta', async () => {import { setupIpcMock, mockElectronResponses } from '../mocks/electron.mock';```typescript### 3. Teste com Mock do Electron```});  expect(screen.getByText('Modal Aberto')).toBeInTheDocument();  await user.click(button);  const button = screen.getByRole('button', { name: /abrir/i });  render(<MyComponent />);  const user = userEvent.setup();it('deve abrir modal ao clicar no botão', async () => {import userEvent from '@testing-library/user-event';```typescript### 2. Teste com Interação do Usuário```});  });    expect(screen.getByText('Texto Esperado')).toBeInTheDocument();    );      </LanguageProvider>        <MyComponent />      <LanguageProvider>    render(  it('deve renderizar corretamente', () => {describe('MyComponent', () => {import MyComponent from '../../components/MyComponent';import { LanguageProvider } from '../../contexts/LanguageContext';import { render, screen } from '@testing-library/react';import { describe, it, expect } from 'vitest';```typescript### 1. Teste de Componente React## 📝 Como Escrever Novos Testes- **happy-dom** - DOM leve e rápido para Node.js- **@testing-library/user-event** - Simular interações do usuário- **@testing-library/jest-dom** - Matchers customizados- **React Testing Library** - Testes centrados no usuário- **Vitest** - Framework de testes rápido e moderno## 🛠️ Tecnologias- Fluxo: Mudar idioma e verificar tradução completa- Fluxo: Trocar tema e verificar aplicação global- Fluxo: Criar pasta → Adicionar imagem → Editar → Gerar PDF#### Testes de Integração### ⏳ Planejado- ⏳ App.tsx (componente principal)- ⏳ ImageEditor (editor com Fabric.js)#### Componentes Complexos- ⏳ Toolbar (barra de ferramentas)- ⏳ NotesPanel (painel de notas)- ⏳ ImageGallery (galeria de imagens)#### Componentes Principais- ⏳ Settings (configurações)- 🚧 FolderManager (seleção de pastas)- 🚧 HelpTips (modal de ajuda)#### Componentes Base- 🚧 LanguageContext (provider, hook, tradução)#### Contextos### 🚧 Em Progresso- ✅ **Fabric.js**: Canvas, objetos, operações de desenho- ✅ **window.require**: Para importar módulos Electron- ✅ **AudioContext**: Para sons de feedback- ✅ **window.matchMedia**: Para media queries- ✅ **localStorage**: getItem, setItem, removeItem, clear- ✅ **Electron IPC**: invoke, on, send, removeAllListeners#### Mocks- ✅ Validação de cores (success, error, warning)- ✅ Múltiplas trocas de tema funcionam- ✅ Troca de temas sem deixar resíduos- ✅ Função `applyTheme()` aplica CSS variables corretamente- ✅ Cores em formato hexadecimal válido (#RRGGBB)- ✅ Cada tema tem todas as propriedades necessárias- ✅ Todos os 6 temas existem (blue, dark, grey, rose, light, green)#### Theme System (/src/theme/themes.ts)### ✅ O Que Está Testado## 📊 Cobertura de Testes```npm run test:coverage```bash### Com Coverage```npm run test:run```bash### Executar Uma Vez```npm run test:ui```bash### Modo UI (Interface Gráfica)```npm test```bash### Modo Interativo (Watch Mode)## 🚀 Como Rodar os Testes```    └── FolderManager.test.tsx    # 🚧 Testes do FolderManager    ├── HelpTips.test.tsx         # 🚧 Testes do componente HelpTips└── components/│   └── LanguageContext.test.tsx  # 🚧 Testes do contexto de idioma├── contexts/│   └── themes.test.ts            # ✅ Testes do sistema de temas├── theme/│   └── fabric.mock.ts            # Mock do Fabric.js (canvas)│   ├── electron.mock.ts          # Mock do Electron IPC├── mocks/├── setup.ts                      # Configuração global + mockssrc/tests/```## 🏗️ Estrutura de Testes- 🚧 **Componentes** (infraestrutura pronta, aguardando fixes)- ✅ **Configuração** (Vitest + React Testing Library)- ✅ **Mocks** (Electron, Fabric.js, Browser APIs)- ✅ **Theme System** (17/18 passando - 94%)**Testes Implementados:**## ✅ Status Atual
// Mock do Electron IPC
const mockIpcRenderer = {
	invoke: vi.fn(),
	on: vi.fn(),
	send: vi.fn(),
	removeAllListeners: vi.fn(),
};

global.ipcRenderer = mockIpcRenderer as any;

// Mock do window.require para Electron
(global as any).window = {
	...global.window,
	require: vi.fn((module: string) => {
		if (module === 'electron') {
			return {
				ipcRenderer: mockIpcRenderer,
			};
		}
		return {};
	}),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	dispatchEvent: vi.fn(() => true),
	getComputedStyle: vi.fn(() => ({
		getPropertyValue: vi.fn(() => ''),
	})),
};

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

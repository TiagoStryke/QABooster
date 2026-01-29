# 🧪 Guia Completo de Testes - QABooster

## 📊 Status Atual

**69 de 137 testes passando (50.4%)**

### ✅ Arquivos 100% Passando (48 testes)

- `themes.test.ts` - 18/18 ✨
- `LanguageContext.test.tsx` - 13/13 ✨
- `HelpTips.test.tsx` - 17/17 ✨

### 🚧 Arquivos Parcialmente Passando (21 testes)

- `ImageGallery.test.tsx` - 5/9 (55%)
- `Settings.test.tsx` - 7/14 (50%)
- `FolderManager.test.tsx` - 7/16 (44%)
- `NotesPanel.test.tsx` - 2/10 (20%)

### ❌ Arquivos com Implementação Completa mas Falhando

- `Toolbar.test.tsx` - 0/17 (0%)
- `ImageEditor.test.tsx` - 0/23 (0%)
- `App.test.tsx` - Novo! Testes de integração do componente principal
- `workflow.test.tsx` - Novo! Testes E2E de fluxos completos

---

## 🚀 Como Rodar os Testes

### Comandos Principais

```bash
# Rodar todos os testes (watch mode)
npm test

# Rodar uma vez (CI mode)
npm run test:run

# Rodar com interface gráfica
npm run test:ui

# Rodar com coverage
npm run test:coverage

# Rodar arquivo específico
npm run test:run src/tests/theme/themes.test.ts
npm run test:run src/tests/components/HelpTips.test.tsx
```

### Comandos por Categoria

```bash
# Testes Unitários - Theme System
npm run test:run src/tests/theme/

# Testes Unitários - Contexts
npm run test:run src/tests/contexts/

# Testes Unitários - Componentes Base
npm run test:run src/tests/components/HelpTips.test.tsx
npm run test:run src/tests/components/FolderManager.test.tsx

# Testes Unitários - Componentes Principais
npm run test:run src/tests/components/ImageGallery.test.tsx
npm run test:run src/tests/components/ImageEditor.test.tsx
npm run test:run src/tests/components/NotesPanel.test.tsx
npm run test:run src/tests/components/Settings.test.tsx
npm run test:run src/tests/components/Toolbar.test.tsx

# Testes de Integração - App Principal
npm run test:run src/tests/App.test.tsx

# Testes de Integração - Fluxos Completos
npm run test:run src/tests/integration/workflow.test.tsx
```

---

## 🏗️ Estrutura da Pirâmide de Testes

```
                    /\
                   /  \
                  / E2E \          ← Testes de Integração (workflow.test.tsx)
                 /______\
                /        \
               /Integration\        ← Testes de Integração (App.test.tsx)
              /____________\
             /              \
            /   Component    \      ← Testes de Componentes (components/*.test.tsx)
           /________________\
          /                  \
         /      Unit Tests     \    ← Testes Unitários (theme, contexts, utils)
        /______________________\

```

### 📦 Camadas Implementadas

#### 1️⃣ **Testes Unitários (Base da Pirâmide)** ✅ COMPLETO

Testam funções isoladas e lógica pura.

**Arquivos:**

- `src/tests/theme/themes.test.ts` - Sistema de temas
- `src/tests/contexts/LanguageContext.test.tsx` - Context de idioma
- `src/tests/mocks/electron.mock.ts` - Mocks do Electron
- `src/tests/mocks/fabric.mock.ts` - Mocks do Fabric.js

**Status:** ✅ 100% dos testes unitários passando

---

#### 2️⃣ **Testes de Componentes (Meio da Pirâmide)** 🚧 PARCIAL

Testam componentes React isolados com mocks.

**Arquivos Implementados:**

- `src/tests/components/HelpTips.test.tsx` ✅ 17/17
- `src/tests/components/FolderManager.test.tsx` 🚧 7/16
- `src/tests/components/ImageGallery.test.tsx` 🚧 5/9
- `src/tests/components/ImageEditor.test.tsx` ❌ 0/23
- `src/tests/components/NotesPanel.test.tsx` 🚧 2/10
- `src/tests/components/Settings.test.tsx` 🚧 7/14
- `src/tests/components/Toolbar.test.tsx` ❌ 0/17

**O que falta corrigir:**

- Timeouts em testes com `userEvent.click` (principalmente Toolbar, ImageEditor)
- Mocks de IPC não estão retornando dados esperados
- Fabric.js canvas mock precisa de mais métodos

---

#### 3️⃣ **Testes de Integração - App** ✅ IMPLEMENTADO

Testam o componente principal e suas interações.

**Arquivo:** `src/tests/App.test.tsx`

**Cenários Testados:**

- ✅ Renderização inicial
- ✅ Aplicação de tema
- ✅ Seleção e criação de pastas
- ✅ Gerenciamento de imagens
- ✅ Auto-save de headerData
- ✅ Abertura de editor e notas

**Status:** Implementado, pode ter falhas (não validado ainda)

---

#### 4️⃣ **Testes E2E - Fluxos Completos** ✅ IMPLEMENTADO

Testam jornadas completas do usuário (topo da pirâmide).

**Arquivo:** `src/tests/integration/workflow.test.tsx`

**Fluxos Implementados:**

1. **Novo Teste Completo**
   - Criar pasta → Capturar screenshot → Preencher header → Gerar PDF

2. **Continuar Teste Existente**
   - Abrir pasta existente → Carregar dados → Adicionar screenshots

3. **Screenshot → Editar → Salvar**
   - Capturar → Abrir editor → Adicionar anotações → Salvar

4. **Gerenciar Notas**
   - Abrir notas → Adicionar texto → Adicionar imagens → Auto-save

5. **Múltiplas Screenshots**
   - Capturar várias → Reordenar → Gerar PDF na ordem correta

6. **Trocar Tema/Idioma**
   - Abrir settings → Trocar tema → Trocar idioma → Continuar teste

**Status:** Implementado, pode ter falhas (não validado ainda)

---

## 🛠️ Tecnologias Usadas

- **Vitest 4.0.18** - Framework de testes (rápido e moderno)
- **React Testing Library** - Testes centrados no usuário
- **@testing-library/user-event** - Simular interações do usuário
- **@testing-library/jest-dom** - Matchers customizados
- **jsdom 24** - Ambiente DOM para testes
- **happy-dom** - (removido, usando jsdom)

---

## 📝 Configuração

### vitest.config.ts

```typescript
{
  globals: true,
  environment: 'jsdom',
  testTimeout: 10000, // 10 segundos
  isolate: true,
  singleThread: true,
  setupFiles: ['./src/tests/setup.ts']
}
```

### Mocks Globais (setup.ts)

- ✅ Electron IPC (invoke, on, send)
- ✅ localStorage
- ✅ window.matchMedia
- ✅ AudioContext
- ✅ CustomEvent
- ✅ window.require

---

## 🐛 Problemas Conhecidos e TODOs

### 🔴 Problemas Atuais (NÃO URGENTE - Implementar features primeiro!)

1. **Timeouts (5-10s) em testes com userEvent**
   - `FolderManager` - Cliques em botões não funcionam
   - `ImageGallery` - Botões de preview/delete/edit
   - `NotesPanel` - Todos os testes com interação
   - `Toolbar` - Todos os testes (0/17)
   - `ImageEditor` - Todos os testes (0/23)

2. **Mocks de IPC não retornam dados esperados**
   - `read-image-as-base64` não resolve corretamente
   - `capture-screenshot` precisa simular evento

3. **Fabric.js mock incompleto**
   - Faltam métodos: `setZoom`, `isDrawingMode`
   - Canvas não simula desenho real

4. **React 18 Concurrent Mode**
   - Alguns warnings "Should not already be working"
   - cleanup() resolve parcialmente

### ✅ O Que Já Funciona Perfeitamente

- ✅ Sistema de temas (18/18 testes)
- ✅ Context de idioma (13/13 testes)
- ✅ HelpTips component (17/17 testes)
- ✅ Mocks de Electron IPC
- ✅ Mocks de browser APIs
- ✅ Estrutura de testes bem organizada

---

## 📋 Plano de Ação

### 🎯 Fase 1: IMPLEMENTAR NOVAS FEATURES (AGORA!)

Ignorar testes quebrados e focar nas features.

### 🎯 Fase 2: Corrigir Testes Quebrados (DEPOIS)

#### Prioridade Alta

1. Corrigir timeouts do userEvent
2. Melhorar mocks de IPC
3. Completar mock do Fabric.js

#### Prioridade Média

4. Validar testes de integração (App.test.tsx)
5. Validar testes E2E (workflow.test.tsx)
6. Aumentar coverage para 80%

#### Prioridade Baixa

7. Otimizar velocidade dos testes
8. Adicionar testes de snapshot (opcional)

---

## 📈 Cobertura de Código (Meta: 80%)

```bash
# Rodar coverage
npm run test:coverage

# Abrir relatório HTML
open coverage/index.html
```

**Configuração Atual:**

- Provider: v8 (nativo do Node.js)
- Thresholds: 80% (lines, functions, branches, statements)
- Excludes: node_modules, dist, electron, tests, config files

---

## 🎓 Boas Práticas Implementadas

### ✅ Seguindo a Pirâmide

- Muitos testes unitários (rápidos, baratos)
- Alguns testes de componentes (médios)
- Poucos testes de integração (lentos, caros)

### ✅ Testes Legíveis

- Nomes descritivos em português
- Arrange-Act-Assert pattern
- Comentários explicativos

### ✅ Isolamento

- Cada teste é independente
- Mocks são resetados no beforeEach
- cleanup() no afterEach

### ✅ Mocks Realistas

- IPC retorna dados esperados
- Fabric.js simula canvas
- Browser APIs mockadas

---

## 🔗 Recursos Úteis

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Electron Testing Guide](https://www.electronjs.org/docs/latest/tutorial/automated-testing)

---

## 📞 Dúvidas?

Para adicionar novos testes:

1. **Testes Unitários** → `src/tests/utils/` ou `src/tests/theme/`
2. **Testes de Componentes** → `src/tests/components/`
3. **Testes de Integração** → `src/tests/` ou `src/tests/integration/`

**Padrão de Nomes:**

- `*.test.ts` - Testes unitários (funções)
- `*.test.tsx` - Testes de componentes (React)
- `workflow.test.tsx` - Testes E2E

---

**Última Atualização:** 29/01/2026
**Status:** 69/137 testes passando (50.4%)
**Próximo Passo:** Implementar novas features! Testes serão corrigidos depois. 🚀

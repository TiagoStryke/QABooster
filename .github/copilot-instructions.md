# QA Booster - Screenshot & Evidence Generator

Electron + React + TypeScript application for QA testers to capture, organize, edit screenshots and generate professional PDF reports with customizable headers.

## 📋 Project Overview

**Purpose**: Streamline QA testing workflow by providing a comprehensive tool for:

- Capturing screenshots with global shortcuts (fullscreen, area, quick copy)
- Organizing test evidence in folders with automatic naming
- Editing screenshots with annotations (arrows, circles, text, highlights)
- Generating branded PDF reports with test metadata
- Supporting multi-monitor setups with cursor capture

**Target Users**: QA Engineers, Test Analysts, Software Testers

---

## ✅ Refactoring Status (UPDATED 2026-02-06)

### **FASE 1: Custom Hooks Extraction** ✅ COMPLETE

- **App.tsx**: 418 → 108 linhas (74% redução)
- **Hooks criados:**
  - `useFolderManager.ts` - Gerenciamento de pastas
  - `useHeaderData.ts` - Dados do header de teste
  - `useImageManager.ts` - Gerenciamento de imagens
  - `useScreenshotListeners.ts` - Listeners de screenshot
  - `useShortcutSync.ts` - Sincronização de atalhos
  - `useThemeManager.ts` - Gerenciamento de temas

### **FASE 2: IPC Service Centralization** ✅ COMPLETE

- **ipc-service.ts criado**: 373 linhas, 35+ métodos tipados
- **14 arquivos atualizados** para usar serviço centralizado
- Remove chamadas diretas `ipcRenderer.invoke()` dos componentes
- Tipagem TypeScript completa para todas operações IPC

### **FASE 3: Component Refactoring** ✅ COMPLETE

#### Etapa 1: ImageEditor (Commit 1c0e51d)

- **ImageEditor.tsx**: 941 → 127 linhas (86.5% redução)
- **Hooks criados:**
  - `useEditorState.ts` (60 linhas) - Estado do editor
  - `useEditorCanvas.ts` (580 linhas) - Fabric.js + 8 ferramentas desenho
- **Componentes:**
  - `EditorToolbar.tsx` (320 linhas) - UI da toolbar extraída

#### Etapa 2: Settings + Toolbar (Commit 65d86e3)

- **Settings.tsx**: 516 → 284 linhas (45% redução)
  - `useSettingsState.ts` (200 linhas) - Gerencia 6 configs + 3 shortcuts
  - `ShortcutEditor.tsx` (90 linhas) - Componente reutilizável shortcuts
- **Toolbar.tsx**: 493 → 167 linhas (66% redução)
  - `useToolbarState.ts` (140 linhas) - Displays + área fixa
  - `pdf-generator-service.ts` (240 linhas) - Lógica de PDF extraída

**TOTAIS FASE 3:**

- 3 componentes refatorados: 1950 → 578 linhas (70% redução)
- 4 hooks criados
- 2 componentes novos
- 1 serviço novo

### **FASE 4: Context API** 🔄 PENDING

- Status: Avaliação necessária (prop drilling moderado detectado)
- Next steps: Avaliar necessidade de FolderContext/TestDataContext

---

## 🏗️ Architecture & Project Structure

### **Main Process (Electron Backend)**

Location: `/electron/main.ts` and related modules

**CRITICAL**: The main.ts file is being refactored to follow clean architecture:

```
electron/
├── main.ts                    # Entry point (orchestration only)
├── config/
│   ├── app-config.ts         # Global state & constants
│   └── window-config.ts      # Window configurations
├── windows/
│   ├── main-window.ts        # Main window management
│   ├── overlay-window.ts     # Area selector overlay
│   └── tray.ts               # System tray
├── handlers/
│   ├── screenshot-handlers.ts
│   ├── folder-handlers.ts
│   ├── pdf-handlers.ts
│   ├── display-handlers.ts
│   └── settings-handlers.ts
├── services/
│   ├── screenshot-service.ts  # Screenshot capture logic
│   ├── cursor-service.ts      # Cursor overlay
│   ├── file-service.ts        # File operations
│   └── display-service.ts     # Display management
├── utils/
│   ├── filename-generator.ts  # Sequential naming
│   └── shortcut-manager.ts    # Global shortcuts
└── assets/
    ├── cursor.svg             # Cursor graphic
    └── tray-icon.svg          # Tray icon
```

**IMPORTANT RULES FOR MAIN PROCESS:**

- ✅ Always use modular structure - NO 1000+ line files
- ✅ Separate concerns: handlers, services, windows, utils
- ✅ Use AppState class for global state management
- ✅ Use APP_CONSTANTS for all hardcoded values
- ✅ IPC handlers must be organized by domain (screenshot, folder, pdf, etc.)
- ❌ NEVER inline SVGs or large HTML - use asset files
- ❌ NEVER duplicate screenshot logic - use services

### **Renderer Process (React Frontend)**

Location: `/src/`

```
src/
├── App.tsx                    # Main app (108 linhas após FASE 1)
├── components/
│   ├── Header.tsx            # Test metadata form
│   ├── Toolbar.tsx           # Screenshot controls (167 linhas - REFATORADO)
│   ├── ImageGallery.tsx      # Drag-drop image organization
│   ├── ImageEditor.tsx       # Fabric.js editor (127 linhas - REFATORADO)
│   ├── EditorToolbar.tsx     # Editor toolbar UI (NOVO - FASE 3)
│   ├── Settings.tsx          # App preferences (284 linhas - REFATORADO)
│   ├── ShortcutEditor.tsx    # Reutilizável shortcuts UI (NOVO - FASE 3)
│   ├── FolderManager.tsx     # Folder selection/creation
│   └── MainLayout.tsx        # Layout principal
├── hooks/                     # Custom Hooks (FASE 1 + FASE 3)
│   ├── useFolderManager.ts   # Gerenciamento de pastas
│   ├── useHeaderData.ts      # Dados do header
│   ├── useImageManager.ts    # Gerenciamento de imagens
│   ├── useScreenshotListeners.ts  # Listeners de screenshot
│   ├── useShortcutSync.ts    # Sincronização de atalhos
│   ├── useThemeManager.ts    # Gerenciamento de temas
│   ├── useEditorState.ts     # Estado do editor de imagens (FASE 3)
│   ├── useEditorCanvas.ts    # Canvas Fabric.js (FASE 3)
│   ├── useSettingsState.ts   # Estado de configurações (FASE 3)
│   └── useToolbarState.ts    # Estado da toolbar (FASE 3)
├── services/                  # Service Layer (FASE 2 + FASE 3)
│   ├── ipc-service.ts        # IPC centralizado (373 linhas)
│   └── pdf-generator-service.ts  # Geração de PDFs (240 linhas - FASE 3)
├── contexts/
│   ├── LanguageContext.tsx   # i18n state management
│   └── ThemeContext.tsx      # Theme state management
├── i18n/
│   └── translations.ts       # PT & EN translations
├── assets/
│   ├── icons/                # Status icons (approved, reproved, partial)
│   └── logos/                # Company logos
└── tests/                    # Jest + React Testing Library
    └── components/
```

**IMPORTANT RULES FOR RENDERER:**

- ✅ All user-facing text MUST use `t()` function from LanguageContext
- ✅ Use custom hooks for business logic (FASE 1 pattern)
- ✅ Use ipcService for ALL Electron communication (FASE 2 pattern)
- ✅ Extract complex components into hooks + sub-components (FASE 3 pattern)
- ✅ Component files should be < 300 lines (split if larger)
- ✅ Use TypeScript interfaces for all props and state
- ✅ Follow React hooks best practices (useEffect dependencies)
- ✅ Use Tailwind CSS for styling (NO inline styles except dynamic)
- ❌ NEVER hardcode text strings - always add to translations.ts
- ❌ NEVER bypass i18n - every label, button, message needs translation
- ❌ NEVER call ipcRenderer directly - use ipcService
- ❌ NEVER create monolithic components > 500 lines

---

## � Refactoring Patterns (FASES 1-3)

### **Pattern 1: Extract Business Logic to Hooks**

**When:** Component has > 150 lines of useState/useEffect/handlers
**How:**

1. Create `use[ComponentName]State.ts` hook
2. Move all state declarations and handlers
3. Return object with state + handlers
4. Component becomes thin "presentation layer"

**Example:** `ImageEditor.tsx` (941 → 127 lines)

- Created `useEditorState.ts` + `useEditorCanvas.ts`
- Component only handles UI and event wiring

### **Pattern 2: Extract Complex UI to Sub-Components**

**When:** Component has > 100 lines of JSX or repetitive UI blocks
**How:**

1. Identify repetitive/complex UI sections
2. Create new component with clear props interface
3. Extract to separate file (e.g., `EditorToolbar.tsx`)
4. Parent passes state via props

**Example:** `Settings.tsx` → `ShortcutEditor.tsx`

- 3 duplicate shortcut blocks → 1 reusable component
- Reduced repetition by 200+ lines

### **Pattern 3: Extract Business Logic to Services**

**When:** Component has complex algorithms/calculations (not UI-related)
**How:**

1. Create `[domain]-service.ts` in `/services`
2. Export pure functions (input → output, no React hooks)
3. Component imports and calls service functions
4. Service can be easily tested in isolation

**Example:** `Toolbar.tsx` → `pdf-generator-service.ts`

- 250 lines of PDF generation logic → separate service
- Component reduced to 167 lines (UI + orchestration)

### **Pattern 4: Centralize External Communication**

**When:** Multiple components call same external APIs (IPC, HTTP, etc.)
**How:**

1. Create centralized service (e.g., `ipc-service.ts`)
2. All methods typed with TypeScript interfaces
3. Single source of truth for API calls
4. Easy to mock for testing

**Example:** FASE 2 - `ipc-service.ts`

- 35+ IPC methods centralized
- No more scattered `ipcRenderer.invoke()` calls

### **Refactoring Checklist (Before/After)**

Before refactoring a component, check:

- [ ] Component > 300 lines?
- [ ] Multiple responsibilities (UI + logic + state)?
- [ ] Repetitive code blocks?
- [ ] Hard to test/understand?
- [ ] Complex algorithms mixed with JSX?

After refactoring, verify:

- [ ] Zero TypeScript errors
- [ ] All functionality preserved
- [ ] Component < 300 lines
- [ ] Clear separation of concerns
- [ ] Reusable hooks/components/services created
- [ ] Updated copilot-instructions.md

---

## �🌍 Internationalization (i18n)

**CRITICAL RULE**: This app supports PT (Portuguese) and EN (English). ALL user-facing text must be translatable.

### How to Add New Text:

1. **Add to `/src/i18n/translations.ts`:**

```typescript
export const translations = {
	pt: {
		yourNewKey: 'Texto em Português',
		yourNewKeyDesc: 'Descrição opcional',
	},
	en: {
		yourNewKey: 'Text in English',
		yourNewKeyDesc: 'Optional description',
	},
};
```

2. **Use in components:**

```typescript
import { useLanguage } from '../contexts/LanguageContext';

function YourComponent() {
  const { t } = useLanguage();
  return <button>{t('yourNewKey')}</button>;
}
```

**FORBIDDEN**:

- ❌ `<button>Save</button>` - hardcoded text
- ❌ `alert('Error occurred')` - hardcoded messages
- ❌ `console.log('Debug info')` - OK for debug, but user messages must be translated

**REQUIRED**:

- ✅ `<button>{t('save')}</button>`
- ✅ `mainWindow?.webContents.send('error', { key: 'errorOccurred' })`
- ✅ All labels, buttons, tooltips, error messages, descriptions

---

## 🎨 Styling & Design Standards

### Theme System

- Uses ThemeContext with multiple themes: `blue`, `dark`, `light`, `purple`, `green`
- Tailwind CSS with custom color schemes
- Dark mode optimized (primary theme)

### Color Palette:

- **Primary (GOL Orange)**: `#FF6B00` - Used for branding, highlights
- **Background**: `#0f172a` (slate-900)
- **Text**: `#e2e8f0` (slate-200)
- **Success**: `#22c55e` (green-500)
- **Error**: `#ef4444` (red-500)

### Styling Rules:

- ✅ Use Tailwind utility classes
- ✅ Use theme colors: `bg-primary-500`, `text-primary-600`
- ✅ Responsive design (though app is desktop-only)
- ❌ NO inline styles except for dynamic values (coordinates, sizes)
- ❌ NO custom CSS files (Tailwind only)

---

## 📸 Screenshot Feature Architecture

### Capture Modes:

1. **Fullscreen** (`Cmd+Shift+S`): Captures entire selected monitor
2. **Area** (`Cmd+Shift+A`): Opens overlay to select region
3. **Quick Copy** (`Cmd+Shift+Q`): Copies to clipboard without saving

### Screenshot Flow:

```
User Presses Shortcut
  ↓
desktopCapturer.getSources()  # Electron API
  ↓
Check if cursor should be added (cursorInScreenshots setting)
  ↓
addCursorToScreenshot() via executeJavaScript (Canvas API)
  ↓
Save to folder (sequential naming: screenshot-001.png)
  ↓
Optional: Copy to clipboard (copyToClipboard setting)
  ↓
Notify renderer (screenshot-captured event)
  ↓
Update ImageGallery
```

### Multi-Monitor Support:

- Uses `screen.getAllDisplays()` to detect monitors
- Tracks cursor position with bounds checking
- Only draws cursor if within selected display
- Relative coordinates: `cursorX - display.bounds.x`

**DO NOT** change this logic without understanding multi-monitor edge cases!

---

## 📄 PDF Generation

Location: `/src/components/Toolbar.tsx` → `generatePDF()`

### PDF Structure:

1. **Header Page**:
   - GOL Logo (centered)
   - Title: "Evidência de Testes de QA"
   - Test metadata with orange border box:
     - Test Result (with status icon)
     - System, Test Cycle, Test Case, Executor, Date/Time
2. **Screenshot Pages**:
   - One image per page
   - Maintains aspect ratio
   - Supports portrait/landscape orientation

### Status Icons:

- ✅ Approved: `/src/assets/icons/approved.png`
- ❌ Reproved: `/src/assets/icons/reproved.png`
- ⚠️ Partial: `/src/assets/icons/partial.png`

**PDF Rules:**

- ✅ Use jsPDF library
- ✅ Load images via IPC (`read-image-as-base64`)
- ✅ Include status icons next to result text
- ✅ Orange border (#FF6B00) around header data
- ❌ DO NOT hardcode paths - use currentFolder
- ❌ DO NOT break existing PDF layout

---

## 🔧 Settings & Preferences

Managed via Settings modal + localStorage + IPC communication

### Available Settings:

- **PDF Orientation**: Portrait / Landscape
- **Language**: PT / EN
- **Theme**: Blue / Dark / Light / Purple / Green
- **Copy to Clipboard**: Auto-copy screenshots
- **Sound Enabled**: Play sound on capture
- **Cursor in Screenshots**: Draw cursor overlay

### Settings Flow:

```
User toggles checkbox in Settings.tsx
  ↓
Update localStorage ('qabooster-{setting-name}')
  ↓
Send IPC message to main process
  ↓
Update global state in main.ts
  ↓
Apply setting to future operations
```

**Pattern to Follow:**

```typescript
// Settings.tsx
const [setting, setSetting] = useState<boolean>(
	localStorage.getItem('qabooster-setting') !== 'false', // default true
);

const handleSettingChange = (enabled: boolean) => {
	setSetting(enabled);
	localStorage.setItem('qabooster-setting', enabled.toString());
	ipcRenderer.invoke('set-setting', enabled);
};

// main.ts
ipcMain.handle('set-setting', async (_, enabled: boolean) => {
	globalSettingVariable = enabled;
	return true;
});
```

---

## 🧪 Testing

Framework: **Jest + React Testing Library**

Location: `/src/tests/`

### Testing Rules:

- ✅ Test user interactions (clicks, inputs, drag-drop)
- ✅ Mock Electron IPC calls
- ✅ Test component rendering with different props
- ✅ Verify translation keys exist
- ❌ DO NOT test implementation details
- ❌ DO NOT skip accessibility tests

### Running Tests:

```bash
npm test
```

---

## 🚀 Development Workflow

### Prerequisites:

```bash
npm install
```

### Development:

```bash
npm run dev  # Starts Vite + Electron in watch mode
```

### Build:

```bash
npm run build        # Compile TypeScript
npm run package      # Create distributable
```

### File Watching:

- TypeScript (main process): Auto-compiles to `/dist`
- React (renderer): Vite hot-reload on http://localhost:3000
- Assets: Copied to `/dist/area-selector`

---

## ✅ Code Quality Standards

### TypeScript:

- ✅ Strict mode enabled
- ✅ No `any` types (use proper interfaces)
- ✅ Explicit return types for functions
- ✅ Use type imports: `import type { Type } from 'module'`

### React:

- ✅ Functional components with hooks
- ✅ Proper dependency arrays in useEffect
- ✅ Memoization for expensive operations (useMemo, useCallback)
- ✅ Destructure props at function signature

### Electron:

- ✅ Separate main/renderer concerns
- ✅ Use IPC for all cross-process communication
- ✅ Handle errors gracefully (try-catch in handlers)
- ✅ Clean up resources (close windows, unregister shortcuts)

### File Organization:

- ✅ One component per file
- ✅ Co-locate tests with components
- ✅ Group related utilities in `/utils`
- ✅ Keep services stateless when possible

### Naming Conventions:

- **Components**: PascalCase (`ImageEditor.tsx`)
- **Functions**: camelCase (`getNextFilename()`)
- **Constants**: UPPER_SNAKE_CASE (`APP_CONSTANTS`)
- **Interfaces**: PascalCase (`HeaderData`, `ImageData`)
- **Files**: kebab-case for configs (`app-config.ts`)

---

## 🚨 Critical Don'ts

### ❌ NEVER:

1. **Break i18n**: All text must be translatable
2. **Hardcode paths**: Use `__dirname`, `app.getAppPath()`
3. **Ignore multi-monitor**: Test with 2+ displays
4. **Create 1000+ line files**: Refactor into modules
5. **Skip error handling**: Wrap IPC handlers in try-catch
6. **Mutate state directly**: Use setState/useState properly
7. **Inline large assets**: Use separate files
8. **Commit without testing**: Run `npm test` before commits
9. **Change IPC signatures**: Frontend depends on them
10. **Remove TypeScript types**: Keep strict typing

### ✅ ALWAYS:

1. **Add translations**: PT and EN for every string
2. **Test on multiple monitors**: Cursor and bounds
3. **Use proper TypeScript types**: No `any`
4. **Follow existing patterns**: Check similar components
5. **Handle errors gracefully**: Show user-friendly messages
6. **Clean up resources**: Remove listeners, close windows
7. **Document complex logic**: Add comments for edge cases
8. **Validate user input**: Check before file operations
9. **Use constants**: Never magic numbers/strings
10. **Respect architecture**: Follow folder structure

---

## 📚 Key Dependencies

- **electron**: Desktop app framework
- **react**: UI library
- **typescript**: Type safety
- **tailwindcss**: Utility-first CSS
- **fabric**: Canvas-based image editor
- **jspdf**: PDF generation
- **jest**: Testing framework
- **react-testing-library**: Component testing

---

## 🔗 IPC Communication Patterns

### Main → Renderer:

```typescript
mainWindow?.webContents.send('event-name', data);
```

### Renderer → Main (async):

```typescript
const result = await ipcRenderer.invoke('handler-name', params);
```

### Renderer → Main (sync event):

```typescript
ipcRenderer.send('event-name', data);
```

**All IPC handlers must:**

- Return success/error objects
- Handle exceptions with try-catch
- Validate input parameters
- Use TypeScript types

---

## 🎯 Summary for GitHub Copilot

When making changes to this project:

1. **Respect i18n** - Add all text to translations.ts (PT + EN)
2. **Follow architecture** - Use modular structure, no giant files
3. **Maintain TypeScript** - Proper types, no `any`
4. **Use existing patterns** - Check similar code before implementing
5. **Test thoroughly** - Multi-monitor, all screenshot modes, PDF generation
6. **Don't break IPC** - Frontend depends on exact handler signatures
7. **Keep it clean** - Constants, services, utilities in right places
8. **Document when needed** - Complex logic needs comments
9. **Update these instructions** - When features change, update this file

**This is a production app used by QA professionals. Stability and reliability are critical.**

---

## 📝 Maintaining This Documentation

**CRITICAL**: These instructions must be kept up-to-date with the codebase.

**When to update copilot-instructions.md:**

- ✅ Adding new features or components
- ✅ Changing architecture or folder structure
- ✅ Modifying critical workflows (screenshot, PDF, etc.)
- ✅ Adding/removing dependencies or tools
- ✅ Changing IPC handler signatures
- ✅ Updating coding standards or patterns
- ✅ Discovering new bugs or edge cases
- ✅ Refactoring major modules

**How to update:**

1. Edit `.github/copilot-instructions.md` in the same commit as code changes
2. Keep descriptions concise but complete
3. Remove outdated information
4. Update examples if APIs changed
5. Maintain the existing structure and sections

**Golden Rule:** If you changed how something works, update the instructions. Future you (and Copilot) will thank you.

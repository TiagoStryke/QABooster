# Testing Guide - QABooster

## Status: 17/18 tests passing (94%)

Complete test infrastructure implemented!

## Run Tests

```bash
npm test              # Watch mode
npm run test:ui       # UI interface
npm run test:run      # Run once
npm run test:coverage # With coverage
```

## What's Tested

### Theme System (94% - 17/18 passing)

- 6 themes (blue, dark, grey, rose, light, green)
- applyTheme() function with CSS variables
- Hex color validation
- Multiple theme switches

### Mocks Implemented

- **Electron IPC**: invoke, on, send
- **localStorage**: Complete
- **window.matchMedia**: Media queries
- **AudioContext**: Feedback sounds
- **Fabric.js**: Canvas + objects

### Components (infrastructure ready)

- LanguageContext
- HelpTips
- FolderManager

## Structure

```
src/tests/
├── setup.ts
├── mocks/
│   ├── electron.mock.ts
│   └── fabric.mock.ts
├── theme/
│   └── themes.test.ts
└── components/
```

## Coverage Goals

- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

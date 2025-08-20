# Code Style and Conventions

## TypeScript Configuration
- **Module System**: ESNext modules with bundler module resolution
- **Target**: ESNext
- **No DOM types** (server-side/Node.js environment)
- **Strict TypeScript** with library preset from @total-typescript

## Code Formatting (Biome)
- **Line Width**: 120 characters
- **Quote Style**: Single quotes for JavaScript/TypeScript
- **Indentation**: Tabs (following .editorconfig)
- **Organize Imports**: Enabled (automatic import sorting)
- **EditorConfig**: Respected for formatting

## File Structure
- **Source Code**: `src/` directory
- **Tests**: `test/` directory with `.test.ts` suffix
- **Build Output**: `lib/` directory (gitignored)
- **Configuration**: Root level config files (tsconfig.json, biome.jsonc, etc.)

## Naming Conventions
- **Files**: kebab-case or lowercase (e.g., `outline.ts`, `vscode-stub.ts`)
- **Functions**: camelCase (e.g., `parseFunctionBlocks`, `makeVarSymbolsForNode`)
- **Constants**: UPPER_CASE or camelCase for exported constants
- **Interfaces/Types**: PascalCase (e.g., `FunctionBlock`)
- **VSCode Commands**: Dot notation (e.g., `extension.applescript.run`)

## Testing
- **Framework**: Vitest
- **Test Files**: Located in `test/` directory
- **Naming**: `*.test.ts` for test files
- **Types**: Unit tests (`.unit.test.ts`) and parameterized tests (`.param.test.ts`)

## VSCode Extension Patterns
- Commands registered in `activate()` function
- Disposables pushed to `context.subscriptions`
- Language providers for document symbols
- Custom editors for binary files (.scpt)

## Import Style
- Node.js built-ins with `node:` prefix
- VSCode API from 'vscode'
- Relative imports for local modules
- Type imports where applicable
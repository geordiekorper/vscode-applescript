# Codebase Structure

## Core Source Files (`src/`)
- **index.ts** - Main entry point, registers all commands and activates the extension
- **osa.ts** - Handles osascript and osacompile command execution for running/compiling AppleScript
- **outline.ts** - Document symbol providers for outline view, includes parsers for AppleScript/JXA
- **processes.ts** - Process management functionality for terminating running scripts
- **task.ts** - Build task creation and management
- **util.ts** - Utility functions and helpers

## Configuration Files (Root)
- **package.json** - Extension manifest, commands, settings, dependencies
- **tsconfig.json** - TypeScript configuration
- **biome.jsonc** - Linting and formatting configuration
- **vitest.config.ts** - Test runner configuration
- **tsdown.config.ts** - Build tool configuration
- **lefthook.yml** - Git hooks configuration
- **commitlint.config.ts** - Commit message linting

## Resources (`resources/`)
- Icons for commands (dark/light themes)
- Logo and screenshots
- SVG assets for UI elements

## Language Support (`syntaxes/`, `snippets/`, `config/`)
- **syntaxes/** - TextMate grammar files for syntax highlighting
  - applescript.tmLanguage
  - jxa.tmLanguage
  - codeblock.json (markdown injection)
- **snippets/** - Code snippets for AppleScript
- **config/** - Language configuration files

## Tests (`test/`)
- **outline.parser.unit.test.ts** - Unit tests for parser
- **outline.parser.param.test.ts** - Parameterized tests
- **vscode-stub.ts** - Mock VSCode API for testing

## Documentation (`docs/`)
- Generated documentation output (TypeDoc)

## Build Output
- **lib/** - Compiled JavaScript output (gitignored)

## Key Architectural Decisions
1. Separation of concerns with dedicated modules for each feature
2. Language-agnostic outline parsing with specific providers
3. Custom web view for binary AppleScript files
4. Integration with native macOS tools (osascript, osacompile)
5. Support for both AppleScript and JXA with shared infrastructure
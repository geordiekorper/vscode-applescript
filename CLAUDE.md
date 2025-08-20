# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VSCode extension that provides comprehensive language support for AppleScript and JavaScript for Automation (JXA) on macOS. The extension enables users to write, run, compile, and debug AppleScript/JXA code directly within VSCode.

## Essential Commands

### Development
```bash
# Install dependencies (uses pnpm)
pnpm install

# Build the extension
npm run build         # Full build (TypeScript + resources)
npm run build:code    # TypeScript only

# Development mode (watch)
npm run dev          # or npm start

# Testing
npm test             # Run all tests with Vitest
npx vitest run test/outline.parser.unit.test.ts  # Run specific test file

# Code quality
npm run lint         # Run Biome linter

# Documentation
npm run docs:md      # Generate markdown docs
npm run docs:html    # Generate HTML docs
```

### Testing the Extension
- Press F5 in VSCode to launch Extension Development Host
- Test commands via Command Palette (Cmd+Shift+P)
- All commands start with "AppleScript:" or "JXA:"

## Architecture Overview

### Command Registration Pattern
All commands are registered in `src/index.ts` within the `activate()` function. Commands follow a consistent pattern:
- AppleScript commands: `extension.applescript.*`
- JXA commands: `extension.jxa.*`

Each command delegates to specialized modules:
- `src/osa.ts` - Handles `osascript` (run) and `osacompile` (compile) operations
- `src/processes.ts` - Process termination functionality
- `src/task.ts` - Build task creation

### Outline View Architecture
The outline functionality (`src/outline.ts`) implements document symbol providers for both AppleScript and JXA:

1. **Parser Pipeline**: 
   - `parseFunctionBlocks()` - Extracts function/handler blocks using regex
   - `buildNodeTree()` - Constructs hierarchical structure
   - `collectEntryPoints()`, `collectVariables()`, `collectProperties()` - Extract specific symbol types
   - `emitSymbols()` - Converts to VSCode DocumentSymbol format

2. **Language-specific Providers**:
   - `appleScriptSymbolProvider` - Handles AppleScript syntax
   - `jxaSymbolProvider` - Handles JXA syntax (currently mirrors AppleScript)

### Binary File Support
The extension includes a custom editor for `.scpt` binary files, which are displayed in a web view with syntax highlighting. The theme is configurable via `applescript.scpt.theme` setting.

### macOS Integration
The extension integrates directly with macOS command-line tools:
- `osascript` - Executes scripts with optional output style flags
- `osacompile` - Compiles scripts to various formats (.scpt, .scptd, .app)

Error handling includes:
- Range conversion (when `convertErrorRange` is enabled)
- Output channel management (controlled by `alwaysShowOutput`)
- Notification system (controlled by `showNotifications`)

## Key Implementation Details

### File Encoding
AppleScript files default to Mac Roman encoding. This is configured in the extension's contribution:
```json
"[applescript]": {
    "files.encoding": "macroman"
}
```

### Build Task System
The task creation system (`src/task.ts`) generates `.vscode/tasks.json` with predefined build tasks for:
- Script compilation (.scpt)
- Bundle creation (.scptd)
- Application packaging (.app)

### Process Management
The process termination feature (`src/processes.ts`) uses the `ps` command to list running processes and allows single or multiple selection (controlled by `allowMultiTermination` setting).

### Testing Infrastructure
Tests use Vitest with a VSCode API stub (`test/vscode-stub.ts`) for unit testing without requiring a full VSCode environment. Test files follow naming conventions:
- `.unit.test.ts` - Unit tests
- `.param.test.ts` - Parameterized tests

## Code Style
- TypeScript with ESNext target
- Single quotes for strings
- Tab indentation
- 120 character line width
- Biome for linting and formatting

## Platform Requirements
- **macOS only** - The extension uses native macOS tools
- VSCode 1.85.0 or higher
- Node.js environment (no DOM APIs)

## Configuration Scope
Extension settings are prefixed with `applescript.` and include compilation options, output preferences, and UI behavior settings. See `package.json` contributions.configuration for the complete list.
# AppleScript VSCode Extension - Project Overview

## Purpose
This is a Visual Studio Code extension that provides comprehensive language support for AppleScript and JavaScript for Automation (JXA) on macOS. It enables developers to write, run, compile, and debug AppleScript and JXA code directly within VSCode.

## Key Features
- **Language Support**: Syntax highlighting, snippets, and code completion for AppleScript and JXA
- **Build System**: Commands to run scripts, compile to various formats (script, bundle, application)
- **Outline View**: Document symbols and structure visualization for AppleScript/JXA files
- **Binary File Support**: Custom web-view for viewing compiled .scpt files with syntax highlighting
- **Process Management**: Ability to terminate running AppleScript processes
- **Build Tasks**: Create and manage build tasks for automation

## Tech Stack
- **Language**: TypeScript
- **Platform**: VSCode Extension API (minimum VSCode 1.85.0)
- **Target Platform**: macOS (uses native osascript and osacompile commands)
- **Build Tools**: 
  - tsdown (TypeScript compilation)
  - Biome (linting and formatting)
  - Vitest (testing)
  - pnpm (package management)

## Extension Commands
### AppleScript Commands:
- `extension.applescript.run` - Run AppleScript
- `extension.applescript.compile` - Compile to .scpt
- `extension.applescript.compileBundle` - Compile to .scptd bundle
- `extension.applescript.compileApp` - Compile to .app application
- `extension.applescript.createBuildTask` - Create build task
- `extension.applescript.terminateProcess` - Terminate running process
- `extension.applescript.openSettings` - Open extension settings

### JXA Commands:
- Similar commands for JXA with `extension.jxa.*` prefix

## Supported File Types
- `.applescript` - AppleScript source files
- `.scpt`, `.scptd` - Compiled AppleScript binaries
- `.jxa`, `.jxainc` - JavaScript for Automation files

## Recent Development
The recent commits show active development on:
- Outline view functionality with function list support
- Unit testing infrastructure with Vitest
- Parser improvements for document symbols
- TypeDoc documentation generation
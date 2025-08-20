# Development Commands for AppleScript VSCode Extension

## Build Commands
- `npm run build` - Build the extension (compiles TypeScript and generates logo)
- `npm run build:code` - Compile TypeScript code only using tsdown
- `npm run dev` or `npm start` - Watch mode for development (auto-recompiles on changes)

## Code Quality Commands
- `npm run lint` - Run Biome linter to check code quality
- `npm test` - Run Vitest tests

## Documentation
- `npm run docs:md` - Generate markdown documentation using TypeDoc
- `npm run docs:html` - Generate HTML documentation
- `npm run docs:all` - Generate both markdown and HTML documentation

## Publishing
- `npm run publish:vsce` - Publish to VSCode Marketplace
- `npm run publish:ovsx` - Publish to Open VSX Registry
- `npm run vscode:prepublish` - Prepare extension for publishing (runs build)

## Git and System Commands (macOS)
- `git status` - Check current git status
- `git diff` - View uncommitted changes
- `git log --oneline -10` - View recent commits
- `ls -la` - List files with details
- `find . -name "*.ts"` - Find TypeScript files
- `grep -r "pattern" src/` - Search in source files (use ripgrep/rg when available)

## VSCode Extension Development
- Press F5 in VSCode to launch Extension Development Host for testing
- Use Command Palette (Cmd+Shift+P) to test extension commands

## Package Management
- Uses `pnpm` as package manager (v10.8.0)
- `pnpm install` - Install dependencies
- `pnpm add <package>` - Add new dependency
- `pnpm add -D <package>` - Add dev dependency
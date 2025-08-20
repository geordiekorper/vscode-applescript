# Task Completion Checklist

When completing any development task on this project, ensure the following steps are performed:

## 1. Code Quality Checks
- [ ] Run linter: `npm run lint`
- [ ] Fix any linting errors reported by Biome
- [ ] Ensure code follows the project's style conventions (single quotes, tabs, 120 char line width)

## 2. Testing
- [ ] Run tests: `npm test`
- [ ] Ensure all existing tests pass
- [ ] Add new tests for new functionality (if applicable)
- [ ] Test files should be in `test/` directory with `.test.ts` suffix

## 3. Build Verification
- [ ] Run build: `npm run build`
- [ ] Ensure TypeScript compilation succeeds without errors
- [ ] Check that the extension can be loaded in VSCode (F5 to test)

## 4. Manual Testing (for functional changes)
- [ ] Test the extension in Extension Development Host
- [ ] Verify AppleScript commands work as expected
- [ ] Check outline view functionality if modified
- [ ] Test with both .applescript and .jxa files

## 5. Documentation
- [ ] Update JSDoc comments for new/modified functions
- [ ] Update README.md if adding new features (only if explicitly requested)
- [ ] Consider generating docs with `npm run docs:md` for significant changes

## 6. Git Hygiene
- [ ] Review changes with `git diff`
- [ ] Ensure no debug code or console.logs are left
- [ ] Commit messages follow conventional format (if committing)

## Notes
- This is a macOS-specific extension, so all testing must be done on macOS
- The extension uses native `osascript` and `osacompile` commands
- Always test with actual AppleScript files to ensure functionality
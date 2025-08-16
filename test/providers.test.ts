import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CancellationToken, TextDocument } from 'vscode';
import { appleScriptSymbolProvider, jxaSymbolProvider } from '../src/outline.ts';
import { makeDoc } from './util.ts';
import { DocumentSymbol, Range, SymbolKind, commands, workspace } from './vscode-stub';

// Restore original stubs after tests
const origExec = commands.executeCommand;
const origOpen = workspace.openTextDocument;

describe('providers', () => {
	afterEach(() => {
		(commands as unknown as { executeCommand: (...args: unknown[]) => Promise<unknown[]> }).executeCommand = origExec;
		(workspace as unknown as { openTextDocument: () => Promise<{ uri: { fsPath: string } }> }).openTextDocument =
			origOpen;
	});

	it('appleScriptSymbolProvider returns symbols end-to-end', async () => {
		const text =
			'property a: 1\nset g to 0\n\n-- comment\non run()\n  set x to 1\nend run\n\ntell app "Finder"\n  on inside()\n    set y to 2\n  end inside\nend tell\n\nlaunch';
		const doc = makeDoc(text);
		const symbols =
			(await appleScriptSymbolProvider.provideDocumentSymbols(
				doc as unknown as TextDocument,
				null as unknown as CancellationToken,
			)) ?? [];
		expect(Array.isArray(symbols)).toBe(true);
		// top-level contains property, global var, event, and function/tell
		const names = (symbols as DocumentSymbol[]).map((s) => s.name);
		expect(names).toContain('a');
		expect(names).toContain('g');
		expect(names).toContain('launch');
		expect(names.some((n: string) => n.startsWith('tell'))).toBe(true);
	});

	it('jxaSymbolProvider passes through DocumentSymbols unchanged', async () => {
		const pos = { line: 0, character: 0 };
		const r = new Range(pos, pos);
		const fake = [new DocumentSymbol('f', '', SymbolKind.Function, r, r)];
		(workspace as unknown as { openTextDocument: () => Promise<{ uri: { fsPath: string } }> }).openTextDocument =
			async () => ({ uri: { fsPath: '' } });
		(commands as unknown as { executeCommand: (...args: unknown[]) => Promise<unknown[]> }).executeCommand = async () =>
			fake as unknown[];
		const doc = makeDoc('function f(){}');
		const out = (await jxaSymbolProvider.provideDocumentSymbols(
			doc as unknown as TextDocument,
			null as unknown as CancellationToken,
		)) as DocumentSymbol[];
		expect(out).toEqual(fake);
	});

	it('jxaSymbolProvider converts SymbolInformation to DocumentSymbol', async () => {
		(workspace as unknown as { openTextDocument: () => Promise<{ uri: { fsPath: string } }> }).openTextDocument =
			async () => ({ uri: { fsPath: '' } });
		const range = new Range({ line: 0, character: 0 }, { line: 0, character: 0 });
		(commands as unknown as { executeCommand: (...args: unknown[]) => Promise<unknown[]> }).executeCommand =
			async () => [{ name: 'g', containerName: 'c', kind: SymbolKind.Function, location: { range } }];
		const doc = makeDoc('function g(){}');
		const out = (await jxaSymbolProvider.provideDocumentSymbols(
			doc as unknown as TextDocument,
			null as unknown as CancellationToken,
		)) as DocumentSymbol[];
		expect(out?.length).toBe(1);
		expect(out?.[0]?.name).toBe('g');
		expect((out?.[0] as DocumentSymbol)?.detail).toBe('c');
		expect(out?.[0]?.kind).toBe(SymbolKind.Function);
	});
});

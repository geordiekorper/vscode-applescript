import { describe, expect, it } from 'vitest';
import { Range, SymbolKind } from 'vscode';
import type { TextDocument } from 'vscode';
import {
	buildNodeTree,
	collectEntryPoints,
	collectProperties,
	collectVariables,
	dedupeByName,
	emitSymbols,
	makeFuncSymbol,
	makeVarSymbolsForNode,
	parseFunctionBlocks,
} from '../src/outline.ts';
import { makeDoc } from './util.ts';

const propertyRe = /^\s*property\s+(\w+)\s*:/gm;
const varRe = /^\s*set\s+(\w+)\s+to\b/gm;
const entryRe = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*(?:\(\s*\))?\s*$/gm;

describe('helpers - properties, entry points, tree, and emission', () => {
	it('collectProperties ignores commented lines', () => {
		const text = 'property foo: 1\n-- property bar: 2\nproperty baz: 3';
		const doc = makeDoc(text);
		const props = collectProperties(text, doc as TextDocument, propertyRe);
		expect(props.map((p) => p.name)).toEqual(['foo', 'baz']);
	});

	it('dedupeByName keeps first occurrence', () => {
		const items = [
			{ name: 'a', index: 1 },
			{ name: 'b', index: 2 },
			{ name: 'a', index: 3 },
		];
		const out = dedupeByName(items);
		expect(out).toEqual([
			{ name: 'a', index: 1 },
			{ name: 'b', index: 2 },
		]);
	});

	it('buildNodeTree nests child handlers inside tell blocks', () => {
		const doc = makeDoc('tell app "Notes"\n  on inner()\n  end inner\nend tell\n\non top()\nend top');
		const blocks = parseFunctionBlocks(doc as TextDocument);
		const nodes = buildNodeTree(blocks);
		const names = nodes.map((n) => n.name);
		expect(names).toContain('tell app "Notes"');
		const tellIdx = nodes.findIndex((n) => n.name.startsWith('tell'));
		const innerIdx = nodes.findIndex((n) => n.name === 'inner');
		expect(tellIdx).toBeGreaterThanOrEqual(0);
		expect(innerIdx).toBeGreaterThanOrEqual(0);
		expect(nodes[innerIdx]?.parent).toBe(tellIdx);
		const topIdx = nodes.findIndex((n) => n.name === 'top');
		expect(nodes[topIdx]?.parent).toBe(-1);
	});

	it('collectEntryPoints finds top-level bare calls and skips inside handlers or duplicates', () => {
		const text = 'on foo()\nend foo\n\nfoo()\nbar\n\n on baz()\n  bar\n end baz';
		const doc = makeDoc(text);
		const blocks = parseFunctionBlocks(doc as TextDocument);
		const handlerRanges = blocks.map((b) => ({ start: b.start, end: b.end }));
		const entries = collectEntryPoints(text, doc as TextDocument, entryRe, handlerRanges, blocks);
		expect(entries.map((e) => e.name)).toEqual(['bar']);
	});

	it('makeVarSymbolsForNode excludes vars from child handlers and dedupes', () => {
		const text = 'on outer()\n  set x to 1\n  set y to 2\n  on inner()\n    set x to 3\n  end inner\nend outer';
		const doc = makeDoc(text);
		const blocks = parseFunctionBlocks(doc as TextDocument);
		const nodes = buildNodeTree(blocks);
		const vars = collectVariables(text, doc as TextDocument, varRe);
		const outerIdx = nodes.findIndex((n) => n.name === 'outer');
		const syms = makeVarSymbolsForNode(
			outerIdx,
			nodes as unknown as ReturnType<typeof buildNodeTree>,
			vars,
			doc as TextDocument,
		);
		expect(syms.map((s) => s.name)).toEqual(['x', 'y']);
		expect(syms.every((s) => s.kind === SymbolKind.Variable)).toBe(true);
	});

	it('emitSymbols integrates properties, globals, entry points, and functions', () => {
		const text = 'property p: 1\nset g to 0\n\non h()\n  set v to 1\nend h\n\nbar';
		const doc = makeDoc(text);
		const props = collectProperties(text, doc as TextDocument, propertyRe);
		const vars = collectVariables(text, doc as TextDocument, varRe);
		const blocks = parseFunctionBlocks(doc as TextDocument);
		const nodes = buildNodeTree(blocks);
		const handlerRanges = blocks.map((b) => ({ start: b.start, end: b.end }));
		const entries = collectEntryPoints(text, doc as TextDocument, entryRe, handlerRanges, blocks);

		const symbols = emitSymbols(doc as TextDocument, props, vars, entries, nodes);
		const kinds = symbols.reduce((acc: Record<number, number>, s) => {
			acc[s.kind] = (acc[s.kind] || 0) + 1;
			return acc;
		}, {});
		// Expect: 1 property, 1 global var, 1 event, 1 function
		expect(kinds[SymbolKind.Property]).toBe(1);
		expect(kinds[SymbolKind.Variable]).toBeGreaterThanOrEqual(1);
		expect(kinds[SymbolKind.Event]).toBe(1);
		expect(kinds[SymbolKind.Function]).toBeGreaterThanOrEqual(1);

		const h = symbols.find((s) => s.name === 'h');
		expect(h).toBeTruthy();
		expect(h?.children.some((c) => c.kind === SymbolKind.Variable && c.name === 'v')).toBe(true);
	});

	it('recognizes "to" handlers and supports plain end fallback for blocks', () => {
		const text = 'to calc(x)\n  if x > 1 then\n    set y to 2\n  end\nend calc';
		const doc = makeDoc(text);
		const blocks = parseFunctionBlocks(doc as TextDocument);
		expect(blocks.map((b) => b.name)).toEqual(['calc']);
	});

	it('handles "using terms" and "with timeout" blocks without creating symbols', () => {
		const text =
			'on outer()\n  using terms from application "System Events"\n    with timeout of 5 seconds\n      set a to 1\n    end timeout\n  end using terms from\nend outer';
		const doc = makeDoc(text);
		const blocks = parseFunctionBlocks(doc as TextDocument);
		// Only the handler should be recorded, not the generic blocks
		expect(blocks.length).toBe(1);
		expect(blocks[0]?.name).toBe('outer');
	});

	it('closes tell with qualified end tell application "X"', () => {
		const text = 'tell application "Notes"\n  set a to 1\nend tell application "Notes"';
		const doc = makeDoc(text);
		const blocks = parseFunctionBlocks(doc as TextDocument);
		expect(blocks.length).toBe(1);
		expect(blocks[0]?.name).toBe('tell application "Notes"');
	});

	it("treats 'on error' outside try as a handler", () => {
		const text = 'on error m number n\nend error';
		const doc = makeDoc(text);
		const blocks = parseFunctionBlocks(doc as TextDocument);
		expect(blocks.length).toBe(1);
		expect(blocks[0]?.name.toLowerCase()).toBe('error');
	});
});

import { describe, expect, it } from 'vitest';
import { collectEntryPoints, dedupeByName, parseFunctionBlocks } from '../src/outline.ts';
import { makeDoc } from './util.ts';

const entryRe = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*(?:\(\s*\))?\s*$/gm;

describe('outline parser unit helpers', () => {
	it('parses mixed-case keywords and preserves handler names (case-insensitive rules)', () => {
		const src = '  On Foo()\n    set x to 1\n  end FOO';
		const doc = makeDoc(src);
		const blocks = parseFunctionBlocks(doc as any);
		const names = blocks.map((b) => (b.name ?? '').toLowerCase());
		expect(names).toContain('foo');
	});

	it('handles end timeout qualifier and does not treat block keywords as handlers', () => {
		const src =
			'on outer()\n  using terms from application "Sys"\n    with timeout of 5 seconds\n      set a to 1\n    end timeout\n  end using terms from\nend outer';
		const doc = makeDoc(src);
		const blocks = parseFunctionBlocks(doc as any);
		// only the outer handler should be recorded
		expect(blocks.length).toBe(1);
		expect(blocks[0]?.name?.toLowerCase()).toBe('outer');
	});

	it('closes tell with a qualified target and records a "tell" entry', () => {
		const src = 'tell application "Test"\n  on bar()\n  end bar\nend tell application "Test"';
		const doc = makeDoc(src);
		const blocks = parseFunctionBlocks(doc as any);
		const names = blocks.map((b) => b.name);
		expect(names).toContain('tell application "Test"');
		expect(blocks.some((b) => b.type === 'tell')).toBe(true);
	});

	it('accepts handler names with underscores and digits', () => {
		const src = 'on handler_1(arg)\nend handler_1';
		const doc = makeDoc(src);
		const blocks = parseFunctionBlocks(doc as any);
		expect(blocks.length).toBe(1);
		expect(blocks[0]?.name).toBe('handler_1');
	});

	it('collectEntryPoints finds top-level bare calls and ignores ones inside handlers and duplicates', () => {
		const src = 'on h()\nend h\n\nh()\nfoo\nfoo\n\non other()\n  foo\nend other';
		const doc = makeDoc(src);
		const blocks = parseFunctionBlocks(doc as any);
		const handlerRanges = blocks.map((b) => ({ start: b.start, end: b.end }));
		const entries = collectEntryPoints(src, doc as any, entryRe, handlerRanges, blocks);
		// collector should dedupe top-level bare calls now
		const names = entries.map((e) => e.name);
		expect(names).toEqual(['foo']);
	});

	it('dedupeByName keeps first occurrence when indices are unordered', () => {
		const items = [
			{ name: 'x', index: 50 },
			{ name: 'y', index: 10 },
			{ name: 'x', index: 20 },
		];
		const out = dedupeByName(items);
		// sorted by index then deduped, so 'y' (10) then 'x' (20) kept because 20 < 50 after sorting
		expect(out.map((i) => i.name)).toEqual(['y', 'x']);
	});
});

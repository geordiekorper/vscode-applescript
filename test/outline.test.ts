import { describe, expect, it } from 'vitest';
import { collectVariables, parseFunctionBlocks } from '../src/outline.ts';
import { makeDoc } from './util.ts';

describe('outline helpers', () => {
	it('parses handlers and tell blocks', () => {
		const doc = makeDoc(
			'on foo()\n  set x to 1\nend foo\n\n\ntell application "Notes"\n  on bar()\n    set y to 2\n  end bar\nend tell',
		);
		const blocks = parseFunctionBlocks(doc);
		const names = blocks.map((b) => b.name);
		expect(names).toContain('foo');
		expect(names).toContain('tell application "Notes"');
		expect(names).toContain('bar');
	});

	it('collects variable assignments and ignores comments', () => {
		const text = 'set a to 1\n-- set ignored to 9\nset b to 2';
		const doc = makeDoc(text);
		const vars = collectVariables(text, doc, /^\s*set\s+(\w+)\s+to\b/gm);
		expect(vars.map((v) => v.name)).toEqual(['a', 'b']);
	});

	it("doesn't treat 'on error' inside try as a handler", () => {
		const doc = makeDoc('try\n  on error m number n\nend try');
		const blocks = parseFunctionBlocks(doc);
		expect(blocks.length).toBe(0);
	});
});

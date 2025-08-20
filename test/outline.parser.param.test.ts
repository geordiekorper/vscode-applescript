import { describe, expect, test } from 'vitest';
import { collectProperties, collectVariables, parseFunctionBlocks } from '../src/outline.ts';
import { makeDoc } from './util.ts';

describe('outline parser parameterized edge cases', () => {
	test.each([
		[
			'ignores full-line comments for variables',
			'-- commented line\nset a to 1\n-- set ignored to 2\nset b to 3',
			['a', 'b'],
		],
		['ignores inline comments for variables', 'set a to 1 -- inline comment\nset b to 2', ['a', 'b']],
	])('collectVariables: %s', (_name, src, expected) => {
		const doc = makeDoc(src);
		const vars = collectVariables(src, doc as any, /^\s*set\s+(\w+)\s+to\b/gm);
		expect(vars.map((v) => v.name)).toEqual(expected);
	});

	test.each([
		['ignores commented properties', '-- property a: 1\nproperty b: 2', ['b']],
		['inline comment after property not treated as property', 'property x: 1 -- note\nproperty y: 2', ['x', 'y']],
	])('collectProperties: %s', (_name, src, expected) => {
		const doc = makeDoc(src);
		const props = collectProperties(src, doc as any, /^\s*property\s+(\w+)\s*:/gm);
		expect(props.map((p) => p.name)).toEqual(expected);
	});

	test('Windows CRLF line endings are handled correctly', () => {
		const src = [
			'on foo()',
			'  set x to 1',
			'end foo',
			'',
			'tell application "X"',
			'  on bar()',
			'  end bar',
			'end tell application "X"',
		].join('\r\n');
		const doc = makeDoc(src);
		const blocks = parseFunctionBlocks(doc as any);
		const names = blocks.map((b) => b.name.toLowerCase());
		expect(names).toContain('foo');
		expect(names.some((n) => n.startsWith('tell'))).toBe(true);
		expect(names).toContain('bar');
	});

	test('large file: many handlers parse quickly and correctly', () => {
		const count = 300;
		const parts: string[] = [];
		for (let i = 0; i < count; i++) {
			parts.push(`on h${i}()`);
			parts.push(`  set v to ${i}`);
			parts.push(`end h${i}`);
		}
		const src = parts.join('\n');
		const doc = makeDoc(src);
		const blocks = parseFunctionBlocks(doc as any);
		expect(blocks.length).toBe(count);
	});
});

import type { TextDocument } from 'vscode';

type PositionLike = { line: number; character: number };
type Line = { range: { start: PositionLike; end: PositionLike }; text: string };

export function makeDoc(text: string): TextDocument {
	const lines = text.split(/\r?\n/);
	return {
		getText(range?: { start: PositionLike }) {
			if (!range) return text;
			const start = range.start.line;
			return lines[start];
		},
		lineCount: lines.length,
		lineAt(line: number): Line {
			return {
				range: { start: { line, character: 0 }, end: { line, character: lines[line]?.length ?? 0 } },
				text: lines[line],
			} as Line;
		},
		offsetAt(pos: PositionLike) {
			let off = 0;
			for (let i = 0; i < pos.line; i++) off += (lines[i]?.length ?? 0) + 1;
			return off;
		},
		positionAt(offset: number): PositionLike {
			let o = 0;
			for (let i = 0; i < lines.length; i++) {
				const l = (lines[i]?.length ?? 0) + 1;
				if (offset < o + l) return { line: i, character: Math.max(0, offset - o) };
				o += l;
			}
			return { line: lines.length - 1, character: Math.max(0, lines[lines.length - 1]?.length ?? 0) };
		},
	} as unknown as TextDocument;
}

// Minimal VS Code API stubs for tests
export type PositionLike = { line: number; character: number };
export class Range {
	constructor(
		public start: PositionLike,
		public end: PositionLike,
	) {}
}
export class DocumentSymbol {
	public children: DocumentSymbol[] = [];
	constructor(
		public name: string,
		public detail: string,
		public kind: number,
		public range: Range,
		public selectionRange: Range,
	) {}
}
export const SymbolKind = {
	Function: 11,
	Variable: 13,
	Property: 7,
	Event: 24,
} as const;
export const commands = { executeCommand: async (): Promise<unknown[]> => [] };
export const workspace = { openTextDocument: async () => ({ uri: { fsPath: '' } }) };

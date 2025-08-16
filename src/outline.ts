import {
	DocumentSymbol,
	type DocumentSymbolProvider,
	Range,
	type SymbolInformation,
	SymbolKind,
	type TextDocument,
	commands,
	workspace,
} from 'vscode';

/**
 * Parse handler and tell blocks from a document using a stack-based scanner.
 */
export function parseFunctionBlocks(document: TextDocument) {
	const blockOpeners = ['if', 'repeat', 'try', 'considering', 'ignoring', 'using terms', 'with timeout'] as const;
	const blockEndQualifiers = ['try', 'if', 'repeat', 'considering', 'ignoring', 'using terms', 'timeout'] as const;
	const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	// The helper implementations are exported above.
	// Build a regex for block openers used by the scanner
	const blockOpenRe = new RegExp(`^\\s*(?:${blockOpeners.map(escapeRegex).join('|')})\\b`, 'i');

	const findLastIndex = <T>(arr: T[], pred: (t: T) => boolean): number => {
		for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i] as T)) return i;
		return -1;
	};

	const functionBlocks: Array<{ name: string; start: number; end: number; type: 'handler' | 'tell' }> = [];
	const stack: Array<{ type: 'handler' | 'tell' | 'block'; name?: string; kind?: string; start: number }> = [];

	for (let ln = 0; ln < document.lineCount; ln++) {
		const lineRange = document.lineAt(ln).range;
		const lineText = document.getText(lineRange);
		if (/^\s*--/.test(lineText)) continue;
		const openerHandler = /^\s*(?:on|to)\s+(\w+)/i.exec(lineText);
		if (openerHandler) {
			const hName = (openerHandler[1] ?? '').toLowerCase();
			const inTry = stack.some((s) => s.type === 'block' && (s.kind ?? '') === 'try');
			if (!(hName === 'error' && inTry)) {
				stack.push({ type: 'handler', name: openerHandler[1] ?? '', start: document.offsetAt(lineRange.start) });
				continue;
			}
		}
		const tellOpen = /^\s*tell\s+(.*)$/i.exec(lineText);
		if (tellOpen) {
			const rest = (tellOpen[1] ?? '').trim();
			const display = rest ? `tell ${rest}` : 'tell';
			stack.push({ type: 'tell', name: display, start: document.offsetAt(lineRange.start) });
			continue;
		}
		const blockOpen = blockOpenRe.exec(lineText);
		if (blockOpen) {
			const kind = (blockOpen[0] ?? '').trim().toLowerCase();
			stack.push({ type: 'block', kind, start: document.offsetAt(lineRange.start) });
			continue;
		}
		const endMatch = /^\s*end(?:\s+([\w\s]+))?\b/i.exec(lineText);
		if (endMatch) {
			const qualifier = (endMatch[1] ?? '').toLowerCase().trim();
			const closeAndRecord = (idx: number) => {
				const item = stack.splice(idx, 1)[0];
				if (item && (item.type === 'handler' || item.type === 'tell')) {
					functionBlocks.push({
						name: item.name ?? '',
						start: item.start,
						end: document.offsetAt(lineRange.end),
						type: item.type,
					});
				}
			};

			if (qualifier.startsWith('tell')) {
				const idx = findLastIndex(stack, (s) => s.type === 'tell');
				if (idx !== -1) closeAndRecord(idx);
				else if (stack.length) closeAndRecord(stack.length - 1);
				continue;
			}
			if (blockEndQualifiers.some((k) => (k === 'timeout' ? qualifier.includes('timeout') : qualifier.startsWith(k)))) {
				const idx = findLastIndex(stack, (s) => s.type === 'block');
				if (idx !== -1) stack.splice(idx, 1);
				else if (stack.length) stack.pop();
				continue;
			}
			if (qualifier.length > 0) {
				const idx = findLastIndex(stack, (s) => s.type === 'handler' && (s.name ?? '').toLowerCase() === qualifier);
				if (idx !== -1) {
					closeAndRecord(idx);
					continue;
				}
			}
			if (stack.length) closeAndRecord(stack.length - 1);
		}
	}

	functionBlocks.sort((a, b) => a.start - b.start);
	return functionBlocks;
}

/**
 * Collect property declarations (non-comment) from the document text.
 */
export function collectProperties(text: string, document: TextDocument, propertyRegex: RegExp) {
	const out: Array<{ name: string; index: number }> = [];
	let m = propertyRegex.exec(text);
	while (m !== null) {
		const name = m[1] ?? '';
		const index = typeof m.index === 'number' ? m.index : 0;
		const pos = document.positionAt(index);
		const lt = document.lineAt(pos.line).text;
		if (!/^\s*--/.test(lt)) out.push({ name, index });
		m = propertyRegex.exec(text);
	}
	return out;
}

/**
 * Collect variable assignments (non-comment) from the document text.
 */
export function collectVariables(text: string, document: TextDocument, varRegex: RegExp) {
	const out: Array<{ name: string; index: number }> = [];
	let m = varRegex.exec(text);
	while (m !== null) {
		const name = m[1] ?? '';
		const index = typeof m.index === 'number' ? m.index : 0;
		const pos = document.positionAt(index);
		const lt = document.lineAt(pos.line).text;
		if (!/^\s*--/.test(lt)) out.push({ name, index });
		m = varRegex.exec(text);
	}
	return out;
}

/**
 * Build parent/child node relationships for function/tell blocks.
 */
export function buildNodeTree(blocks: Array<{ name: string; start: number; end: number; type: 'handler' | 'tell' }>) {
	const ns = blocks.map((b, i) => ({ ...b, idx: i, parent: -1 as number, children: [] as number[] }));
	for (let i = 0; i < ns.length; i++) {
		for (let j = i - 1; j >= 0; j--) {
			const ni = ns[i];
			const nj = ns[j];
			if (!ni || !nj) continue;
			if (nj.start <= ni.start && ni.end <= nj.end) {
				ni.parent = j;
				nj.children.push(i);
				break;
			}
		}
	}
	return ns;
}

/**
 * Remove duplicate items by name, keeping the first occurrence.
 */
export function dedupeByName(items: Array<{ name: string; index: number }>) {
	const seen = new Set<string>();
	const result: Array<{ name: string; index: number }> = [];
	for (const it of items.sort((a, b) => a.index - b.index)) {
		if (!seen.has(it.name)) {
			seen.add(it.name);
			result.push(it);
		}
	}
	return result;
}

/**
 * Collect top-level entry points from text using the provided regexes.
 */
export function collectEntryPoints(
	text: string,
	document: TextDocument,
	entryPointRegex: RegExp,
	handlerRanges: Array<{ start: number; end: number }>,
	functionBlocks: Array<{ name: string; start: number; end: number; type: string }>,
) {
	const out: Array<{ name: string; index: number }> = [];
	let m = entryPointRegex.exec(text);
	while (m !== null) {
		const name = m[1] ?? '';
		const index = typeof m.index === 'number' ? m.index : 0;
		const pos = document.positionAt(index);
		const lt = document.lineAt(pos.line).text;
		if (!/^\s*--/.test(lt)) {
			const isTopLevel = !handlerRanges.some((r) => index > r.start && index < r.end);
			if (isTopLevel && !functionBlocks.some((h) => h.name === name)) out.push({ name, index });
		}
		m = entryPointRegex.exec(text);
	}
	return out;
}

/**
 * Build variable symbols belonging to a node but not inside its child nodes.
 */
export function makeVarSymbolsForNode(
	nodeIdx: number,
	nodesArr: ReturnType<typeof buildNodeTree>,
	variablesArr: Array<{ name: string; index: number }>,
	document: TextDocument,
) {
	const node = nodesArr[nodeIdx];
	if (!node) return [] as DocumentSymbol[];
	const childRanges = node.children
		.map((ci) => nodesArr[ci])
		.filter((c): c is typeof node => Boolean(c))
		.map((c) => ({ start: c.start, end: c.end }));
	const ownVars = variablesArr.filter(
		(v) => v.index > node.start && v.index < node.end && !childRanges.some((r) => v.index > r.start && v.index < r.end),
	);
	return dedupeByName(ownVars).map((v) => {
		const varStart = document.positionAt(v.index);
		const varLineEnd = document.lineAt(varStart.line).range.end;
		return new DocumentSymbol(
			v.name,
			'',
			SymbolKind.Variable,
			new Range(varStart, varLineEnd),
			new Range(varStart, varStart),
		);
	});
}

/**
 * Recursively build a DocumentSymbol for a function/tell node.
 */
export function makeFuncSymbol(
	nodeIdx: number,
	nodesArr: ReturnType<typeof buildNodeTree>,
	variablesArr: Array<{ name: string; index: number }>,
	document: TextDocument,
): DocumentSymbol {
	const node = nodesArr[nodeIdx];
	if (!node) {
		const p = document.positionAt(0);
		return new DocumentSymbol('unknown', '', SymbolKind.Function, new Range(p, p), new Range(p, p));
	}
	const start = document.positionAt(node.start);
	const end = document.positionAt(node.end);
	const sym = new DocumentSymbol(node.name, '', SymbolKind.Function, new Range(start, end), new Range(start, start));
	const childFuncSyms = node.children.map((ci) => makeFuncSymbol(ci, nodesArr, variablesArr, document));
	const varSyms = makeVarSymbolsForNode(nodeIdx, nodesArr, variablesArr, document);
	sym.children = [...childFuncSyms, ...varSyms];
	return sym;
}

/**
 * Emit final DocumentSymbol array from collected pieces.
 */
export function emitSymbols(
	document: TextDocument,
	properties: Array<{ name: string; index: number }>,
	variables: Array<{ name: string; index: number }>,
	entryPoints: Array<{ name: string; index: number }>,
	nodes: ReturnType<typeof buildNodeTree>,
) {
	const out: DocumentSymbol[] = [];
	for (const p of properties) {
		const propStart = document.positionAt(p.index);
		const propLineEnd = document.lineAt(propStart.line).range.end;
		out.push(
			new DocumentSymbol(
				p.name,
				'',
				SymbolKind.Property,
				new Range(propStart, propLineEnd),
				new Range(propStart, propStart),
			),
		);
	}
	const handlerRanges = nodes.map((n) => ({ start: n.start, end: n.end }));
	const globals = variables.filter((v) => !handlerRanges.some((r) => v.index > r.start && v.index < r.end));
	for (const v of dedupeByName(globals)) {
		const varStart = document.positionAt(v.index);
		const varLineEnd = document.lineAt(varStart.line).range.end;
		out.push(
			new DocumentSymbol(
				v.name,
				'',
				SymbolKind.Variable,
				new Range(varStart, varLineEnd),
				new Range(varStart, varStart),
			),
		);
	}
	for (const e of entryPoints) {
		const entryStart = document.positionAt(e.index);
		const entryLineEnd = document.lineAt(entryStart.line).range.end;
		out.push(
			new DocumentSymbol(
				e.name,
				'',
				SymbolKind.Event,
				new Range(entryStart, entryLineEnd),
				new Range(entryStart, entryStart),
			),
		);
	}
	for (let i = 0; i < nodes.length; i++) {
		if (nodes[i]?.parent === -1) out.push(makeFuncSymbol(i, nodes, variables, document));
	}
	return out;
}

// AppleScript Document Symbol Provider (Outline)
export const appleScriptSymbolProvider: DocumentSymbolProvider = {
	provideDocumentSymbols(document) {
		const text = document.getText();
		const propertyRegex = /^\s*property\s+(\w+)\s*:/gm;
		// Allow bare calls with or without parentheses, e.g. myHandler or myHandler()
		const entryPointRegex = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*(?:\(\s*\))?\s*$/gm;
		const varRegex = /^\s*set\s+(\w+)\s+to\b/gm;

		// Centralize AppleScript block keywords
		const blockOpeners = ['if', 'repeat', 'try', 'considering', 'ignoring', 'using terms', 'with timeout'] as const;
		// For "end" lines, AppleScript uses e.g. "end timeout" rather than "end with timeout"
		const blockEndQualifiers = ['try', 'if', 'repeat', 'considering', 'ignoring', 'using terms', 'timeout'] as const;

		const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const blockOpenRe = new RegExp(`^\\s*(?:${blockOpeners.map(escapeRegex).join('|')})\\b`, 'i');

		// Helpers
		const findLastIndex = <T>(arr: T[], pred: (t: T) => boolean): number => {
			for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i] as T)) return i;
			return -1;
		};
		const isCommentAtOffset = (offset: number): boolean => {
			const pos = document.positionAt(offset);
			const lt = document.lineAt(pos.line).text;
			return /^\s*--/.test(lt);
		};

		// Build function/tell blocks using a stack-based line scanner for accurate ranges
		const parseFunctionBlocks = (): Array<{ name: string; start: number; end: number; type: 'handler' | 'tell' }> => {
			const functionBlocks: Array<{ name: string; start: number; end: number; type: 'handler' | 'tell' }> = [];
			const stack: Array<{ type: 'handler' | 'tell' | 'block'; name?: string; kind?: string; start: number }> = [];
			for (let ln = 0; ln < document.lineCount; ln++) {
				const lineRange = document.lineAt(ln).range;
				const lineText = document.getText(lineRange);
				// Skip line comments
				if (/^\s*--/.test(lineText)) {
					continue;
				}
				const openerHandler = /^\s*(?:on|to)\s+(\w+)/i.exec(lineText);
				if (openerHandler) {
					const hName = (openerHandler[1] ?? '').toLowerCase();
					// Skip 'on error' inside a try-block; it's not a standalone handler, but part of 'try...on error...end try'
					const inTry = stack.some((s) => s.type === 'block' && (s.kind ?? '') === 'try');
					if (hName === 'error' && inTry) {
						// Do not treat as a handler
					} else {
						stack.push({ type: 'handler', name: openerHandler[1] ?? '', start: document.offsetAt(lineRange.start) });
						continue;
					}
				}
				const tellOpen = /^\s*tell\s+(.*)$/i.exec(lineText);
				if (tellOpen) {
					const rest = (tellOpen[1] ?? '').trim();
					const display = rest ? `tell ${rest}` : 'tell';
					stack.push({ type: 'tell', name: display, start: document.offsetAt(lineRange.start) });
					continue;
				}
				const blockOpen = blockOpenRe.exec(lineText);
				if (blockOpen) {
					const kind = (blockOpen[0] ?? '').trim().toLowerCase();
					stack.push({ type: 'block', kind, start: document.offsetAt(lineRange.start) });
					continue;
				}
				const endMatch = /^\s*end(?:\s+([\w\s]+))?\b/i.exec(lineText);
				if (endMatch) {
					const qualifier = (endMatch[1] ?? '').toLowerCase().trim();
					const closeAndRecord = (idx: number) => {
						const item = stack.splice(idx, 1)[0];
						if (item && (item.type === 'handler' || item.type === 'tell')) {
							functionBlocks.push({
								name: item.name ?? '',
								start: item.start,
								end: document.offsetAt(lineRange.end),
								type: item.type,
							});
						}
					};

					if (qualifier.startsWith('tell')) {
						const idx = findLastIndex(stack, (s) => s.type === 'tell');
						if (idx !== -1) closeAndRecord(idx);
						else if (stack.length) closeAndRecord(stack.length - 1);
						continue;
					}
					if (
						blockEndQualifiers.some((k) => (k === 'timeout' ? qualifier.includes('timeout') : qualifier.startsWith(k)))
					) {
						const idx = findLastIndex(stack, (s) => s.type === 'block');
						if (idx !== -1) stack.splice(idx, 1);
						else if (stack.length) stack.pop();
						continue;
					}
					if (qualifier.length > 0) {
						const idx = findLastIndex(stack, (s) => s.type === 'handler' && (s.name ?? '').toLowerCase() === qualifier);
						if (idx !== -1) {
							closeAndRecord(idx);
							continue;
						}
					}
					// Plain 'end' fallback
					if (stack.length) closeAndRecord(stack.length - 1);
				}
			}
			// Sort by start position
			functionBlocks.sort((a, b) => a.start - b.start);
			return functionBlocks;
		};
		const functionBlocks = parseFunctionBlocks();

		// Collect property declarations
		const collectProperties = (): Array<{ name: string; index: number }> => {
			const out: Array<{ name: string; index: number }> = [];
			let m = propertyRegex.exec(text);
			while (m !== null) {
				const name = m[1] ?? '';
				const index = typeof m.index === 'number' ? m.index : 0;
				if (!isCommentAtOffset(index)) out.push({ name, index });
				m = propertyRegex.exec(text);
			}
			return out;
		};
		const properties = collectProperties();

		// Collect variable assignments
		const collectVariables = (): Array<{ name: string; index: number }> => {
			const out: Array<{ name: string; index: number }> = [];
			let m = varRegex.exec(text);
			while (m !== null) {
				const name = m[1] ?? '';
				const index = typeof m.index === 'number' ? m.index : 0;
				if (!isCommentAtOffset(index)) out.push({ name, index });
				m = varRegex.exec(text);
			}
			return out;
		};
		const variables = collectVariables();

		// Build symbols, nesting variables under their handler, and add global variables as top-level
		const handlerRanges: Array<{ start: number; end: number }> = functionBlocks.map((b) => ({
			start: b.start,
			end: b.end,
		}));

		// Build a tree of function/tell blocks (parent-child relations)
		const buildNodeTree = (blocks: Array<{ name: string; start: number; end: number; type: 'handler' | 'tell' }>) => {
			const ns = blocks.map((b, i) => ({ ...b, idx: i, parent: -1 as number, children: [] as number[] }));
			for (let i = 0; i < ns.length; i++) {
				for (let j = i - 1; j >= 0; j--) {
					const ni = ns[i];
					const nj = ns[j];
					if (!ni || !nj) continue;
					if (nj.start <= ni.start && ni.end <= nj.end) {
						ni.parent = j;
						nj.children.push(i);
						break;
					}
				}
			}
			return ns;
		};
		const nodes = buildNodeTree(functionBlocks);

		// Helper: dedupe by variable name, keeping first occurrence
		const dedupeByName = (items: Array<{ name: string; index: number }>) => {
			const seen = new Set<string>();
			const result: Array<{ name: string; index: number }> = [];
			for (const it of items.sort((a, b) => a.index - b.index)) {
				if (!seen.has(it.name)) {
					seen.add(it.name);
					result.push(it);
				}
			}
			return result;
		};

		/**
		 * Collect top-level entry points (bare calls) that are not inside handlers.
		 */
		const collectEntryPoints = (): Array<{ name: string; index: number }> => {
			const out: Array<{ name: string; index: number }> = [];
			let m = entryPointRegex.exec(text);
			while (m !== null) {
				const name = m[1] ?? '';
				const index = typeof m.index === 'number' ? m.index : 0;
				if (!isCommentAtOffset(index)) {
					const isTopLevel = !handlerRanges.some((r) => index > r.start && index < r.end);
					if (isTopLevel && !functionBlocks.some((h) => h.name === name)) out.push({ name, index });
				}
				m = entryPointRegex.exec(text);
			}
			return out;
		};
		const entryPoints = collectEntryPoints();

		/**
		 * Emit final DocumentSymbol array from collected pieces.
		 */
		const emitSymbols = () => {
			const out: DocumentSymbol[] = [];

			// properties
			for (const p of properties) {
				const propStart = document.positionAt(p.index);
				const propLineEnd = document.lineAt(propStart.line).range.end;
				out.push(
					new DocumentSymbol(
						p.name,
						'',
						SymbolKind.Property,
						new Range(propStart, propLineEnd),
						new Range(propStart, propStart),
					),
				);
			}

			// globals
			const globals = variables.filter((v) => !handlerRanges.some((r) => v.index > r.start && v.index < r.end));
			for (const v of dedupeByName(globals)) {
				const varStart = document.positionAt(v.index);
				const varLineEnd = document.lineAt(varStart.line).range.end;
				out.push(
					new DocumentSymbol(
						v.name,
						'',
						SymbolKind.Variable,
						new Range(varStart, varLineEnd),
						new Range(varStart, varStart),
					),
				);
			}

			// entry points
			for (const e of entryPoints) {
				const entryStart = document.positionAt(e.index);
				const entryLineEnd = document.lineAt(entryStart.line).range.end;
				out.push(
					new DocumentSymbol(
						e.name,
						'',
						SymbolKind.Event,
						new Range(entryStart, entryLineEnd),
						new Range(entryStart, entryStart),
					),
				);
			}

			// functions/tells
			for (let i = 0; i < nodes.length; i++) {
				if (nodes[i]?.parent === -1) {
					out.push(makeFuncSymbol(i, nodes, variables));
				}
			}

			return out;
		};

		const symbols = emitSymbols();

		// Helper: build variable symbols belonging to a node but not inside its child nodes
		function makeVarSymbolsForNode(
			nodeIdx: number,
			nodesArr: typeof nodes,
			variablesArr: Array<{ name: string; index: number }>,
		) {
			const node = nodesArr[nodeIdx];
			if (!node) return [] as DocumentSymbol[];
			const childRanges = node.children
				.map((ci) => nodesArr[ci])
				.filter((c): c is typeof node => Boolean(c))
				.map((c) => ({ start: c.start, end: c.end }));
			const ownVars = variablesArr.filter(
				(v) =>
					v.index > node.start && v.index < node.end && !childRanges.some((r) => v.index > r.start && v.index < r.end),
			);
			return dedupeByName(ownVars).map((v) => {
				const varStart = document.positionAt(v.index);
				const varLineEnd = document.lineAt(varStart.line).range.end;
				return new DocumentSymbol(
					v.name,
					'',
					SymbolKind.Variable,
					new Range(varStart, varLineEnd),
					new Range(varStart, varStart),
				);
			});
		}

		// Recursively build function/tell symbols tree (pure helper)
		function makeFuncSymbol(
			nodeIdx: number,
			nodesArr: typeof nodes,
			variablesArr: Array<{ name: string; index: number }>,
		): DocumentSymbol {
			const node = nodesArr[nodeIdx];
			if (!node) {
				const p = document.positionAt(0);
				return new DocumentSymbol('unknown', '', SymbolKind.Function, new Range(p, p), new Range(p, p));
			}
			const start = document.positionAt(node.start);
			const end = document.positionAt(node.end);
			const sym = new DocumentSymbol(
				node.name,
				'',
				SymbolKind.Function,
				new Range(start, end),
				new Range(start, start),
			);
			const childFuncSyms = node.children.map((ci) => makeFuncSymbol(ci, nodesArr, variablesArr));
			const varSyms = makeVarSymbolsForNode(nodeIdx, nodesArr, variablesArr);
			sym.children = [...childFuncSyms, ...varSyms];
			return sym;
		}

		// Add top-level function/tell symbols
		for (let i = 0; i < nodes.length; i++) {
			if (nodes[i]?.parent === -1) {
				symbols.push(makeFuncSymbol(i, nodes, variables));
			}
		}
		if (!Array.isArray(symbols)) {
			return [];
		}
		return symbols.filter((s) => s instanceof DocumentSymbol);
	},
};

// JXA: delegate to JavaScript's outline by creating a virtual JS document with identical content
export const jxaSymbolProvider: DocumentSymbolProvider = {
	async provideDocumentSymbols(document) {
		const text = document.getText();
		const jsDoc = await workspace.openTextDocument({ language: 'javascript', content: text });
		const result = await commands.executeCommand<(DocumentSymbol | SymbolInformation)[] | undefined>(
			'vscode.executeDocumentSymbolProvider',
			jsDoc.uri,
		);
		if (!Array.isArray(result) || result.length === 0) return [];
		// If already DocumentSymbols (presence of selectionRange), return as-is
		const first = result[0] as DocumentSymbol | SymbolInformation;
		if ((first as DocumentSymbol).selectionRange !== undefined) {
			return result as DocumentSymbol[];
		}
		// Convert SymbolInformation[] to DocumentSymbol[] (flat)
		const infos = result as SymbolInformation[];
		return infos.map((s) => {
			const range = s.location.range;
			return new DocumentSymbol(
				s.name ?? '',
				s.containerName ?? '',
				s.kind ?? SymbolKind.Function,
				range,
				new Range(range.start, range.start),
			);
		});
	},
};

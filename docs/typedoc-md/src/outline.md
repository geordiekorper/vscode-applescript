[**applescript v0.27.2**](../README.md)

***

[applescript](../README.md) / src/outline

# src/outline

## Interfaces

### FunctionBlock

Defined in: [src/outline.ts:18](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/outline.ts#L18)

A parsed function/tell block as returned by the scanner.

Declared as an exported interface so documentation tools (TypeDoc) will
present properties in the specified order (name, start, end, type).

#### Properties

##### name

> **name**: `string`

Defined in: [src/outline.ts:20](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/outline.ts#L20)

Human-friendly name (handler name or tell display).

##### start

> **start**: `number`

Defined in: [src/outline.ts:22](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/outline.ts#L22)

Start offset in the document (character index).

##### end

> **end**: `number`

Defined in: [src/outline.ts:24](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/outline.ts#L24)

End offset in the document (character index).

##### type

> **type**: `"handler"` \| `"tell"`

Defined in: [src/outline.ts:26](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/outline.ts#L26)

Block type: 'handler' for on/to, or 'tell' for tell blocks.

## Variables

### appleScriptSymbolProvider

> `const` **appleScriptSymbolProvider**: `DocumentSymbolProvider`

Defined in: [src/outline.ts:386](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/outline.ts#L386)

AppleScript Document Symbol Provider.

This provider implements a line-based, stack-driven parser that extracts
AppleScript "handlers" (on/to), "tell" blocks and a set of top-level
symbols (properties, variables, and bare entry-point calls). It returns an
array of `DocumentSymbol` objects suitable for the VS Code outline/view.

Key behaviors:
- Skips lines that are commented with `--`.
- Detects handler openers (`on` / `to`) and closes them on matching `end`.
- Treats `on error` inside `try` as part of the `try` block (not a top-level handler).
- Recognizes common block keywords (`if`, `repeat`, `try`, `using terms`, `with timeout`, etc.)
  to properly nest and ignore non-handler blocks.
- Collects `property` declarations and `set <var> to` assignments and nests
  variables under the handler they belong to while exposing globals at top-level.
- Collects bare entry points (e.g. `myHandler` or `myHandler()`) outside of handlers.
- Dedupe is applied where appropriate to keep the earliest occurrence of repeated names.

The implementation intentionally uses a conservative line scanner rather
than a full parser to keep the provider fast and tolerant of partial/invalid
code while giving useful outline symbols.

***

### jxaSymbolProvider

> `const` **jxaSymbolProvider**: `DocumentSymbolProvider`

Defined in: [src/outline.ts:727](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/outline.ts#L727)

JXA (JavaScript for Automation) Document Symbol Provider.

Instead of re-implementing a JS parser, this provider delegates to the
built-in JavaScript Document Symbol Provider by creating a virtual
JavaScript document with the same content and invoking
`vscode.executeDocumentSymbolProvider` on it. The returned symbols may be
either `DocumentSymbol[]` or `SymbolInformation[]` depending on the
provider; this code converts `SymbolInformation[]` into a flat
`DocumentSymbol[]` (using the symbol's location as both range and selectionRange).

This approach leverages the editor's JavaScript tooling to provide a
richer outline for JXA files without duplicating parsing logic.

## Functions

### parseFunctionBlocks()

> **parseFunctionBlocks**(`document`): [`FunctionBlock`](#functionblock)[]

Defined in: [src/outline.ts:45](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/outline.ts#L45)

Parse handler and tell blocks from a TextDocument using a stack-based scanner.

This scanner walks the document line-by-line and maintains a stack of open
regions. Handlers ("on"/"to") and "tell" blocks are recorded with their
start offsets when they are opened and converted into result entries when
their matching "end" is encountered.

The algorithm is robust to nested blocks like `tell`, `try`, `if` and will
correctly ignore `on error` clauses that are part of `try` blocks (these are
not top-level handlers). Comment lines starting with `--` are skipped.

Returns an array of blocks each with { name, start, end, type } describing
the symbol name, start offset, end offset, and whether it's a 'handler' or
a 'tell' block.

#### Parameters

##### document

`TextDocument`

#### Returns

[`FunctionBlock`](#functionblock)[]

***

### collectProperties()

> **collectProperties**(`text`, `document`, `propertyRegex`): `object`[]

Defined in: [src/outline.ts:136](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/outline.ts#L136)

Collect property declarations from text.

Scans with `propertyRegex` and returns each match as { name, index }.
Lines that are commented out (start with `--`) are ignored. The returned
index is the character offset in the document where the match starts.

#### Parameters

##### text

`string`

##### document

`TextDocument`

##### propertyRegex

`RegExp`

#### Returns

`object`[]

***

### collectVariables()

> **collectVariables**(`text`, `document`, `varRegex`): `object`[]

Defined in: [src/outline.ts:157](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/outline.ts#L157)

Collect variable assignment occurrences from text.

Uses `varRegex` to find `set <name> to` occurrences. Commented lines are
ignored. Returns an array of { name, index } where index is the offset of
the match in the document.

#### Parameters

##### text

`string`

##### document

`TextDocument`

##### varRegex

`RegExp`

#### Returns

`object`[]

***

### buildNodeTree()

> **buildNodeTree**(`blocks`): `object`[]

Defined in: [src/outline.ts:178](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/outline.ts#L178)

Build a simple containment tree from an array of blocks.

Each block has start/end offsets; this routine assigns a `parent` index
for nodes that are contained by an earlier block, and populates `children`
arrays on parents. The input is expected to be sorted by start offset.

#### Parameters

##### blocks

[`FunctionBlock`](#functionblock)[]

#### Returns

***

### dedupeByName()

> **dedupeByName**(`items`): `object`[]

Defined in: [src/outline.ts:202](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/outline.ts#L202)

Remove duplicate items based on `name`, keeping the earliest occurrence.

Implementation detail: items are first sorted by their `index` and then
filtered so that only the first seen name is included. This is useful for
deduping symbol lists while preserving document order.

#### Parameters

##### items

`object`[]

#### Returns

`object`[]

***

### collectEntryPoints()

> **collectEntryPoints**(`text`, `document`, `entryPointRegex`, `handlerRanges`, `functionBlocks`): `object`[]

Defined in: [src/outline.ts:225](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/outline.ts#L225)

Collect top-level entry points (bare calls) from a document.

This scans the text for bare identifiers or identifier calls (e.g. `foo` or
`foo()`) using `entryPointRegex`. Entries that appear inside handler ranges
are ignored. Additionally, any function/tell block that has the same name
will suppress an entry with that name (so handlers are not double-reported).

The returned list is deduped by name (earliest occurrence kept) to avoid
reporting repeated top-level calls.

#### Parameters

##### text

`string`

##### document

`TextDocument`

##### entryPointRegex

`RegExp`

##### handlerRanges

`object`[]

##### functionBlocks

[`FunctionBlock`](#functionblock)[]

#### Returns

`object`[]

***

### makeVarSymbolsForNode()

> **makeVarSymbolsForNode**(`nodeIdx`, `nodesArr`, `variablesArr`, `document`): `DocumentSymbol`[]

Defined in: [src/outline.ts:253](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/outline.ts#L253)

Build variable symbols belonging to a node but not inside its child nodes.

#### Parameters

##### nodeIdx

`number`

##### nodesArr

`object`[]

##### variablesArr

`object`[]

##### document

`TextDocument`

#### Returns

`DocumentSymbol`[]

***

### makeFuncSymbol()

> **makeFuncSymbol**(`nodeIdx`, `nodesArr`, `variablesArr`, `document`): `DocumentSymbol`

Defined in: [src/outline.ts:284](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/outline.ts#L284)

Recursively build a DocumentSymbol for a function/tell node.

#### Parameters

##### nodeIdx

`number`

##### nodesArr

`object`[]

##### variablesArr

`object`[]

##### document

`TextDocument`

#### Returns

`DocumentSymbol`

***

### emitSymbols()

> **emitSymbols**(`document`, `properties`, `variables`, `entryPoints`, `nodes`): `DocumentSymbol`[]

Defined in: [src/outline.ts:307](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/outline.ts#L307)

Emit final DocumentSymbol array from collected pieces.

#### Parameters

##### document

`TextDocument`

##### properties

`object`[]

##### variables

`object`[]

##### entryPoints

`object`[]

##### nodes

`object`[]

#### Returns

`DocumentSymbol`[]

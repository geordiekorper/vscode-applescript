[**applescript v0.27.2**](../README.md)

***

[applescript](../README.md) / src/util

# src/util

## Functions

### getOutName()

> **getOutName**(`fileName`, `extension`): `string`

Defined in: [src/util.ts:60](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/util.ts#L60)

Build the default output filename for compiles based on input file name and
target extension (default 'scpt').

#### Parameters

##### fileName

`string`

##### extension

`string` = `'scpt'`

#### Returns

`string`

***

### spawnPromise()

> **spawnPromise**(`cmd`, `fileName`, `args`, `outputChannel`): `Promise`\<`void`\>

Defined in: [src/util.ts:75](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/util.ts#L75)

Spawn a child process and return a Promise that resolves on exit.

This helper attaches stdout/stderr handlers, converts any error output to
a line/column path when possible, appends output to the `outputChannel`,
and tracks active processes via the `processes` module.

#### Parameters

##### cmd

`string`

##### fileName

`string`

##### args

`string`[]

##### outputChannel

`OutputChannel`

#### Returns

`Promise`\<`void`\>

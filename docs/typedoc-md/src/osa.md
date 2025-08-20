[**applescript v0.27.2**](../README.md)

***

[applescript](../README.md) / src/osa

# src/osa

## Functions

### osacompile()

> **osacompile**(`compileTarget`, `userOptions`): `Promise`\<`void`\>

Defined in: [src/osa.ts:23](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/osa.ts#L23)

Compile the current editor document using `osacompile`.

compileTarget: one of 'scpt' | 'scptd' | 'app' (controls the output format)
userOptions: optional flags such as { isJXA: true } to compile as JavaScript

This saves the active document, constructs appropriate arguments based on
configuration, and spawns the external `osacompile` tool. Any output or
errors are shown in the `outputChannel` and optionally surfaced via
notifications.

#### Parameters

##### compileTarget

`string`

##### userOptions

[`CommandFlags`](../types.md#commandflags) = `...`

#### Returns

`Promise`\<`void`\>

***

### osascript()

> **osascript**(`options`): `Promise`\<`void`\>

Defined in: [src/osa.ts:88](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/osa.ts#L88)

Run the current editor document using `osascript`.

If the document has unsaved changes we pass the script to `osascript -e`
line-by-line. Otherwise the filename is passed directly. `options.isJXA` can
be used to run JavaScript for Automation instead of AppleScript.

#### Parameters

##### options

[`CommandFlags`](../types.md#commandflags) = `...`

#### Returns

`Promise`\<`void`\>

[**applescript v0.27.2**](README.md)

***

[applescript](README.md) / src

# src

## Functions

### activate()

> **activate**(`context`): `Promise`\<`void`\>

Defined in: [src/index.ts:14](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/index.ts#L14)

Activate the VS Code extension.

This registers editor/command handlers for AppleScript and JXA workflows
(run, compile, build task creation, termination) and hooks the document
symbol providers for the `applescript` and `jxa` languages.

#### Parameters

##### context

`ExtensionContext`

#### Returns

`Promise`\<`void`\>

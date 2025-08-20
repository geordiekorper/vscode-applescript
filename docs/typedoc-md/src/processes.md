[**applescript v0.27.2**](../README.md)

***

[applescript](../README.md) / src/processes

# src/processes

## Variables

### lastKilledProcessId

> **lastKilledProcessId**: `number` = `0`

Defined in: [src/processes.ts:17](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/processes.ts#L17)

The last process id that was removed/killed. Useful for tests and to
determine if a process was intentionally terminated by the extension.

## Functions

### add()

> **add**(`pid`, `file`, `command`): `void`

Defined in: [src/processes.ts:25](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/processes.ts#L25)

Register a new active process record.

#### Parameters

##### pid

`number`

process id

##### file

`string`

file responsible for the process

##### command

`string`

command string used to spawn

#### Returns

`void`

***

### remove()

> **remove**(`pid`): `void`

Defined in: [src/processes.ts:36](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/processes.ts#L36)

Remove an active process from tracking and record it as lastKilled.

#### Parameters

##### pid

`number`

#### Returns

`void`

***

### get()

> **get**(`pid`): `undefined` \| [`ActiveProcess`](../types.md#activeprocess)

Defined in: [src/processes.ts:44](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/processes.ts#L44)

Lookup an active process record by pid.

#### Parameters

##### pid

`number`

#### Returns

`undefined` \| [`ActiveProcess`](../types.md#activeprocess)

***

### pick()

> **pick**(): `Promise`\<`void`\>

Defined in: [src/processes.ts:55](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/processes.ts#L55)

Present a quick-pick UI allowing the user to select active spawned processes
to kill. The `allowMultiTermination` setting controls whether multiple
selections are allowed.

#### Returns

`Promise`\<`void`\>

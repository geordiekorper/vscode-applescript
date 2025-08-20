[**applescript v0.27.2**](../README.md)

***

[applescript](../README.md) / src/task

# src/task

## Functions

### createBuildTask()

> **createBuildTask**(`isJXA`): `Promise`\<`void`\>

Defined in: [src/task.ts:16](https://github.com/geordiekorper/vscode-applescript/blob/7655876c288a9ce66472b020f2746b303dfcb25c/src/task.ts#L16)

Create a workspace-level `tasks.json` containing Run/Compile tasks for the
active AppleScript/JXA file. This writes `.vscode/tasks.json` in the current
workspace folder with commonly used osascript/osacompile invocations.

When `isJXA` is true, tasks are configured to run/compile JavaScript for
Automation instead of AppleScript.

#### Parameters

##### isJXA

`boolean` = `false`

#### Returns

`Promise`\<`void`\>

import { spawn } from 'node:child_process';
// Dependencies
import { basename, dirname, extname, join } from 'node:path';
import lineColumn from 'line-column';
import { type OutputChannel, window } from 'vscode';
// @ts-expect-error TODO Fix package
import { getConfig } from 'vscode-get-config';
import * as activeProcesses from './processes.ts';

/**
 * Attempt to convert an osascript error line into a file:line:col:message form.
 *
 * This helper is used to convert tool output into clickable ranges for the
 * editor. It reads the active editor text and uses `line-column` to map a
 * numeric index into a 1-based line/column pair. Returns false if conversion
 * isn't enabled or the input cannot be parsed.
 */
async function getLineCol(lineString: string): Promise<string | boolean> {
	if (!(await getConfig('applescript.convertErrorRange'))) {
		return false;
	}

	const re = /^(?<filePath>[^:]+):(?<rangeFrom>\d+):((?<rangeTo>\d+):)?(?<message>.*)$/u;
	const result = re.exec(lineString);

	if (!result?.groups?.rangeFrom) {
		return false;
	}

	const doc = window.activeTextEditor?.document;

	if (!doc) {
		console.error('[idleberg.applescript] Document not found');
		return false;
	}

	const editorText = doc.getText();

	if (!editorText?.length) {
		console.error('[idleberg.applescript] Empty document');
		return false;
	}

	const lineCol = lineColumn(editorText, { origin: 1 }).fromIndex(Number.parseInt(result.groups.rangeFrom, 10));

	if (!lineCol) {
		return false;
	}

	// is range end specified?
	lineCol.col = lineCol?.col && result.groups.rangeTo ? lineCol.col : 1;

	return `${doc.fileName}:${lineCol.line}:${lineCol.col}:${result.groups.message}`;
}

/**
 * Build the default output filename for compiles based on input file name and
 * target extension (default 'scpt').
 */
export function getOutName(fileName: string, extension = 'scpt'): string {
	const dirName = dirname(fileName);
	const baseName = basename(fileName, extname(fileName));
	const outName = join(dirName, `${baseName}.${extension}`);

	return outName;
}

/**
 * Spawn a child process and return a Promise that resolves on exit.
 *
 * This helper attaches stdout/stderr handlers, converts any error output to
 * a line/column path when possible, appends output to the `outputChannel`,
 * and tracks active processes via the `processes` module.
 */
export async function spawnPromise(
	cmd: string,
	fileName: string,
	args: Array<string>,
	outputChannel: OutputChannel,
): Promise<void> {
	const { alwaysShowOutput } = await getConfig('applescript');

	return new Promise((resolve, reject) => {
		outputChannel.clear();

		if (alwaysShowOutput) {
			outputChannel.show();
		}

		const childProcess = spawn(cmd, args);

		if (childProcess?.pid) {
			activeProcesses.add(childProcess.pid, fileName, cmd);
		}

		childProcess.stdout.on('data', async (line: string) => {
			const lineString: string = line.toString().trim();

			if (lineString.length) {
				const lineCol = await getLineCol(lineString);
				const appendLine = lineCol ? lineCol : lineString;

				if (typeof appendLine === 'string') {
					outputChannel.appendLine(appendLine);
				}
			}
		});

		childProcess.stderr.on('data', async (line: string) => {
			const lineString: string = line.toString().trim();

			if (lineString.length) {
				const lineCol = await getLineCol(lineString);
				const appendLine = lineCol ? lineCol : lineString;

				if (typeof appendLine === 'string') {
					outputChannel.appendLine(appendLine);
				}
			}
		});

		childProcess.on('close', (code: number) => {
			if (childProcess?.pid) {
				activeProcesses.remove(childProcess.pid);
			}

			return code === 0 || activeProcesses.lastKilledProcessId === childProcess.pid ? resolve() : reject();
		});
	});
}

import { kill } from 'node:process';
import { window } from 'vscode';
// @ts-expect-error TODO Fix package
import { getConfig } from 'vscode-get-config';

/**
 * Map of currently active child processes spawned by the extension.
 * Keys are pid numbers and values are an ActiveProcess record describing the
 * file and command used to spawn them.
 */
const activeProcesses = new Map<number, ActiveProcess>();

/**
 * The last process id that was removed/killed. Useful for tests and to
 * determine if a process was intentionally terminated by the extension.
 */
export let lastKilledProcessId = 0;

/**
 * Register a new active process record.
 * @param pid process id
 * @param file file responsible for the process
 * @param command command string used to spawn
 */
export function add(pid: number, file: string, command: string) {
	activeProcesses.set(pid, {
		created: Date.now(),
		file,
		process: command,
	});
}

/**
 * Remove an active process from tracking and record it as lastKilled.
 */
export function remove(pid: number) {
	activeProcesses.delete(pid);
	lastKilledProcessId = pid;
}

/**
 * Lookup an active process record by pid.
 */
export function get(pid: number) {
	const value = activeProcesses.get(pid);

	return value;
}

/**
 * Present a quick-pick UI allowing the user to select active spawned processes
 * to kill. The `allowMultiTermination` setting controls whether multiple
 * selections are allowed.
 */
export async function pick() {
	const processList = Object.entries(Object.fromEntries(activeProcesses))
		.map(([key, value]) => ({
			label: value.file,
			detail: `${key} ${value.process} ${new Date(value.created).toISOString()}`,
		}))
		.reverse();

	if (!processList.length) {
		return;
	}

	const { allowMultiTermination } = await getConfig('applescript');

	const pick = await window.showQuickPick(processList, {
		canPickMany: allowMultiTermination,
		matchOnDescription: true,
	});

	if (pick) {
		const picks = Array.isArray(pick) ? pick : [pick];

		picks.map((item) => {
			const pid = item.detail.split(' ')[0];

			kill(Number(pid));
		});
	}
}

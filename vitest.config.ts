import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	test: {
		environment: 'node',
		include: ['test/**/*.test.ts'],
	},
	resolve: {
		alias: [
			{
				find: 'vscode',
				replacement: join(__dirname, 'test', 'vscode-stub.ts'),
			},
		],
	},
});

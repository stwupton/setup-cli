import { exec as nodeExec, type ExecException } from 'node:child_process';
import { exists, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export async function pull(): Promise<void> {
	let success = await pullNvim();
	if (!success) {
		console.error('Failed to pull Neovim configuration.');
	} else {
		console.log('Succesfully updated Neovim configuration.');
	}
}

function exec(command: string, cwd: string): Promise<{ error: ExecException | null; stdout: string; stderr: string }> {
	return new Promise(resolve => {
		nodeExec(command, { cwd }, (error, stdout, stderr) => {
			resolve({ error, stdout, stderr });
		});
	});
}

async function pullNvim(): Promise<boolean> {
	console.log('Updating Neovim...');

	const localPath = join(homedir(), 'AppData/Local/');
	const localPathExists = await exists(localPath);
	if (!localPathExists) {
		console.error('Could not find AppData/Local directory.');
		return false;
	}

	const nvimPath = join(localPath, 'nvim/');
	const nvimPathExists = await exists(nvimPath);
	if (!nvimPathExists) {
		const { error, stderr } = await exec('git clone git@github.com:stwupton/nvim-config.git nvim', localPath);
		if (error != null) {
			console.error('Failed to clone Neovim configuration via git.');
			console.error(stderr);
			return false;
		}
	}

	const { error, stderr } = await exec('git pull origin master', nvimPath);
	if (error != null) {
		console.error('Failed to pull latest Neovim config via git.');
		console.error(stderr);
		return false;
	}

	return true;
}

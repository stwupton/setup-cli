import { exec as nodeExec, type ExecException } from 'node:child_process';
import { stat as nodeStat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import powershellProfile from '../data/powershell_profile.txt' with { type: 'text' };
import windowsTerminalSettings from '../data/windows_terminal_settings.txt' with { type: 'text' };
import which from 'which';
import { mkdirSync, writeFileSync } from 'node:fs';
import { type PathLike } from 'node:fs';

export async function pull(): Promise<void> {
	await pullNvim();
	await pullPowershellProfile();
	await pullWindowsTerminalSettings();
}

function exec(command: string, cwd?: string): Promise<{ error: ExecException | null; stdout: string; stderr: string }> {
	return new Promise(resolve => {
		nodeExec(command, { cwd }, (error, stdout, stderr) => {
			resolve({ error, stdout, stderr });
		});
	});
}

async function exists(path: PathLike, type: 'file' | 'dir'): Promise<boolean> {
	try {
		const stats = await nodeStat(path);
		switch (type) {
			case 'file': return stats.isFile();
			case 'dir': return stats.isDirectory();
		}
	} catch {
		return false;
	}
}

async function pullNvim(): Promise<void> {
	console.log('Updating Neovim...');

	const localPath = join(homedir(), 'AppData/Local/');
	const localPathExists = await exists(localPath, 'dir');
	if (!localPathExists) {
		console.error('Could not find AppData/Local directory.');
		return;
	}

	const nvimPath = join(localPath, 'nvim/');
	const nvimPathExists = await exists(nvimPath, 'dir');
	if (!nvimPathExists) {
		const { error, stderr } = await exec('git clone git@github.com:stwupton/nvim-config.git nvim', localPath);
		if (error != null) {
			console.error('Failed to clone Neovim configuration via git.');
			console.error(stderr);
			return;
		}
	}

	const { error, stderr } = await exec('git pull origin master', nvimPath);
	if (error != null) {
		console.error('Failed to pull latest Neovim config via git.');
		console.error(stderr);
		return;
	}

	console.log('Succesfully updated Neovim configuration.');
	return;
}

async function pullPowershellProfile(): Promise<void> {
	console.log('Updating Powershell profile...');

	try {
		await which('yazi');
	} catch {
		console.warn('Yazi is not available on path.');
	}

	try {
		await exec('zoxide');
	} catch {
		console.warn('Zoxide is not available on path.');
	}

	try {
		await exec('starship');
	} catch {
		console.warn('Starship is not available on path.');
	}

	let gitPath: string | undefined;
	try {
		gitPath = await which('git');
	} catch {
		console.warn('Git is not available on path.');
	}

	let fileOnePath: string | undefined;
	if (gitPath != undefined) {
		const fileOneExe = join(gitPath, '../../usr/bin/file.exe');
		const fileOneExists = await exists(fileOneExe, 'file');
		if (fileOneExists) {
			fileOnePath = fileOneExe;
		} else {
			console.warn('Could not locate file(1) in git installation. (Used for Yazi)');
		}
	}

	let profile = powershellProfile;
	if (fileOnePath != undefined) {
		profile = powershellProfile.replace('{{file_one_path}}', fileOnePath);
	}

	const powershellProfileDirPath = join(homedir(), '/Documents/WindowsPowerShell/');
	const powershellProfileDirExists = await exists(powershellProfileDirPath, 'dir');
	if (!powershellProfileDirExists) {
		mkdirSync(powershellProfileDirPath, { recursive: true });
	}

	const powershellProfilePath = join(powershellProfileDirPath, 'Microsoft.PowerShell_profile.ps1');
	try {
		writeFileSync(powershellProfilePath, profile);
	} catch {
		console.error(`Failed to write Powershell profile to: ${powershellProfilePath}`);
		return;
	}

	console.log('Successfully updated Powershell profile.');
}

async function pullWindowsTerminalSettings(): Promise<void> {
	console.log('Updating Windows Terminal Settings...');

	const settingsDirPath = join(homedir(), 'AppData/Local/Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState/');
	const settingsDirPathExists = await exists(settingsDirPath, 'dir');
	if (!settingsDirPathExists) {
		console.error(`Could not find Windows Terminal settings directory: ${settingsDirPath}.`);
		return;
	}

	const settingsPath = join(settingsDirPath, 'settings.json');
	try {
		writeFileSync(settingsPath, windowsTerminalSettings);
	} catch {
		console.error(`Failed to write Windows Terminal settings to: ${settingsPath}`);
		return;
	}

	console.log('Successfully updated Windows Terminal Settings.');
}

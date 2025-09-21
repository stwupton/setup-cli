import { parseArgs } from 'node:util';
import { Command } from 'commander';
import * as packageJson from '../package.json';
import { pull } from './pull';

const command = new Command();
command
	.name('setup')
	.description('CLI utility for settings up shared configurations.')
	.version(packageJson.version);

command
	.command('pull')
	.description('Pull all configurations.')
	.action(options => {
		pull();
	});

command
	.command('push')
	.description('Push all updated configurations.')
	.action(options => {
		// push();
	});

command.parse();

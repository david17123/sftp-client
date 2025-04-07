import * as SftpClient from 'ssh2-sftp-client';
import { format } from 'date-fns';
import { injectable } from 'tsyringe';
import {
  ArgDefinition,
  BaseCommand,
  CommandInput,
  RequireConnection,
} from './base.command';

@injectable()
@RequireConnection
export class ListCommand extends BaseCommand {
  getDescription(): string {
    return 'List files in a directory';
  }

  getName() {
    return 'ls';
  }

  getArgs(): ArgDefinition[] {
    return [
      {
        name: 'path',
        description: 'The path to get list of files from',
        required: false,
      },
    ];
  }

  getOptions() {
    return [
      {
        name: 'long',
        shortName: 'l',
        description: 'List files in long format',
      },
    ];
  }

  async run(input: CommandInput) {
    const path = this.appState.getFullPath(input.argsMap['path'] ?? '.');
    const entries = await this.appState.sftpClient.list(path);
    for (const entry of entries) {
      console.log(this.formatLongName(entry));
    }
  }

  private formatLongName(fileInfo: SftpClient.FileInfo): string {
    const rights = `${fileInfo.rights.user.padEnd(3, '-')}${fileInfo.rights.group.padEnd(3, '-')}${fileInfo.rights.other.padEnd(3, '-')}`;
    const owner = (fileInfo.owner ?? '-').toString().padStart(10, ' ');
    const group = (fileInfo.group ?? '-').toString().padStart(10, ' ');
    const size = fileInfo.size.toString().padStart(10, ' ');

    const modifyTime = new Date(fileInfo.modifyTime);
    const modifyTimeStr = format(modifyTime, 'MMM dd HH:mm');

    return `${fileInfo.type}${rights} ${owner} ${group} ${size} ${modifyTimeStr} ${fileInfo.name}`;
  }
}

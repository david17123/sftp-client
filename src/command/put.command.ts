import * as fs from 'fs/promises';
import { injectable } from 'tsyringe';
import {
  ArgDefinition,
  BaseCommand,
  CommandInput,
  RequireConnection,
} from './base.command';
import { CommandError } from '../error/command.error';
import { PathHelper } from '../helper/path.helper';

@injectable()
@RequireConnection
export class PutCommand extends BaseCommand {
  constructor(private pathHelper: PathHelper) {
    super();
  }

  getDescription(): string {
    return 'Uploads a file to the specified path';
  }

  getName() {
    return 'put';
  }

  getArgs(): ArgDefinition[] {
    return [
      {
        name: 'file',
        description: 'File in local filesystem to be uploaded',
        required: true,
      },
      {
        name: 'dest',
        description: 'Destination to upload the file to',
        required: true,
      },
    ];
  }

  async run(input: CommandInput) {
    const file = input.argsMap['file'] ?? '';
    const dest = input.argsMap['dest'] ?? '';

    const splitFilePath = this.pathHelper.splitFilePath(file);

    const destFullPath = this.appState.getFullPath(dest);
    const destExists = await this.appState.sftpClient.exists(destFullPath);
    const targetIsDirectory = destExists === 'd';
    const targetExists = destExists !== false;

    if (targetIsDirectory) {
      await this.upload(file, `${destFullPath}/${splitFilePath.filename}`);
    } else if (!targetExists) {
      await this.upload(file, destFullPath);
    } else {
      throw new CommandError(
        `Cannot move file because file already exists: ${dest}`,
      );
    }
  }

  async upload(file: string, dest: string) {
    let fileExists = true;
    try {
      await fs.stat(file);
    } catch {
      fileExists = false;
    }

    if (!fileExists) {
      throw new CommandError(`File not found: ${file}`);
    }
    await this.appState.sftpClient.put(file, dest);
  }
}

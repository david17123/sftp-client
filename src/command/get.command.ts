import * as fs from 'fs/promises';
import { injectable } from 'tsyringe';
import {
  ArgDefinition,
  BaseCommand,
  CommandInput,
  OptionDefinition,
  RequireConnection,
} from './base.command';
import { CommandError } from '../error/command.error';
import { PathHelper } from '../helper/path.helper';

@injectable()
@RequireConnection
export class GetCommand extends BaseCommand {
  constructor(private pathHelper: PathHelper) {
    super();
  }

  getDescription(): string {
    return 'Download file(s) from SFTP location';
  }

  getName() {
    return 'get';
  }

  getArgs(): ArgDefinition[] {
    return [
      {
        name: 'source',
        description: 'File to download',
        required: true,
      },
      {
        name: 'dest',
        description: 'Destination to move file to',
        required: true,
      },
    ];
  }

  getOptions(): OptionDefinition[] {
    return [
      {
        name: 'force',
        shortName: 'f',
        description: 'Force download even if file already exists',
      },
    ];
  }

  async run(input: CommandInput) {
    const source = input.args[0] ?? '';
    const dest = input.args[1] ?? '';

    let destIsDirectory: boolean;
    try {
      const destStat = await fs.stat(dest);
      destIsDirectory = destStat.isDirectory();
    } catch {
      destIsDirectory = false;
    }

    let downloadCount = 0;
    const filesToDownload = await this.pathHelper.getFilesInPath(source);
    for (const file of filesToDownload) {
      if (destIsDirectory) {
        await this.download(
          file.fullPath,
          `${dest}/${file.filename}`,
          input.options['force'] as boolean,
        );
      } else {
        await this.download(
          file.fullPath,
          dest,
          input.options['force'] as boolean,
        );
      }

      downloadCount += 1;
    }

    console.log(`Downloaded ${downloadCount} files to ${dest}`);
  }

  async download(source: string, dest: string, force: boolean = false) {
    let destExists = true;
    try {
      await fs.stat(dest);
    } catch {
      destExists = false;
    }

    if (destExists && !force) {
      throw new CommandError(
        `Cannot download file because file already exists: ${dest}`,
      );
    }

    console.log(`Downloading ${source}`);
    await this.appState.sftpClient.get(source, dest);
  }
}

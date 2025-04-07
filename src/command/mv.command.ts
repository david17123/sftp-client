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
export class MoveCommand extends BaseCommand {
  constructor(private pathHelper: PathHelper) {
    super();
  }

  getDescription(): string {
    return 'Move file(s) from one location to another';
  }

  getName() {
    return 'mv';
  }

  getArgs(): ArgDefinition[] {
    return [
      { name: 'source', description: 'File to move', required: true },
      {
        name: 'dest',
        description: 'Destination to move file to',
        required: true,
      },
    ];
  }

  async run(input: CommandInput) {
    const source = input.args[0] ?? '';
    const dest = input.args[1] ?? '';

    const destFullPath = this.appState.getFullPath(dest);
    const destExists = await this.appState.sftpClient.exists(destFullPath);
    const targetIsDirectory = destExists === 'd';
    const targetExists = destExists !== false;

    let movedCount = 0;
    const filesToMove = await this.pathHelper.getFilesInPath(source);
    for (const file of filesToMove) {
      if (targetIsDirectory) {
        await this.move(file.fullPath, `${destFullPath}/${file.filename}`);
      } else if (!targetExists) {
        await this.move(file.fullPath, destFullPath);
      } else {
        throw new CommandError(
          `Cannot move file because file already exists: ${dest}`,
        );
      }

      movedCount += 1;
    }

    console.log(`Moved ${movedCount} files to ${dest}`);
  }

  async move(source: string, dest: string) {
    console.log(`Moving ${source} to ${this.pathHelper.simplifyPath(dest)}`);
    await this.appState.sftpClient.rename(
      source,
      this.pathHelper.simplifyPath(dest),
    );
  }
}

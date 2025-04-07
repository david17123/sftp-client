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
export class ChangeDirectoryCommand extends BaseCommand {
  constructor(private pathHelper: PathHelper) {
    super();
  }

  getDescription(): string {
    return 'Change current working directory';
  }

  getName() {
    return 'cd';
  }

  getArgs(): ArgDefinition[] {
    return [
      { name: 'path', description: 'The path to change to', required: false },
    ];
  }

  async run(input: CommandInput) {
    const targetPath = input.args[0] ?? '';
    if (targetPath === '') {
      return;
    }
    let fullTargetPath = this.appState.getFullPath(targetPath);
    fullTargetPath = this.pathHelper.simplifyPath(fullTargetPath);

    try {
      const targetDirectoryStat =
        await this.appState.sftpClient.stat(fullTargetPath);
      if (!targetDirectoryStat.isDirectory) {
        throw new CommandError(`${targetPath} is not a directory`);
      }
    } catch (error) {
      throw new CommandError(
        `Failed to change directory to ${targetPath}: ${error.message}`,
      );
    }

    this.appState.setCwd(fullTargetPath);
  }
}

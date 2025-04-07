import { injectable } from 'tsyringe';
import {
  ArgDefinition,
  BaseCommand,
  CommandInput,
  RequireConnection,
} from './base.command';
import { PathHelper } from '../helper/path.helper';

@injectable()
@RequireConnection
export class RemoveCommand extends BaseCommand {
  constructor(private pathHelper: PathHelper) {
    super();
  }

  getDescription(): string {
    return 'Remove file(s) from SFTP location';
  }

  getName() {
    return 'rm';
  }

  getArgs(): ArgDefinition[] {
    return [
      {
        name: 'source',
        description: 'File to remove',
        required: true,
      },
    ];
  }

  async run(input: CommandInput) {
    const source = input.args[0] ?? '';

    let removeCount = 0;
    const filesToRemove = await this.pathHelper.getFilesInPath(source);
    for (const file of filesToRemove) {
      await this.remove(file.fullPath);

      removeCount += 1;
    }

    console.log(`Removed ${removeCount} files`);
  }

  async remove(source: string) {
    console.log(`Removing ${source}`);
    await this.appState.sftpClient.delete(source);
  }
}

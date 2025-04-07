import { injectable } from 'tsyringe';
import {
  ArgDefinition,
  BaseCommand,
  CommandInput,
  RequireConnection,
} from './base.command';
import { CommandError } from '../error/command.error';

@injectable()
@RequireConnection
export class CatCommand extends BaseCommand {
  getDescription(): string {
    return 'Print contents of a file to the console';
  }

  getName() {
    return 'cat';
  }

  getArgs(): ArgDefinition[] {
    return [
      {
        name: 'file',
        description: 'File to print its content',
        required: true,
      },
    ];
  }

  async run(input: CommandInput) {
    const file = input.argsMap['file'] ?? '';
    const fullFilePath = this.appState.getFullPath(file);
    const fileExists = await this.appState.sftpClient.exists(fullFilePath);
    if (fileExists === false) {
      throw new CommandError(`File not found: ${file}`);
    } else if (fileExists !== '-') {
      throw new CommandError(`${file} is not a file`);
    }

    const content = await this.appState.sftpClient.get(fullFilePath);
    console.log(content.toString());
  }
}

import * as readline from 'readline/promises';
import { stdin, stdout } from 'process';
import { autoInjectable, injectAll, registry } from 'tsyringe';
import {
  BaseCommand,
  CommandInput,
  parseCommandString,
} from './command/base.command';
import { ConnectCommand } from './command/connect.command';
import { CloseCommand } from './command/close.command';
import { HelpCommand } from './command/help.command';
import { ListCommand } from './command/ls.command';
import { MoveCommand } from './command/mv.command';
import { PwdCommand } from './command/pwd.command';
import { ChangeDirectoryCommand } from './command/cd.command';
import { CatCommand } from './command/cat.command';
import { PutCommand } from './command/put.command';
import { GetCommand } from './command/get.command';
import { RemoveCommand } from './command/rm.command';
import { ConfigHelper } from './helper/config.helper';

@autoInjectable()
@registry([
  { token: 'BaseCommand', useClass: HelpCommand },
  { token: 'BaseCommand', useClass: ConnectCommand },
  { token: 'BaseCommand', useClass: CloseCommand },
  { token: 'BaseCommand', useClass: PwdCommand },
  { token: 'BaseCommand', useClass: ChangeDirectoryCommand },
  { token: 'BaseCommand', useClass: ListCommand },
  { token: 'BaseCommand', useClass: MoveCommand },
  { token: 'BaseCommand', useClass: CatCommand },
  { token: 'BaseCommand', useClass: PutCommand },
  { token: 'BaseCommand', useClass: GetCommand },
  { token: 'BaseCommand', useClass: RemoveCommand },
])
export class App {
  private readlineInterface: readline.Interface;
  private commands: Record<string, BaseCommand> = {};
  private done: boolean = false;

  constructor(
    @injectAll('BaseCommand') commands?: BaseCommand[],
    private configHelper?: ConfigHelper,
  ) {
    for (const command of commands) {
      this.registerCommand(command);
    }
    this.configHelper.loadConfig();
  }

  private registerCommand(command: BaseCommand) {
    this.commands[command.getName()] = command;
  }

  getAllCommands(): BaseCommand[] {
    return Object.values(this.commands);
  }

  async main() {
    this.readlineInterface = readline.createInterface(stdin, stdout);
    const args = process.argv.slice(2);
    const connectionName = args[0] ?? '';

    if (connectionName) {
      await this.runCommand({
        command: 'connect',
        args: [connectionName],
        options: {},
      });
    }

    while (!this.done) {
      const inputStr = await this.readlineInterface.question('> ');
      if (inputStr === 'exit') {
        await this.cleanUp();
        this.done = true;
        continue;
      }

      const input: CommandInput = parseCommandString(inputStr);
      if (input.command === '') {
        continue;
      }

      await this.runCommand(input);
    }

    this.readlineInterface.close();
  }

  async runCommand(input: CommandInput) {
    if (!this.commands[input.command]) {
      console.log(`Command not found: ${input.command}`);
      console.log(`Type 'help' for a list of available commands`);
      return;
    }

    try {
      await this.commands[input.command].execute(input);
    } catch (e) {
      console.error(e.message);
    }
  }

  async cleanUp() {
    await this.runCommand({ command: 'close', args: [], options: {} });
  }
}

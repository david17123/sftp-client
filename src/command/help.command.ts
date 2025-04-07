import { delay, inject, injectable } from 'tsyringe';
import { ArgDefinition, BaseCommand, CommandInput } from './base.command';
import { App } from '../app';

@injectable()
export class HelpCommand extends BaseCommand {
  constructor(@inject(delay(() => App)) private app: App) {
    super();
  }

  getName() {
    return 'help';
  }

  getDescription(): string {
    return 'Prints help for a command';
  }

  getArgs(): ArgDefinition[] {
    return [
      {
        name: 'command',
        description: 'Command to get help for',
      },
    ];
  }

  async run(input: CommandInput) {
    if (input.argsMap['command']) {
      this.printCommandHelp(input.argsMap['command']);
    } else {
      this.printAvailableCommands();
    }
  }

  private printCommandHelp(commandName: string) {
    let command: BaseCommand = null;
    for (const com of this.app.getAllCommands()) {
      if (com.getName() === commandName) {
        command = com;
        break;
      }
    }

    if (command === null) {
      console.log(`Command not found: ${commandName}`);
      return;
    }

    // Print command details
    let commandFormula = commandName;
    for (const arg of command.getArgs()) {
      if (arg.required) {
        commandFormula += ` ${arg.name}`;
      } else {
        commandFormula += ` [${arg.name}]`;
      }
    }
    console.log(`${commandFormula}\n`);
    console.log(`${command.getDescription()}\n`);

    if (command.getArgs().length > 0) {
      console.log('Arguments:\n');
      for (const arg of command.getArgs()) {
        console.log(`  ${arg.name}: ${arg.description}`);
      }
      console.log('');
    }

    if (command.getOptions().length > 0) {
      console.log('Options:\n');
      for (const opt of command.getOptions()) {
        let optName = `--${opt.name}`;
        if (opt.shortName) {
          optName += `, -${opt.shortName}`;
        }
        console.log(`  ${optName}: ${opt.description}`);
      }
      console.log('');
    }
  }

  private printAvailableCommands() {
    console.log('Available commands:');
    for (const command of this.app.getAllCommands()) {
      const commandName = command.getName();
      if (commandName === 'help') {
        continue;
      }

      console.log(`  ${commandName}`);
    }

    console.log("\nType 'exit' to quit");
  }
}

import { container } from 'tsyringe';
import { AppState } from '../app-state';
import { AppError } from '../error/app.error';
import { CommandError } from '../error/command.error';

export interface CommandInput {
  command: string;
  args: string[];
  argsMap?: { [arg: string]: string };
  options: { [option: string]: string | boolean };
}

export interface ArgDefinition {
  name: string;
  description: string;
  required?: boolean;
}

export interface OptionDefinition {
  name: string;
  shortName?: string;
  description: string;
}

export abstract class BaseCommand {
  static requireConnection = false;

  protected appState: AppState;

  constructor() {
    this.appState = container.resolve(AppState);
  }

  abstract getName(): string;

  /**
   * The command's main routine, to be implemented by the subclass.
   * @param args Command arguments
   */
  abstract run(input: CommandInput): Promise<void>;

  getDescription(): string {
    return '';
  }

  getHelp(): string {
    return '';
  }

  getArgs(): ArgDefinition[] {
    return [];
  }

  getOptions(): OptionDefinition[] {
    return [];
  }

  /**
   * The method that to execute the command. This method will call the `run`
   * method internally. This method should not be overridden by the subclass.
   */
  execute(input: CommandInput): Promise<void> {
    if (
      (this.constructor as typeof BaseCommand).requireConnection &&
      !this.appState.isConnected()
    ) {
      throw new AppError('Not connected to an SFTP server');
    }

    return this.run(this.mapInputArgsAndOpts(input));
  }

  private mapInputArgsAndOpts(input: CommandInput): CommandInput {
    // Map arguments
    const argsMap: CommandInput['argsMap'] = {};
    const argsDef = this.getArgs();
    const args = [...input.args];
    while (args.length > 0) {
      const arg = args.shift();
      const argDef = argsDef.shift();

      if (!argDef) {
        break;
      }
      argsMap[argDef.name] = arg;
    }

    const missingRequiredArgs = argsDef
      .filter((def) => def.required)
      .map((def) => def.name);
    if (missingRequiredArgs.length > 0) {
      throw new CommandError(
        `Missing required argument(s): ${missingRequiredArgs.join(', ')}`,
      );
    }

    // Normalise options
    const normalisedOptions: CommandInput['options'] = {};
    const optionNames = Object.keys(input.options);
    const optionsDef = this.getOptions();
    for (const optionName of optionNames) {
      const optionDef = optionsDef.find(
        (def) => def.name === optionName || def.shortName === optionName,
      );

      if (!optionDef) {
        continue;
      }

      const normalisedName = optionDef.name;
      normalisedOptions[normalisedName] = input.options[optionName];
    }

    return {
      ...input,
      argsMap,
      options: normalisedOptions,
    };
  }
}

export function RequireConnection(constructor) {
  constructor.requireConnection = true;
}

export function parseCommandString(str: string): CommandInput {
  const splitterRegex = /--?[^\s=]+(?:[\s=]+[^\s=-]+)?|\S+/g;
  const optionRegex = /^(--?)([^\s=]+)(?:(?:\s+|=)(\S+))?$/;

  const terms = str.match(splitterRegex);
  if (!terms) {
    return null;
  }

  const command = terms.shift();
  const args: CommandInput['args'] = [];
  const options: CommandInput['options'] = {};
  for (const term of terms) {
    const optionMatches = term.match(optionRegex);
    if (optionMatches) {
      if (optionMatches[1] === '-') {
        for (const option of optionMatches[2]) {
          options[option] = true;
        }
        continue;
      }

      options[optionMatches[2]] = optionMatches[3] ?? true;
    } else {
      args.push(term);
    }
  }

  return {
    command,
    args,
    options,
  };
}

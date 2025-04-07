import { injectable } from 'tsyringe';
import { BaseCommand, RequireConnection } from './base.command';

@injectable()
@RequireConnection
export class PwdCommand extends BaseCommand {
  getDescription(): string {
    return 'Print current working directory';
  }

  getName() {
    return 'pwd';
  }

  async run() {
    const cwd = await this.appState.sftpClient.cwd();
    console.log(`${cwd}${this.appState.getFullPath('')}`);
  }
}

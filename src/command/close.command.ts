import { injectable } from 'tsyringe';
import { BaseCommand } from './base.command';

@injectable()
export class CloseCommand extends BaseCommand {
  getDescription(): string {
    return 'Disconnects the current SFTP connection';
  }

  getName() {
    return 'close';
  }

  async run() {
    if (this.appState.sftpClient === null) {
      console.log('No connection to close');
      return;
    }

    console.log(`Disconnecting from ${this.appState.connectionName}`);
    try {
      await this.appState.sftpClient.end();
      this.appState.reset();
    } catch (error) {
      console.error(`Failed to close SFTP connection: ${error.message}`, error);
    }
  }
}

import * as SftpClient from 'ssh2-sftp-client';
import { injectable } from 'tsyringe';
import { ArgDefinition, BaseCommand, CommandInput } from './base.command';
import { SftpError } from '../error/sftp.error';
import { CloseCommand } from './close.command';
import { ConfigHelper } from '../helper/config.helper';

@injectable()
export class ConnectCommand extends BaseCommand {
  constructor(
    private configHelper: ConfigHelper,
    private closeCommand: CloseCommand,
  ) {
    super();
  }

  getDescription(): string {
    return 'Connect to an SFTP connection';
  }

  getName() {
    return 'connect';
  }

  getArgs(): ArgDefinition[] {
    return [
      {
        name: 'connection',
        description: 'The FTP connection name to connect to',
        required: false,
      },
    ];
  }

  async run(input: CommandInput) {
    const connectionName = input.argsMap['connection'] ?? '';
    if (!connectionName) {
      console.log('No connection name provided');
      this.printConnectionNames();
      return;
    }

    if (!this.configHelper.config.connections[connectionName]) {
      console.log(`Unknown connection name: ${connectionName}`);
      this.printConnectionNames();
      return;
    }

    if (this.appState.sftpClient !== null) {
      this.closeCommand.run();
    }

    try {
      console.log(`Connecting to ${connectionName}...`);

      const sftpClient = new SftpClient();
      await sftpClient.connect({
        host: this.configHelper.config.connections[connectionName].hostname,
        port: this.configHelper.config.connections[connectionName].port,
        username: this.configHelper.config.connections[connectionName].username,
        password: this.configHelper.config.connections[connectionName].password,
        retries: 5,
      });

      this.appState.connectionName = connectionName;
      this.appState.sftpClient = sftpClient;

      console.log(`Connected to ${connectionName}`);
    } catch (error) {
      throw new SftpError(
        `Failed to connect to Shippit SFTP server: ${error.message}`,
      );
    }
  }

  printConnectionNames() {
    console.log('Available connections:');
    for (const connectionName of Object.keys(
      this.configHelper.config.connections,
    )) {
      console.log(
        `  - ${connectionName} (${this.configHelper.config.connections[connectionName].hostname})`,
      );
    }
    console.log('');
  }
}

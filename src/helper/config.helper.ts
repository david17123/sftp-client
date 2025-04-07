import * as fs from 'fs';
import { singleton } from 'tsyringe';
import * as yaml from 'yaml';

export interface SftpConnectionConfig {
  hostname: string;
  port: number;
  username: string;
  password: string;
}

export interface Config {
  connections: { [connectionName: string]: SftpConnectionConfig };
}

@singleton()
export class ConfigHelper {
  config: Config;

  loadConfig(): Config {
    const configPath = './config.yaml';
    const file = fs.readFileSync(configPath, 'utf8');
    this.config = yaml.parse(file);

    return this.config;
  }
}

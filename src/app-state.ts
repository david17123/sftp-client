import * as SftpClient from 'ssh2-sftp-client';
import { singleton } from 'tsyringe';

@singleton()
export class AppState {
  private cwd: string = '';
  connectionName: string = '';
  sftpClient: SftpClient = null;

  isConnected(): boolean {
    return this.sftpClient !== null;
  }

  reset() {
    this.connectionName = '';
    this.sftpClient = null;
    this.cwd = '';
  }

  getFullPath(path: string): string {
    const cleanedPath = path.replace(/^\/+/g, '');
    return `${this.cwd}/${cleanedPath}`.replace(/^\/+/g, '');
  }

  setCwd(cwd: string) {
    this.cwd = cwd.replace(/^\/+|\/+$/g, '');
  }
}

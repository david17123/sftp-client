import { injectable } from 'tsyringe';
import { AppState } from '../app-state';

export interface FilePath {
  fullPath: string;
  filename: string;
}

@injectable()
export class PathHelper {
  constructor(private appState: AppState) {}

  /**
   * Gets list of filenames that satisfies the given glob pattern. This method
   * works from the current working directory in the app state.
   */
  async getFilesInPath(filenameGlob: string): Promise<FilePath[]> {
    const parsedFilename = this.parseFilenameGlob(filenameGlob);

    const files: FilePath[] = [];
    const entries = await this.appState.sftpClient.list(
      this.appState.getFullPath(parsedFilename.directory),
    );
    for (const entry of entries) {
      if (entry.type !== '-') {
        continue;
      }
      if (!parsedFilename.nameRegex.test(entry.name)) {
        continue;
      }

      files.push({
        fullPath: this.simplifyPath(
          this.appState.getFullPath(
            `${parsedFilename.directory}/${entry.name}`,
          ),
        ),
        filename: entry.name,
      });
    }

    return files;
  }

  /**
   * Breaks down filename glob into directory and name glob parts.
   */
  private parseFilenameGlob(glob: string): {
    directory: string;
    nameGlob: string;
    nameRegex: RegExp;
  } {
    const splitFilePath = this.splitFilePath(glob);

    return {
      directory: splitFilePath.directory || '.',
      nameGlob: splitFilePath.filename,
      nameRegex: this.getRegexFromGlob(splitFilePath.filename),
    };
  }

  private getRegexFromGlob(glob: string): RegExp {
    let regexpStr = glob;

    const regexpChars = [
      '\\',
      '.',
      '+',
      '?',
      '|',
      '(',
      ')',
      '[',
      ']',
      '{',
      '}',
    ];
    for (const char of regexpChars) {
      regexpStr = regexpStr.replace(new RegExp(`\\${char}`, 'g'), `\\${char}`);
    }

    regexpStr = regexpStr.replace(/\*/g, '.*');

    return new RegExp(regexpStr);
  }

  /**
   * Simplify path string by resolving relative path components
   */
  simplifyPath(path: string): string {
    const pathComponents = path.split('/');
    let moveUpCount = 0;
    let index = pathComponents.length - 1;
    while (index >= 0) {
      const component = pathComponents[index];
      if (component === '..') {
        moveUpCount++;
        pathComponents.splice(index, 1);
      } else if (component === '.') {
        pathComponents.splice(index, 1);
      } else if (moveUpCount > 0) {
        pathComponents.splice(index, 1);
        moveUpCount--;
      }
      index--;
    }

    return pathComponents.join('/');
  }

  splitFilePath(filePath: string): { directory: string; filename: string } {
    let directory = '';
    let filename = '';

    const lastSlashIndex = filePath.lastIndexOf('/');
    if (lastSlashIndex === -1) {
      directory = '';
      filename = filePath;
    } else {
      directory = filePath.substring(0, lastSlashIndex) || '.';
      filename = filePath.substring(lastSlashIndex + 1);
    }

    return {
      directory,
      filename,
    };
  }
}

// src/common/file-manager.service.ts
import { Injectable } from '@nestjs/common';
import { join, relative } from 'path';
import * as fs from 'fs';

@Injectable()
export class FileManagerService {
  // Config hóa đường dẫn gốc (lấy từ ENV hoặc default)
  private readonly rootPath =
    process.env.MUSIC_LIBRARY_PATH || '/usr/src/app/library';

  get RootPath(): string {
    return this.rootPath;
  }

  getRelativePath(absolutePath: string): string {
    return relative(this.rootPath, absolutePath);
  }

  getAbsolutePath(relativePath: string): string {
    return join(this.rootPath, relativePath);
  }

  exists(relativePath: string): boolean {
    return fs.existsSync(this.getAbsolutePath(relativePath));
  }
}

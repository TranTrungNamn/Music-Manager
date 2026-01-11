import { Controller, Get, Logger } from '@nestjs/common';
// Đảm bảo đường dẫn này đúng với vị trí file của bạn
import { FileManagerService } from '../common/file-manager.service';

@Controller()
export class AppController {
  private readonly logger = new Logger('APP-ROOT');

  // SỬA TẠI ĐÂY: Đổi AppService thành FileManagerService
  constructor(private readonly fileManagerService: FileManagerService) {
    console.log('\n');
    this.logger.debug(
      '🚀 [SYSTEM]: AppController đã khởi tạo với FileManagerService',
    );
  }

  @Get()
  getHello(): string {
    console.log('\n');
    this.logger.log('🏠 [CHECK]: Có yêu cầu truy cập vào trang chủ Backend');

    // Bạn có thể thử gọi một hàm trong fileManagerService để test log
    // example: this.fileManagerService.someFunction();

    return 'Music Manager Backend is Running!';
  }
}

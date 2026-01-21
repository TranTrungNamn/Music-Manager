import { Test, TestingModule } from '@nestjs/testing';
import { SeederService } from '../src/modules/seeder/seeder.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Track } from '../src/entities/track.entity';
import { Artist } from '../src/entities/artist.entity';
import { Album } from '../src/entities/album.entity';
import { DataSource } from 'typeorm';

// --- CẤU HÌNH MOCK ---
// 1. Mock kết quả trả về khi insert Artist/Album để bước sau có ID dùng
const mockInsertResult = (entityName: string) => ({
  generatedMaps: [
    { id: 1, name: `Mock ${entityName} 1` },
    { id: 2, name: `Mock ${entityName} 2` },
  ],
  raw: [],
});

describe('SeederService (Album Logic Debug - No DB)', () => {
  let service: SeederService;

  // 2. Mock QueryBuilder để hứng dữ liệu và Log ra
  const mockQueryBuilder = {
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockImplementation((data) => {
      // In dữ liệu ra console để bạn kiểm tra logic
      const sample = Array.isArray(data) ? data[0] : data;
      const count = Array.isArray(data) ? data.length : 1;

      // Chỉ log chi tiết nếu dữ liệu có trường 'folderName' (Album) hoặc 'fileName' (Track)
      if (sample.folderName || sample.fileName) {
        console.log(`\n📦 [INSERT MOCK] Đang tạo ${count} bản ghi:`);
        if (sample.folderName)
          console.log(`   ► Album Path: ${sample.folderName}`);
        if (sample.fileName) console.log(`   ► Track File: ${sample.fileName}`);
        if (sample.relativePath)
          console.log(`   ► Full Path:  ${sample.relativePath}`);
      }
      return mockQueryBuilder; // Chain method
    }),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(mockInsertResult('Entity')), // Trả về ID giả
  };

  // 3. Mock EntityManager
  const mockEntityManager = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  // 4. Mock DataSource (Quan trọng nhất để bypass kết nối thật)
  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (cb) => {
      // Giả lập transaction thành công ngay lập tức
      await cb(mockEntityManager);
    }),
  };

  // 5. Mock Repository (Chỉ cần method find/save cơ bản nếu code dùng)
  const mockRepo = {
    find: jest.fn().mockResolvedValue([]),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeederService,
        { provide: DataSource, useValue: mockDataSource },
        // Inject Mock Repository cho các Entity
        { provide: getRepositoryToken(Track), useValue: mockRepo },
        { provide: getRepositoryToken(Artist), useValue: mockRepo },
        { provide: getRepositoryToken(Album), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<SeederService>(SeederService);
  });

  it('should generate correct Album and Track metadata structure', async () => {
    // CHẠY TEST
    console.log('🚀 Bắt đầu test logic sinh dữ liệu...');

    // Seed thử 10 bài
    // Vì mọi thứ là Mock nên nó sẽ chạy cực nhanh
    const result = await service.seed(10);

    expect(result).toBeDefined();
    // Kiểm tra xem transaction có được gọi không
    expect(mockDataSource.transaction).toHaveBeenCalled();
    // Kiểm tra xem có lệnh insert nào được thực thi không
    expect(mockQueryBuilder.insert).toHaveBeenCalled();

    console.log(
      '✅ Test hoàn tất! Hãy kiểm tra log ở trên để xem đường dẫn file có đúng ý bạn không.',
    );
  });
});

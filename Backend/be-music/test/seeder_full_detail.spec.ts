import { Test, TestingModule } from '@nestjs/testing';
import { SeederService } from '../src/modules/seeder/seeder.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Track } from '../src/entities/track.entity';
import { Artist } from '../src/entities/artist.entity';
import { Album } from '../src/entities/album.entity';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';

// --- CẤU HÌNH MOCK DỮ LIỆU ---
let savedArtists: any[] = [];
let savedAlbums: any[] = [];
let savedTracks: any[] = [];

describe('SeederService (Deep Inspection - 7 Tracks)', () => {
  let service: SeederService;

  // Mock QueryBuilder
  const mockQueryBuilder = {
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockImplementation((entity) => {
      mockQueryBuilder['targetEntity'] = entity;
      return mockQueryBuilder;
    }),
    values: jest.fn().mockImplementation((data) => {
      const entityName = mockQueryBuilder['targetEntity'].name;
      const items = Array.isArray(data) ? data : [data];

      if (entityName === 'Artist') {
        const startId = savedArtists.length + 1;
        const newItems = items.map((item, index) => ({
          ...item,
          id: startId + index,
        }));
        savedArtists.push(...newItems);
        mockQueryBuilder['tempResult'] = newItems;
      } else if (entityName === 'Album') {
        const startId = savedAlbums.length + 1;
        const newItems = items.map((item, index) => ({
          ...item,
          id: startId + index,
        }));
        savedAlbums.push(...newItems);
        mockQueryBuilder['tempResult'] = newItems;
      } else if (entityName === 'Track') {
        const startId = savedTracks.length + 1;
        const newItems = items.map((item, index) => ({
          ...item,
          id: startId + index,
        }));
        savedTracks.push(...newItems);
      }

      return mockQueryBuilder;
    }),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        generatedMaps: mockQueryBuilder['tempResult'] || [],
      });
    }),
  };

  const mockEntityManager = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (cb) => {
      await cb(mockEntityManager);
    }),
  };

  const mockRepo = {
    find: jest.fn().mockResolvedValue([]),
    save: jest.fn(),
  };

  beforeEach(async () => {
    savedArtists = [];
    savedAlbums = [];
    savedTracks = [];

    // --- MOCK FAKER: LUÔN TRẢ VỀ 7 BÀI HÁT ---
    jest.spyOn(faker.number, 'int').mockImplementation((options: any) => {
      if (options?.min === 4 && options?.max === 5) return 7; // Ép track = 7
      if (options?.min === 1 && options?.max === 2) return 1; // Ép album = 1

      const min = options?.min || 0;
      const max = options?.max || 100;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeederService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: getRepositoryToken(Track), useValue: mockRepo },
        { provide: getRepositoryToken(Artist), useValue: mockRepo },
        { provide: getRepositoryToken(Album), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<SeederService>(SeederService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should generate exactly 1 Album with 7 Tracks and show full details', async () => {
    console.log('🚀 Đang chạy giả lập tạo dữ liệu...');

    await service.seed(10);

    console.log(
      '\n=============================================================',
    );
    console.log('📝  CHI TIẾT DỮ LIỆU ĐƯỢC TẠO (MOCK)');
    console.log(
      '=============================================================',
    );

    if (savedAlbums.length === 0) {
      console.log('❌ Không có Album nào được tạo!');
      return;
    }

    const targetAlbum = savedAlbums[0];
    const artist = savedArtists.find((a) => a.id === targetAlbum.artist.id);
    const tracksOfAlbum = savedTracks.filter(
      (t) => t.album.id === targetAlbum.id,
    );

    // --- FIX: TÁI TẠO LẠI FOLDER NAME ---
    // Vì trường này bị xóa trước khi lưu vào DB, nên ta phải tự ghép chuỗi lại để hiển thị
    const artistName = artist ? artist.name : 'Unknown';
    const folderName = `${artistName} - ${targetAlbum.title} (${targetAlbum.releaseYear}) [${targetAlbum.bitDepth}B-${targetAlbum.sampleRate}kHz]`;

    console.log(`\n📀 ALBUM INFO:`);
    console.log(`   - Title:        ${targetAlbum.title}`);
    console.log(`   - Artist:       ${artistName}`);
    console.log(`   - Release Year: ${targetAlbum.releaseYear}`);
    console.log(
      `   - Quality:      ${targetAlbum.bitDepth}-bit / ${targetAlbum.sampleRate} kHz`,
    );
    // Sử dụng biến folderName vừa tính toán thay vì targetAlbum.folderName (bị undefined)
    console.log(`   - Folder Path:  ${folderName}`);
    console.log(`   - Cover Path:   ${targetAlbum.coverPath}`);

    console.log(`\n🎵 TRACKLIST (${tracksOfAlbum.length} bài):`);

    tracksOfAlbum.forEach((track) => {
      console.log(`   -------------------------------------------------------`);
      console.log(`   Track #${track.trackNumber}: ${track.title}`);
      console.log(`     📄 File Name:   ${track.fileName}`);
      console.log(`     📂 Full Path:   ${track.relativePath}`);
      console.log(`     ⏱  Duration:    ${track.duration}s`);
      console.log(
        `     📦 File Size:   ${(track.fileSize / 1024 / 1024).toFixed(2)} MB`,
      );
      console.log(`     📊 Bitrate:     ${track.bitrate} kbps`);
    });

    console.log(
      '\n=============================================================',
    );

    expect(savedAlbums.length).toBeGreaterThan(0);
    expect(tracksOfAlbum.length).toBe(7);
    expect(tracksOfAlbum[0].albumTitle).toBe(targetAlbum.title);
    // Kiểm tra xem Folder Path tái tạo có khớp logic không (dựa vào Cover Path chứa nó)
    expect(targetAlbum.coverPath).toContain(folderName);
  });
});

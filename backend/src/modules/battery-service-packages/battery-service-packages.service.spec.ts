import { Test, TestingModule } from '@nestjs/testing';
import { BatteryServicePackagesService } from './battery-service-packages.service';

describe('BatteryServicePackagesService', () => {
  let service: BatteryServicePackagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BatteryServicePackagesService],
    }).compile();

    service = module.get<BatteryServicePackagesService>(BatteryServicePackagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

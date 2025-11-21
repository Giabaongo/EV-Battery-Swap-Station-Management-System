import { Test, TestingModule } from '@nestjs/testing';
import { BatteryServicePackagesController } from './battery-service-packages.controller';
import { BatteryServicePackagesService } from './battery-service-packages.service';

describe('BatteryServicePackagesController', () => {
  let controller: BatteryServicePackagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatteryServicePackagesController],
      providers: [BatteryServicePackagesService],
    }).compile();

    controller = module.get<BatteryServicePackagesController>(BatteryServicePackagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

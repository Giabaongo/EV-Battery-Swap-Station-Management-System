import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateBatteryServicePackageDto } from './dto/create-battery-service-package.dto';
import { UpdateBatteryServicePackageDto } from './dto/update-battery-service-package.dto';

@Injectable()
export class BatteryServicePackagesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createBatteryServicePackageDto: CreateBatteryServicePackageDto) {
    try {
      return await this.databaseService.batteryServicePackage.create({
        data: createBatteryServicePackageDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Package name already exists');
      }
      throw error;
    }
  }

  async findAll(activeOnly: boolean = false) {
    const whereClause = activeOnly ? { active: true } : {};
    
    return await this.databaseService.batteryServicePackage.findMany({
      where: whereClause,
      orderBy: {
        package_id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const batteryServicePackage = await this.databaseService.batteryServicePackage.findUnique({
      where: { package_id: id },
    });

    if (!batteryServicePackage) {
      throw new NotFoundException(`Battery Service Package with ID ${id} not found`);
    }

    return batteryServicePackage;
  }

  async findByName(name: string) {
    const batteryServicePackage = await this.databaseService.batteryServicePackage.findFirst({
      where: { name },
    });

    if (!batteryServicePackage) {
      throw new NotFoundException(`Battery Service Package with name "${name}" not found`);
    }

    return batteryServicePackage;
  }

  async findActive() {
    return await this.databaseService.batteryServicePackage.findMany({
      where: { active: true },
      orderBy: {
        base_price: 'asc',
      },
    });
  }

  async update(id: number, updateBatteryServicePackageDto: UpdateBatteryServicePackageDto) {
    // Check if package exists
    await this.findOne(id);

    try {
      return await this.databaseService.batteryServicePackage.update({
        where: { package_id: id },
        data: updateBatteryServicePackageDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Package name already exists');
      }
      throw error;
    }
  }

  async activate(id: number) {
    await this.findOne(id);

    return await this.databaseService.batteryServicePackage.update({
      where: { package_id: id },
      data: { active: true },
    });
  }

  async deactivate(id: number) {
    await this.findOne(id);

    return await this.databaseService.batteryServicePackage.update({
      where: { package_id: id },
      data: { active: false },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return await this.databaseService.batteryServicePackage.delete({
      where: { package_id: id },
    });
  }

  async getPackagesByPriceRange(minPrice: number, maxPrice: number) {
    return await this.databaseService.batteryServicePackage.findMany({
      where: {
        base_price: {
          gte: minPrice,
          lte: maxPrice,
        },
        active: true,
      },
      orderBy: {
        base_price: 'asc',
      },
    });
  }

  async getPackagesByDuration(durationDays: number) {
    return await this.databaseService.batteryServicePackage.findMany({
      where: {
        duration_days: durationDays,
        active: true,
      },
      orderBy: {
        base_price: 'asc',
      },
    });
  }
}

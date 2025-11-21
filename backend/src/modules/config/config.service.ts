import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class ConfigService {
  constructor(private databaseService: DatabaseService) {}

  async create(createConfigDto: CreateConfigDto) {
    // Check if config already exists
    const existing = await this.databaseService.config.findUnique({
      where: { name: createConfigDto.name },
    });

    if (existing) {
      throw new BadRequestException(`Config with name "${createConfigDto.name}" already exists`);
    }

    return await this.databaseService.config.create({
      data: {
        type: createConfigDto.type as any,
        name: createConfigDto.name,
        value: createConfigDto.value,
        description: createConfigDto.description,
        is_active: true,
      },
    });
  }

  async findAll(type?: string, activeOnly: boolean = true) {
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (activeOnly) {
      where.is_active = true;
    }

    return await this.databaseService.config.findMany({
      where,
      orderBy: { type: 'asc' },
    });
  }

  async findOne(configId: number) {
    const config = await this.databaseService.config.findUnique({
      where: { config_id: configId },
    });

    if (!config) {
      throw new NotFoundException(`Config with ID ${configId} not found`);
    }

    return config;
  }

  async findByName(name: string) {
    const config = await this.databaseService.config.findUnique({
      where: { name },
    });

    if (!config) {
      throw new NotFoundException(`Config with name "${name}" not found`);
    }

    return config;
  }

  async update(configId: number, updateConfigDto: UpdateConfigDto) {
    // Verify config exists
    await this.findOne(configId);

    // Check if new name conflicts with another config
    if (updateConfigDto.name) {
      const existing = await this.databaseService.config.findUnique({
        where: { name: updateConfigDto.name },
      });

      if (existing && existing.config_id !== configId) {
        throw new BadRequestException(`Config with name "${updateConfigDto.name}" already exists`);
      }
    }

    return await this.databaseService.config.update({
      where: { config_id: configId },
      data: {
        ...(updateConfigDto.type && { type: updateConfigDto.type as any }),
        ...(updateConfigDto.name && { name: updateConfigDto.name }),
        ...(updateConfigDto.value && { value: updateConfigDto.value }),
        ...(updateConfigDto.description !== undefined && { description: updateConfigDto.description }),
        ...(updateConfigDto.is_active !== undefined && { is_active: updateConfigDto.is_active }),
      },
    });
  }

  async remove(configId: number) {
    // Verify config exists
    await this.findOne(configId);

    return await this.databaseService.config.delete({
      where: { config_id: configId },
    });
  }

  async getConfigValue(name: string): Promise<number> {
    const config = await this.findByName(name);

    if (!config.is_active) {
      throw new BadRequestException(`Config "${name}" is inactive`);
    }

    if (config.value === null) {
      throw new BadRequestException(`Config "${name}" has no value`);
    }

    return parseFloat(config.value.toString());
  }

  async toggleActive(configId: number) {
    const config = await this.findOne(configId);

    return await this.databaseService.config.update({
      where: { config_id: configId },
      data: { is_active: !config.is_active },
    });
  }
}

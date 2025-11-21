import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ConfigService } from './config.service';
import { SystemConfigService } from './system-config.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { $Enums } from '@prisma/client';

@ApiTags('config')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RolesGuard, EmailVerifiedGuard)
@Roles($Enums.Role.admin)
@Controller('config')
export class ConfigController {
  constructor(
    private readonly configService: ConfigService,
    private readonly systemConfigService: SystemConfigService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new configuration' })
  @ApiResponse({ status: 201, description: 'The configuration has been successfully created.' })
  async create(@Body() createConfigDto: CreateConfigDto) {
    return await this.configService.create(createConfigDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all configurations' })
  @ApiResponse({ status: 200, description: 'List of configurations.' })
  async findAll(
    @Query('type') type?: string,
    @Query('activeOnly') activeOnly: boolean = true,
  ) {
    return await this.configService.findAll(type, activeOnly);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a configuration by ID' })
  @ApiResponse({ status: 200, description: 'The configuration with the specified ID.' })
  async findOne(@Param('id') id: string) {
    return await this.configService.findOne(parseInt(id));
  }

  @Get('by-name/:name')
  @ApiOperation({ summary: 'Get a configuration by name' })
  @ApiResponse({ status: 200, description: 'The configuration with the specified name.' })
  async findByName(@Param('name') name: string) {
    return await this.configService.findByName(name);
  }

  @Get('value/:name')
  @ApiOperation({ summary: 'Get configuration value by name' })
  @ApiResponse({ status: 200, description: 'The value of the configuration with the specified name.' })
  async getConfigValue(@Param('name') name: string) {
    const value = await this.configService.getConfigValue(name);
    return { name, value };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a configuration by ID' })
  @ApiResponse({ status: 200, description: 'The configuration has been successfully updated.' })
  async update(@Param('id') id: string, @Body() updateConfigDto: UpdateConfigDto) {
    return await this.configService.update(parseInt(id), updateConfigDto);
  }

  @ApiOperation({ summary: 'Toggle the active status of a configuration by ID' })
  @ApiResponse({ status: 200, description: 'The active status of the configuration has been successfully toggled.' })
  @Patch(':id/toggle')
  async toggleActive(@Param('id') id: string) {
    return await this.configService.toggleActive(parseInt(id));
  }

  /**
   * ⭐ SYSTEM CONFIG ENDPOINTS
   */

  /**
   * Get all system configs (from memory cache)
   * GET /config/system/all
   */
  @Get('system/all')
  @ApiOperation({ summary: 'Get all system configurations from memory cache' })
  @ApiResponse({ status: 200, description: 'List of all system configurations.' })
  getAllSystemConfigs() {
    const configs = this.systemConfigService.getAll();
    return {
      success: true,
      data: configs,
      note: 'Configs are loaded once at server startup. Restart server to apply changes.',
    };
  }

  /**
   * Get specific system config value (from memory)
   * GET /config/system/:key
   */
  @Get('system/:key')
  @ApiOperation({ summary: 'Get a specific system configuration from memory cache' })
  @ApiResponse({ status: 200, description: 'The system configuration with the specified key.' })
  getSystemConfig(@Param('key') key: string) {
    const value = this.systemConfigService.get(key);
    return {
      key,
      value,
      exists: this.systemConfigService.has(key),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return await this.configService.remove(parseInt(id));
  }
}

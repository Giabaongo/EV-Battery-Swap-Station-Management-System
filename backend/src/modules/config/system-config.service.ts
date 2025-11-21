import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConfigType } from '@prisma/client';

export interface SystemConfigCache {
  [key: string]: string | number | boolean;
}

@Injectable()
export class SystemConfigService implements OnModuleInit {
  private readonly logger = new Logger(SystemConfigService.name);
  private configCache: SystemConfigCache = {};

  constructor(private prisma: DatabaseService) {}

  /**
   * Load configs KHI KHỞI ĐỘNG - chỉ 1 lần duy nhất
   * Muốn thay đổi config → Restart server
   */
  async onModuleInit() {
    await this.loadConfigs();
    this.logger.log('✅ System configs loaded (read-only until restart)');
    this.logConfigs();
  }

  /**
   * Load configs từ database - CHỈ CHẠY 1 LẦN khi start
   */
  private async loadConfigs(): Promise<void> {
    try {
      const configs = await this.prisma.config.findMany({
        where: {
          type: ConfigType.system,
          is_active: true,
        },
      });

      this.configCache = {};
      
      for (const config of configs) {
        if (config.string_value) {
          this.configCache[config.name] = this.parseValue(config.string_value);
        }
      }

      this.logger.log(`Loaded ${Object.keys(this.configCache).length} system config(s) into memory`);
    } catch (error) {
      this.logger.error('Failed to load system configs:', error);
      throw error; // Fail fast if configs can't be loaded
    }
  }

  /**
   * Log configs to console for debugging
   */
  private logConfigs(): void {
    this.logger.debug('System Configs:');
    for (const [key, value] of Object.entries(this.configCache)) {
      this.logger.debug(`  ${key} = ${value} (${typeof value})`);
    }
  }

  /**
   * Parse string value to appropriate type
   */
  private parseValue(value: string): string | number | boolean {
    // Try boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Try number
    const num = Number(value);
    if (!isNaN(num)) return num;

    // Return as string
    return value;
  }

  /**
   * Get config value (synchronously from memory cache)
   * NO DATABASE QUERY - chỉ đọc từ memory
   */
  get<T = any>(key: string, defaultValue?: T): T {
    const value = this.configCache[key];
    return (value !== undefined ? value : defaultValue) as T;
  }

  /**
   * Get config value synchronously (alias for get)
   */
  getSync<T = any>(key: string, defaultValue?: T): T {
    return this.get(key, defaultValue);
  }

  /**
   * Get boolean config (synchronously)
   */
  getBoolean(key: string, defaultValue: boolean = false): boolean {
    const value = this.get(key, defaultValue);
    return Boolean(value);
  }

  /**
   * Get number config (synchronously)
   */
  getNumber(key: string, defaultValue: number = 0): number {
    const value = this.get(key, defaultValue);
    return Number(value);
  }

  /**
   * Get string config (synchronously)
   */
  getString(key: string, defaultValue: string = ''): string {
    const value = this.get(key, defaultValue);
    return String(value);
  }

  /**
   * Get all system configs (snapshot from memory)
   */
  getAll(): SystemConfigCache {
    return { ...this.configCache };
  }

  /**
   * Check if a config key exists
   */
  has(key: string): boolean {
    return key in this.configCache;
  }
}

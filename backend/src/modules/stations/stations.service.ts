import { BadRequestException, ConflictException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { StationStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { VehiclesService } from '../vehicles/vehicles.service';
import { DatabaseService } from '../database/database.service';
import { findAvailibaleStationsDto } from './dto/find-availiable-station.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StationsService {
  private logger = new Logger(StationsService.name);

  constructor(
    private vehiclesService: VehiclesService,
    private databaseService: DatabaseService,
    private configService: ConfigService
  ) { }

  async create(createStationDto: CreateStationDto) {
    try {
      const newStation = await this.databaseService.station.create({
        data: createStationDto,
      });

      return newStation;
    } catch (error) {
      throw error;
    }
  }

  async findAll(status?: StationStatus) {
    const whereClause = status ? { status } : {};

    return await this.databaseService.station.findMany({
      where: whereClause,
      include: {
        batteries: {
          select: {
            battery_id: true,
            status: true,
            current_charge: true,
          },
        },
      },
      orderBy: {
        station_id: 'asc',
      },
    });
  }

  async findAllAvailable(
    dto: findAvailibaleStationsDto,
  ) {
    try {
      const radiusKm = this.configService.get<number>('SEARCH_RADIUS_KM', 20);

      // If vehicle_id is not provided, get all active stations
      if (!dto.vehicle_id || !dto.latitude || !dto.longitude) {
        this.logger.log('Longitude and latitude not provide, return all station')
        const availableStations = await this.findAll(StationStatus.active);
        return availableStations;
      }

      // Type assertion - TypeScript biết chắc chắn không phải undefined
      const userLatitude: Decimal = new Decimal(dto.latitude);
      const userLongitude: Decimal = new Decimal(dto.longitude);

      const vehicle = await this.vehiclesService.findOne(dto.vehicle_id);

      if (vehicle.user_id !== dto.user_id) {
        throw new BadRequestException('Vehicle does not belong to the user');
      }

      const allAvailableStations = await this.databaseService.station.findMany({
        where: {
          status: 'active',
          batteries: {
            some: {
              model: vehicle.battery_model,
              type: vehicle.battery_type,
              status: 'full'
            }
          }
        },
        select: {
          station_id: true,
          name: true,
          address: true,
          latitude: true,
          longitude: true,
          status: true,
          _count: {
            select: {
              batteries: {
                where: {
                  model: vehicle.battery_model,
                  type: vehicle.battery_type,
                  status: 'full'
                }
              }
            }
          }
        }
      });

      const result = allAvailableStations
        .map(station => ({
          station_id: station.station_id,
          name: station.name,
          address: station.address,
          latitude: station.latitude,
          longitude: station.longitude,
          status: station.status,
          available_batteries: station._count.batteries,
          distance: this.calculateDistance(
            userLatitude,
            userLongitude,
            station.latitude,
            station.longitude
          )
        }))
        .filter(station => station.distance <= radiusKm) // Add this line
        .sort((a, b) => a.distance - b.distance);

      if (result.length === 0) {
        throw new NotFoundException(`No available stations found within ${radiusKm} km radius`);
      }

      return result.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    const station = await this.databaseService.station.findUnique({
      where: { station_id: id },
      include: {
        batteries: {
          select: {
            battery_id: true,
            model: true,
            type: true,
            status: true,
            current_charge: true,
            soh: true,
          },
        },
      },
    });

    if (!station) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }

    return station;
  }

  async findByName(name: string) {
    return await this.databaseService.station.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
      include: {
        batteries: {
          select: {
            battery_id: true,
            status: true,
          },
        },
      },
    });
  }

  async findActiveStations() {
    return await this.databaseService.station.findMany({
      where: { status: 'active' },
      include: {
        batteries: {
          where: { status: 'full' },
          select: {
            battery_id: true,
            model: true,
            type: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async update(id: number, updateStationDto: UpdateStationDto) {
    await this.findOne(id); // Check if station exists

    try {
      return await this.databaseService.station.update({
        where: { station_id: id },
        data: updateStationDto,
        include: {
          batteries: {
            select: {
              battery_id: true,
              status: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Station name already exists');
      }
      throw error;
    }
  }

  async updateStatus(id: number, status: StationStatus) {
    await this.findOne(id);

    return await this.databaseService.station.update({
      where: { station_id: id },
      data: { status },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if station exists

    return await this.databaseService.station.delete({
      where: { station_id: id },
    });
  }

  private calculateDistance(lat1: Decimal, lon1: Decimal, lat2: Decimal, lon2: Decimal): number {
    const R = 6371; // Earth's radius in kilometers

    // Convert all Decimal to number for mathematical operations
    const lat1Num = lat1.toNumber();
    const lon1Num = lon1.toNumber();
    const lat2Num = lat2.toNumber();
    const lon2Num = lon2.toNumber();

    const dLat = this.toRadians(lat2Num - lat1Num);
    const dLon = this.toRadians(lon2Num - lon1Num);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1Num)) * Math.cos(this.toRadians(lat2Num)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { CreateBatteryTransferRequestDto } from './dto/create-battery-transfer-request.dto';
import { UpdateBatteryTransferRequestDto } from './dto/update-battery-transfer-request.dto';
import { StationsService } from '../stations/stations.service';
import { DatabaseService } from '../database/database.service';
import { BatteryStatus, TransferStatus } from '@prisma/client/wasm';
import { BatteriesService } from '../batteries/batteries.service';
import { CabinetService } from '../cabinets/cabinets.service';

@Injectable()
export class BatteryTransferRequestService {
  private readonly logger = new Logger(BatteryTransferRequestService.name);

  constructor(
    private readonly cabinetService: CabinetService,
    private readonly stationsService: StationsService,
    private readonly databaseService: DatabaseService,
    private readonly batteriesService: BatteriesService,
  ) { }

  // Better validation with more specific checks
  async create(dto: CreateBatteryTransferRequestDto) {
    try {
      // Validate stations exist
      const [from_station, to_station] = await Promise.all([
        this.stationsService.findOne(dto.from_station_id),
        this.stationsService.findOne(dto.to_station_id),
      ]);

      // Check same station
      if (from_station.station_id === to_station.station_id) {
        throw new BadRequestException('Cannot transfer to the same station');
      }

      // Validate quantity > 0
      if (dto.quantity <= 0) {
        throw new BadRequestException('Quantity must be greater than 0');
      }

      const findBatteryAvailibleBatteriesDto = {
        model: dto.battery_model,
        type: dto.battery_type,
        station_id: from_station.station_id,
        status: BatteryStatus.full || BatteryStatus.charging,
        quantity: dto.quantity,
      };

      const availiableBatteries = await this.batteriesService.findBatteryAvailibleForTicket(findBatteryAvailibleBatteriesDto);

      if (availiableBatteries.length < dto.quantity) {
        throw new BadRequestException(
          `Not enough available batteries at station ${from_station.name}.
          Requested: ${dto.quantity}, Available: ${availiableBatteries.length}`
        );
      }

      const activeCabinets = await this.cabinetService.findManyByStation(dto.to_station_id);
      let allEmptySlots: any[] = [];
      for (const cabinet of activeCabinets) {
        const emptySlots = await this.cabinetService.findEmptySlotAtCabinet(cabinet.cabinet_id);
        allEmptySlots.push(...[emptySlots]);
      }

      if (allEmptySlots.length < dto.quantity) {
        throw new BadRequestException(`Not enough empty slots at station ${to_station.name} to import for transfer!`);
      }

      // Check for existing in-progress request
      const existingRequest = await this.databaseService.batteryTransferRequest.findFirst({
        where: {
          from_station_id: from_station.station_id,
          to_station_id: to_station.station_id,
          battery_model: dto.battery_model,
          battery_type: dto.battery_type,
          status: TransferStatus.in_progress,
        },
      });

      if (existingRequest) {
        throw new BadRequestException(
          `A battery transfer request is already in progress`
        );
      }

      // Create request
      const batteryTransferRequest = await this.databaseService.batteryTransferRequest.create({
        data: {
          battery_model: dto.battery_model,
          battery_type: dto.battery_type,
          quantity: dto.quantity,
          from_station_id: from_station.station_id,
          to_station_id: to_station.station_id,
        },
      });

      this.logger.log(`Created battery transfer request ID: ${batteryTransferRequest.transfer_request_id}`);
      return batteryTransferRequest;
    } catch (error) {
      this.logger.error(`Failed to create battery transfer request: ${error.message}`);
      throw error;
    }
  }

  async findAll() {
    this.logger.log('Fetching all battery transfer requests');
    return await this.databaseService.batteryTransferRequest.findMany({
      include: {
        fromStation: true,
        toStation: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: number) {
    this.logger.log(`Fetching battery transfer request with ID: ${id}`);
    const request = await this.databaseService.batteryTransferRequest.findUnique({
      where: { transfer_request_id: id },
      include: {
        fromStation: true,
        toStation: true,
      },
    });

    if (!request) {
      throw new NotFoundException(`Battery transfer request with ID ${id} not found`);
    }

    return request;
  }

  async update(id: number, dto: UpdateBatteryTransferRequestDto) {
    try {
      const existingRequest = await this.findOne(id);

      const updatedRequest = await this.databaseService.batteryTransferRequest.update({
        where: { transfer_request_id: id },
        data: {
          status: dto.status
        },
      });

      this.logger.log(`Updated battery transfer request with ID: ${id}`);
      return updatedRequest;
    } catch (error) {
      this.logger.error('Failed to update battery transfer request: ' + error.message);
      throw error;
    }
  }
}

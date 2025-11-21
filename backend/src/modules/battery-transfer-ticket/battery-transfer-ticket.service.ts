import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateBatteryTransferTicketDto } from './dto/create-battery-transfer-ticket.dto';
import { UpdateBatteryTransferTicketDto } from './dto/update-battery-transfer-ticket.dto';
import { BatteryTransferTicketGateway } from './battery-transfer-ticket.gateway';
import { DatabaseService } from '../database/database.service';
import { BatteryStatus, CabinetStatus, TicketType, TransferStatus } from '@prisma/client';
import { CabinetService } from '../cabinets/cabinets.service';
import { findBatteryAvailibleForTransfers } from './dto/get-availibale-batteries-transfer.dto';
import { BatteryTransferRequestService } from '../battery-transfer-request/battery-transfer-request.service';
import { BatteriesService } from '../batteries/batteries.service';

@Injectable()
export class BatteryTransferTicketService {
  private readonly logger = new Logger(BatteryTransferTicketService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly batteryTransferRequestService: BatteryTransferRequestService,
    private readonly batteriesService: BatteriesService,
    private readonly cabinetsService: CabinetService,
    private readonly transferTicketGateway: BatteryTransferTicketGateway,
  ) { }

  async create(dto: CreateBatteryTransferTicketDto) {
    try {
      // ✅ Dùng service thay vì prisma trực tiếp
      const transferRequest = await this.batteryTransferRequestService.findOne(
        dto.transfer_request_id
      );

      // Validate battery quantity
      if (dto.battery_ids.length !== transferRequest.quantity) {
        throw new BadRequestException(
          `Battery count mismatch. Expected ${transferRequest.quantity}, got ${dto.battery_ids.length}`
        );
      }

      return await this.databaseService.$transaction(async (prisma) => {
        // 1. Tạo ticket
        const ticket = await prisma.batteryTransferTicket.create({
          data: {
            transfer_request_id: dto.transfer_request_id,
            ticket_type: dto.ticket_type,
            station_id: dto.station_id,
            staff_id: dto.staff_id,
          },
        });

        // 2. Tạo junction records
        await prisma.batteriesTransfer.createMany({
          data: dto.battery_ids.map((batteryId) => ({
            ticket_id: ticket.ticket_id,
            battery_id: batteryId,
          })),
        });

        // ✅ 3. XỬ LÝ IMPORT TICKET
        if (dto.ticket_type === TicketType.import) {
          // Kiểm tra export ticket tồn tại
          const exportTicket = await prisma.batteryTransferTicket.findFirst({
            where: {
              transfer_request_id: dto.transfer_request_id,
              ticket_type: TicketType.export,
            },
          });

          if (!exportTicket) {
            throw new BadRequestException(
              'Cannot create import ticket: No export ticket found'
            );
          }

          // Validate batteries thuộc export ticket
          const exportedBatteries = await prisma.batteriesTransfer.findMany({
            where: { ticket_id: exportTicket.ticket_id },
            select: { battery_id: true },
          });

          const exportedBatteryIds = exportedBatteries.map(b => b.battery_id);
          const invalidBatteries = dto.battery_ids.filter(
            id => !exportedBatteryIds.includes(id)
          );

          if (invalidBatteries.length > 0) {
            throw new BadRequestException(
              `Batteries [${invalidBatteries.join(', ')}] not in export ticket`
            );
          }

          await this.handleImportTicket(dto, prisma);
        }

        // ✅ 4. XỬ LÝ EXPORT TICKET
        if (dto.ticket_type === TicketType.export) {
          await this.handleExportTicket(dto, prisma);
        }

        // 5. Return với relations
        const createdTicket = await prisma.batteryTransferTicket.findUnique({
          where: { ticket_id: ticket.ticket_id },
          include: {
            batteries: {
              include: {
                battery: {
                  include: {
                    cabinet: true,
                    slot: true,
                  },
                },
              },
            },
            staff: {
              omit: {
                password: true,
                refresh_token: true,
                email_verified: true,
                email_token: true,
                email_token_expires: true,
                created_at: true,
                station_id: true,
              }
            },
            station: true,
            transferRequest: {
              include: {
                fromStation: true,
                toStation: true,
              },
            },
          },
        });

        if (!createdTicket) {
          throw new BadRequestException('Failed to retrieve created ticket');
        }

        // 🔔 WebSocket notification - Transfer ticket created
        const isExport = dto.ticket_type === TicketType.export;
        const relatedStation = isExport
          ? createdTicket.transferRequest.toStation
          : createdTicket.transferRequest.fromStation;

        this.transferTicketGateway.notifyTransferTicketCreated({
          ticketId: createdTicket.ticket_id,
          transferRequestId: createdTicket.transfer_request_id,
          ticketType: createdTicket.ticket_type,
          stationId: createdTicket.station_id,
          stationName: createdTicket.station.name,
          batteryIds: dto.battery_ids,
          batteryCount: dto.battery_ids.length,
          batteryModel: createdTicket.transferRequest.battery_model,
          batteryType: createdTicket.transferRequest.battery_type,
          staff: {
            staffId: createdTicket.staff_id,
            username: createdTicket.staff.username,
          },
          relatedStation: {
            stationId: relatedStation.station_id,
            stationName: relatedStation.name,
          },
          timestamp: new Date().toISOString(),
        });

        // 🔔 Additional notification for export/import completion
        if (isExport) {
          this.transferTicketGateway.notifyExportTicketCompleted({
            ticketId: createdTicket.ticket_id,
            transferRequestId: createdTicket.transfer_request_id,
            fromStationId: createdTicket.transferRequest.from_station_id,
            fromStationName: createdTicket.transferRequest.fromStation.name,
            toStationId: createdTicket.transferRequest.to_station_id,
            toStationName: createdTicket.transferRequest.toStation.name,
            batteryIds: dto.battery_ids,
            batteryCount: dto.battery_ids.length,
            batteryModel: createdTicket.transferRequest.battery_model,
            batteryType: createdTicket.transferRequest.battery_type,
            exportedBy: {
              staffId: createdTicket.staff_id,
              username: createdTicket.staff.username,
            },
            timestamp: new Date().toISOString(),
          });

          // Notify battery transit status
          this.transferTicketGateway.notifyBatteryTransitStatus({
            batteryIds: dto.battery_ids,
            fromStationId: createdTicket.transferRequest.from_station_id,
            fromStationName: createdTicket.transferRequest.fromStation.name,
            toStationId: createdTicket.transferRequest.to_station_id,
            toStationName: createdTicket.transferRequest.toStation.name,
            transferRequestId: createdTicket.transfer_request_id,
            ticketId: createdTicket.ticket_id,
            inTransit: true,
            timestamp: new Date().toISOString(),
          });
        } else {
          // Import ticket
          this.transferTicketGateway.notifyImportTicketCompleted({
            ticketId: createdTicket.ticket_id,
            transferRequestId: createdTicket.transfer_request_id,
            fromStationId: createdTicket.transferRequest.from_station_id,
            fromStationName: createdTicket.transferRequest.fromStation.name,
            toStationId: createdTicket.transferRequest.to_station_id,
            toStationName: createdTicket.transferRequest.toStation.name,
            batteryIds: dto.battery_ids,
            batteryCount: dto.battery_ids.length,
            batteryModel: createdTicket.transferRequest.battery_model,
            batteryType: createdTicket.transferRequest.battery_type,
            importedBy: {
              staffId: createdTicket.staff_id,
              username: createdTicket.staff.username,
            },
            timestamp: new Date().toISOString(),
          });

          // Notify battery arrival
          this.transferTicketGateway.notifyBatteryTransitStatus({
            batteryIds: dto.battery_ids,
            fromStationId: createdTicket.transferRequest.from_station_id,
            fromStationName: createdTicket.transferRequest.fromStation.name,
            toStationId: createdTicket.transferRequest.to_station_id,
            toStationName: createdTicket.transferRequest.toStation.name,
            transferRequestId: createdTicket.transfer_request_id,
            ticketId: createdTicket.ticket_id,
            inTransit: false,
            timestamp: new Date().toISOString(),
          });
        }

        return createdTicket;
      });
    } catch (error) {
      this.logger.error('Failed to create ticket: ' + error.message);
      throw error;
    }
  }

  // ==========================
  // NEW: API used by controller — getAvailableBatteriesForTransfer
  // ==========================
  async getAvailableBatteriesForTransfer(dto: findBatteryAvailibleForTransfers) {
    try {
      const transferRequest = await this.databaseService.batteryTransferRequest.findUnique({
        where: { transfer_request_id: dto.transfer_request_id },
      });

      if (!transferRequest) {
        throw new BadRequestException('Transfer request not found');
      }

      const whereBase: any = {
        model: transferRequest.battery_model,
        type: transferRequest.battery_type,
      };

      let availableBatteries: any[] = [];

      if (dto.ticket_type === TicketType.export) {
        // Export: batteries currently at from_station and not in_transit
        availableBatteries = await this.batteriesService.findBatteryAvailibleForTicket({
          station_id: transferRequest.from_station_id,
          model: transferRequest.battery_model,
          type: transferRequest.battery_type,
          quantity: transferRequest.quantity
        });

        if (availableBatteries.length < transferRequest.quantity) {
          throw new BadRequestException(
            `Not enough available batteries. Required: ${transferRequest.quantity}, Available: ${availableBatteries.length}`
          );
        }
      } else if (dto.ticket_type === TicketType.import) {
        // Import: gather from export tickets that reference this request
        const exportTickets = await this.databaseService.batteryTransferTicket.findMany({
          where: {
            transfer_request_id: dto.transfer_request_id,
            ticket_type: TicketType.export,
          },
          select: {
            batteries: {
              select: {
                battery: true,
              },
            },
          },
        });

        const allBatteriesFromExport = exportTickets.flatMap(t =>
          t.batteries.map(bt => bt.battery)
        );

        if (allBatteriesFromExport.length === 0) {
          throw new BadRequestException('No batteries found in export ticket');
        }

        // Only return up to required quantity
        availableBatteries = allBatteriesFromExport.slice(0, transferRequest.quantity);
      } else {
        throw new BadRequestException('Invalid ticket type');
      }

      return {
        transfer_request: transferRequest,
        required_quantity: transferRequest.quantity,
        available_batteries: availableBatteries,
        available_count: availableBatteries.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get available batteries: ${error.message}`);
      throw error;
    }
  }

  // ✅ IMPORT: Gán slot cho pin mới về
  private async handleImportTicket(
    dto: CreateBatteryTransferTicketDto,
    prisma: any
  ) {
    const cabinets = await this.cabinetsService.findManyByStation(
      dto.station_id,
      CabinetStatus.active
    );

    if (!cabinets || cabinets.length === 0) {
      throw new BadRequestException('No active cabinets at this station');
    }

    if (dto.battery_slot_mappings && dto.battery_slot_mappings.length > 0) {
      return this.handleManualSlotAssignment(dto, prisma);
    }

    // ✅ Lấy slots trống 
    let allEmptySlots: any[] = [];
    for (const cabinet of cabinets) {
      const emptySlots = await this.cabinetsService.findEmptySlotAtCabinet(cabinet.cabinet_id);
      allEmptySlots.push(...[emptySlots]);
    }

    if (allEmptySlots.length < dto.battery_ids.length) {
      throw new BadRequestException(
        `Not enough slots. Need: ${dto.battery_ids.length}, Available: ${allEmptySlots.length}`
      );
    }

    // ✅ Gán slot cho từng pin
    for (let i = 0; i < dto.battery_ids.length; i++) {
      const batteryId = dto.battery_ids[i];
      const slot = allEmptySlots[i];

      // ✅ Dùng BatteriesService thay vì prisma.battery.update
      await this.batteriesService.update(
        batteryId, {
        station_id: dto.station_id,
        cabinet_id: slot.cabinet_id,
        slot_id: slot.slot_id,
        status: BatteryStatus.charging
      },
        prisma
      );

      // Cập nhật slot
      await prisma.slot.update({
        where: { slot_id: slot.slot_id },
        data: { is_occupied: true },
      });

      this.logger.log(
        `✅ Battery ${batteryId} → Cabinet ${slot.cabinet_id}, Slot ${slot.slot_number}`
      );
    }

    // ✅ Update transfer request status
    await this.batteryTransferRequestService.update(dto.transfer_request_id, {
      status: TransferStatus.completed,
    });

    this.logger.log(`✅ Successfully assigned ${dto.battery_ids.length} batteries`);
  }

  // ✅ EXPORT: Sử dụng BatteriesService
  private async handleExportTicket(
    dto: CreateBatteryTransferTicketDto,
    prisma: any
  ) {
    // ✅ Validate batteries thuộc station
    for (const batteryId of dto.battery_ids) {
      const battery = await this.batteriesService.findOne(batteryId);

      if (battery.station_id !== dto.station_id) {
        throw new BadRequestException(
          `Battery ${batteryId} does not belong to station ${dto.station_id}`
        );
      }

      // Lưu slot_id trước khi export
      const slotId = battery.slot_id;

      // ✅ Dùng BatteriesService để update
      await this.batteriesService.update(
        batteryId, {
        station_id: null,
        cabinet_id: null,
        slot_id: null,
        status: BatteryStatus.in_transit
      },
        prisma
      );

      // Giải phóng slot
      if (slotId) {
        await prisma.slot.update({
          where: { slot_id: slotId },
          data: { is_occupied: false },
        });
      }
    }

    this.logger.log(`✅ Exported ${dto.battery_ids.length} batteries`);
  }

  // ✅ Manual slot assignment
  private async handleManualSlotAssignment(
    dto: CreateBatteryTransferTicketDto,
    prisma: any
  ) {
    const mappings = dto.battery_slot_mappings || [];

    if (mappings.length !== dto.battery_ids.length) {
      throw new BadRequestException('Slot mappings count must match battery count');
    }

    for (const mapping of mappings) {
      // Validate slot
      const slot = await this.cabinetsService.findOneSlotAtCabinet(
        mapping.cabinet_id,
        mapping.slot_id
      );

      if (slot.is_occupied) {
        throw new BadRequestException(
          `Slot ${slot.slot_number} in Cabinet ${mapping.cabinet_id} is occupied`
        );
      }

      // ✅ Dùng BatteriesService
      await this.batteriesService.update(
        mapping.battery_id, {
        station_id: dto.station_id,
        cabinet_id: mapping.cabinet_id,
        slot_id: mapping.slot_id,
        status: BatteryStatus.charging
      },
        prisma
      );

      // Update slot
      await prisma.slot.update({
        where: { slot_id: mapping.slot_id },
        data: { is_occupied: true },
      });

      this.logger.log(
        `Battery ${mapping.battery_id} manually assigned to Cabinet ${mapping.cabinet_id}, Slot ${mapping.slot_id}`
      );
    }
  }

  async findAll() {
    return await this.databaseService.batteryTransferTicket.findMany({
      include: {
        station: true,
      },
    });
  }

  async findOne(id: number) {
    const ticket = await this.databaseService.batteryTransferTicket.findUnique({
      where: { ticket_id: id },
      include: {
        station: true,
      },
    });

    if (!ticket) {
      throw new BadRequestException(`Battery Transfer Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async update(id: number, updateBatteryTransferTicketDto: UpdateBatteryTransferTicketDto) {
    const ticket = await this.findOne(id);

    const updatedTicket = await this.databaseService.batteryTransferTicket.update({
      where: { ticket_id: id },
      data: {
        ...updateBatteryTransferTicketDto,
      },
    });

    return updatedTicket;
  }

  async findBatteryTicketByStation(station_id: number) {
    return await this.databaseService.batteryTransferTicket.findMany({
      where: { station_id },
    });
  }

  remove(id: number) {
    return `This action removes a #${id} batteryTransferTicket`;
  }
}

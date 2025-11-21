import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCabinetDto } from './dto/create-cabinet.dto';
import { UpdateCabinetDto } from './dto/update-cabinet.dto';
import { DatabaseService } from '../database/database.service';
import { BatteryStatus, CabinetStatus } from '@prisma/client';
import { UpdateSlotDto } from './dto/update-slot.dto';

@Injectable()
export class CabinetService {
  constructor(
    private readonly databaseService: DatabaseService,
  ) { }

  async create(createCabinetDto: CreateCabinetDto) {
    return this.databaseService.$transaction(async (tx) => {
      const newCabinet = await tx.cabinet.create({
        data: {
          ...createCabinetDto,
        },
      });

      const slotCreationPromises: Promise<any>[] = [];
      for (let i = 1; i <= createCabinetDto.total_slots; i++) {
        slotCreationPromises.push(
          tx.slot.create({
            data: {
              cabinet_id: newCabinet.cabinet_id,
              slot_number: i,
              is_occupied: false,
            },
          })
        );
      }
      await Promise.all(slotCreationPromises);
      return newCabinet;
    });
  }

  async findAll() {
    return await this.databaseService.cabinet.findMany();
  }

  async findEmptySlotAtCabinet(cabinet_id: number) {
    try {
      const emptySlot = await this.databaseService.slot.findFirst({
        where: { cabinet_id, is_occupied: false },
      });

      if (!emptySlot) {
        throw new NotFoundException(`Not found empty slots at cabinte ${cabinet_id}`)
      }

      return emptySlot;
    } catch (error) {
      throw error;
    }
  }

  async findManyByStation(station_id: number, status?: CabinetStatus) {
    try {
      const cabinets = await this.databaseService.cabinet.findMany({
        where: { station_id, ...(status && { status }) },
      });

      if (cabinets.length === 0) {
        throw new NotFoundException(`No cabinets found for station ID ${station_id}`);
      }

      return cabinets;
    } catch (error) {
      throw error;
    }
  }

  async findOneCabinet(id: number) {
    try {
      const cabinet = await this.databaseService.cabinet.findUnique({
        where: { cabinet_id: id },
      });

      if (!cabinet) {
        throw new Error(`Cabinet with ID ${id} not found`);
      }

      return cabinet;
    } catch (error) {
      throw new Error(`Failed to retrieve cabinet: ${error.message}`);
    }
  }

  async findOneSlotAtCabinet(cabinet_id: number, slot_id: number) {
    try {
      const cabinet = await this.findOneCabinet(cabinet_id);

      const slot = await this.databaseService.slot.findUnique({
        where: { slot_id: slot_id },
      });

      if (!slot) {
        throw new Error(`Slot with ID ${slot_id} not found`);
      }

      if (slot.cabinet_id !== cabinet_id) {
        throw new Error(`Slot with ID ${slot_id} does not belong to cabinet with ID ${cabinet_id}`);
      }

      return slot;
    } catch (error) {
      throw new Error(`Failed to retrieve slot: ${error.message}`);
    }
  }

  async updateCabinet(id: number, updateCabinetDto: UpdateCabinetDto, tx?: any) {
    const prisma = tx || this.databaseService;
    try {
      const updatedCabinet = await prisma.cabinet.update({
        where: { cabinet_id: id },
        data: { ...updateCabinetDto },
      });

      return updatedCabinet;
    } catch (error) {
      throw new error;
    }
  }

  async updateSlot(id: number | null, updateSlotDto: UpdateSlotDto, tx?: any) {
    try {
      if (id === null) {
        throw new BadRequestException('Slot ID cannot be null');
      }
      const prisma = tx || this.databaseService;

      const updatedSlot = await prisma.slot.update({
        where: { slot_id: id },
        data: { ...updateSlotDto },
      });

      return updatedSlot;
    } catch (error) {
      throw error;
    }
  }

  async findAllEmptySlotsAtStation(station_id: number) {
    try {
      // Get all active cabinets at this station with their empty slots
      const cabinets = await this.databaseService.cabinet.findMany({
        where: { 
          station_id,
          status: CabinetStatus.active
        },
        include: {
          Slots: {
            where: {
              is_occupied: false
            },
            orderBy: {
              slot_number: 'asc'
            }
          }
        },
        orderBy: {
          cabinet_name: 'asc'
        }
      });

      // Flatten the results and format for frontend
      const availableSlots = cabinets.flatMap(cabinet => 
        cabinet.Slots.map(slot => ({
          cabinet_id: cabinet.cabinet_id,
          cabinet_name: cabinet.cabinet_name,
          slot_id: slot.slot_id,
          slot_number: slot.slot_number,
          display: `${cabinet.cabinet_name} - Slot ${slot.slot_number}`
        }))
      );

      if (availableSlots.length === 0) {
        throw new NotFoundException(
          `No empty slots available at station ID ${station_id}`
        );
      }

      return availableSlots;
    } catch (error) {
      throw error;
    }
  }
}

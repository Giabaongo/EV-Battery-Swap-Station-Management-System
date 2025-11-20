import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { SupportStatus } from '@prisma/client';
import { WebsocketService } from '../websocket/websocket.service';

@Injectable()
export class SupportsService {
  constructor(
    private prisma: DatabaseService,
    private websocketService: WebsocketService,
  ) {}

  async create(createSupportDto: CreateSupportDto) {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { user_id: createSupportDto.user_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate station if provided
    if (createSupportDto.station_id) {
      const station = await this.prisma.station.findUnique({
        where: { station_id: createSupportDto.station_id },
      });

      if (!station) {
        throw new NotFoundException('Station not found');
      }
    }

    // Create support ticket
    const support = await this.prisma.support.create({
      data: createSupportDto,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        station: true,
      },
    });

    // Send real-time notification to admins
    this.websocketService.notifyAdminsNewSupportTicket(support);

    return support;
  }

  async findAll() {
    return this.prisma.support.findMany({
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        station: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const support = await this.prisma.support.findUnique({
      where: { support_id: id },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        station: true,
      },
    });

    if (!support) {
      throw new NotFoundException(`Support with ID ${id} not found`);
    }

    return support;
  }

  async findByUser(userId: number) {
    return this.prisma.support.findMany({
      where: { user_id: userId },
      include: {
        station: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findByStation(stationId: number) {
    return this.prisma.support.findMany({
      where: { station_id: stationId },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findByStatus(status: SupportStatus) {
    return this.prisma.support.findMany({
      where: { status },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        station: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async update(id: number, updateSupportDto: UpdateSupportDto) {
    await this.findOne(id);

    // Validate station if changing
    if (updateSupportDto.station_id) {
      const station = await this.prisma.station.findUnique({
        where: { station_id: updateSupportDto.station_id },
      });

      if (!station) {
        throw new NotFoundException('Station not found');
      }
    }

    // Validate rating if provided
    if (updateSupportDto.rating !== undefined) {
      if (updateSupportDto.rating < 1 || updateSupportDto.rating > 5) {
        throw new BadRequestException('Rating must be between 1 and 5');
      }
    }

    const support = await this.prisma.support.update({
      where: { support_id: id },
      data: updateSupportDto,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        station: true,
      },
    });

    // Send real-time notification to user about the update
    if (support.status === SupportStatus.closed) {
      this.websocketService.notifyUserTicketResolved(support.user_id, support);
    } else {
      this.websocketService.notifyUserTicketUpdate(support.user_id, support);
    }

    return support;
  }

  async updateStatus(id: number, status: SupportStatus) {
    await this.findOne(id);

    const support = await this.prisma.support.update({
      where: { support_id: id },
      data: { status },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        station: true,
      },
    });

    // Send real-time notification to user about status change
    if (status === SupportStatus.closed) {
      this.websocketService.notifyUserTicketResolved(support.user_id, support);
    } else {
      this.websocketService.notifyUserTicketUpdate(support.user_id, support);
    }

    return support;
  }

  async addRating(id: number, rating: number) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const support = await this.findOne(id);

    if (support.status !== SupportStatus.closed) {
      throw new BadRequestException('Can only rate closed support tickets');
    }

    return this.prisma.support.update({
      where: { support_id: id },
      data: { rating },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        station: true,
      },
    });
  }

  async remove(id: number) {
    const support = await this.findOne(id);

    await this.prisma.support.delete({
      where: { support_id: id },
    });

    // Notify user that their ticket was deleted
    this.websocketService.notifyUserTicketDeleted(support.user_id, id);

    return support;
  }

  async getStatistics() {
    const [total, open, inProgress, closed, avgRating] = await Promise.all([
      this.prisma.support.count(),
      this.prisma.support.count({ where: { status: SupportStatus.open } }),
      this.prisma.support.count({ where: { status: SupportStatus.in_progress } }),
      this.prisma.support.count({ where: { status: SupportStatus.closed } }),
      this.prisma.support.aggregate({
        where: { rating: { not: null } },
        _avg: { rating: true },
      }),
    ]);

    return {
      total,
      byStatus: {
        open,
        in_progress: inProgress,
        closed,
      },
      averageRating: avgRating._avg.rating || 0,
    };
  }
}


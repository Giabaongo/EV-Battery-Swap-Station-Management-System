import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SwapTransactionsService } from './swap-transactions.service';
import { CreateSwapTransactionDto } from './dto/create-swap-transaction.dto';
import { UpdateSwapTransactionDto } from './dto/update-swap-transaction.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { $Enums } from '@prisma/client';

@Controller('swap-transactions')
@UseGuards(AuthGuard, RolesGuard)
export class SwapTransactionsController {
  constructor(private readonly swapTransactionsService: SwapTransactionsService) { }

  @Post()
  create(@Body() createDto: CreateSwapTransactionDto) {
    return this.swapTransactionsService.create(createDto);
  }

  @Roles($Enums.Role.admin)
  @Get()
  findAll() {
    return this.swapTransactionsService.findAll();
  }

  @Roles($Enums.Role.driver)
  @Get('user/:user_id')
  findAllByUserId(@Param('user_id', ParseIntPipe) user_id: number) {
    return this.swapTransactionsService.findAllByUserId(user_id);
  }

  @Roles($Enums.Role.admin, $Enums.Role.station_staff)
  @Get('station/:station_id')
  findByStation(@Param('station_id', ParseIntPipe) station_id: number) {
    return this.swapTransactionsService.findByStation(station_id);
  }

  @Roles($Enums.Role.admin)
  @Get('transaction/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.swapTransactionsService.findOne(id);
  }

  @Roles($Enums.Role.admin)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateSwapTransactionDto) {
    return this.swapTransactionsService.updateStatus(id, updateDto.status);
  }

  @Roles($Enums.Role.admin)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.swapTransactionsService.remove(id);
  }
}

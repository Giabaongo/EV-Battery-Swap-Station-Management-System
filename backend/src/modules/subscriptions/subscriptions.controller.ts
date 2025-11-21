import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req
} from '@nestjs/common';
import type { Request } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { $Enums } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('subscriptions')
@ApiBearerAuth('access-token')
@Controller('subscriptions')
@UseGuards(AuthGuard, RolesGuard, EmailVerifiedGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) { }

  @Roles($Enums.Role.driver)
  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'The subscription has been successfully created.' })
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  // StatusCode = 200 do ko tạo mới
  @HttpCode(HttpStatus.OK)
  @Post('expire-subscriptions')
  @Roles($Enums.Role.admin)
  @ApiOperation({ summary: 'Expire subscriptions that have passed their end date' })
  @ApiResponse({ status: 200, description: 'Subscriptions have been checked and expired if necessary.' })
  expireSubscriptions() {
    return this.subscriptionsService.updateExpiredSubscriptions();
  }

  @Get()
  @Roles($Enums.Role.admin, $Enums.Role.station_staff)
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiResponse({ status: 200, description: 'List of all subscriptions.' })
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get(':id')
  @Roles($Enums.Role.driver, $Enums.Role.admin, $Enums.Role.station_staff)
  @ApiOperation({ summary: 'Get a subscription by ID' })
  @ApiResponse({ status: 200, description: 'The subscription details.' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    // Extract user info from JWT token (attached by AuthGuard)
    const user = req['user'];
    return this.subscriptionsService.findOne(id, user);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get subscriptions by user ID' })
  @ApiResponse({ status: 200, description: 'List of subscriptions for the specified user.' })
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.subscriptionsService.findByUser(userId);
  }

  @Get('user/:userId/active')
  @ApiOperation({ summary: 'Get active subscriptions by user ID' })
  @ApiResponse({ status: 200, description: 'List of active subscriptions for the specified user.' })
  findActiveByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.subscriptionsService.findActiveByUser(userId);
  }

  @Patch(':id')
  @Roles($Enums.Role.admin)
  @ApiOperation({ summary: 'Update a subscription by ID' })
  @ApiResponse({ status: 200, description: 'The subscription has been successfully updated.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a subscription by ID' })
  @ApiResponse({ status: 200, description: 'The subscription has been successfully canceled.' })
  @Roles($Enums.Role.driver, $Enums.Role.admin)
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.cancel(id);
  }

  @Patch(':id/increment-swap')
  @Roles($Enums.Role.station_staff, $Enums.Role.admin)
  @ApiOperation({ summary: 'Increment the swap used count for a subscription by ID' })
  @ApiResponse({ status: 200, description: 'The swap used count has been successfully incremented.' })
  incrementSwapUsed(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.incrementSwapUsed(id);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.remove(id);
  }

  /**
   * Renew an expired subscription
   * PATCH /subscriptions/:id/renew
   */
  @Patch(':id/renew')
  @Roles($Enums.Role.driver, $Enums.Role.admin)
  @ApiOperation({ summary: 'Renew an expired subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription renewed successfully',
  })
  renewSubscription(
    @Param('id', ParseIntPipe) id: number,
    @Body() renewalDto: { vehicle_id: number },
  ) {
    return this.subscriptionsService.renewSubscription(id, renewalDto.vehicle_id);
  }

  /**
   * Get renewal cost (penalty fee calculation)
   * GET /subscriptions/:id/renewal-cost
   */
  // @Get(':id/renewal-cost')
  // @Roles($Enums.Role.driver, $Enums.Role.admin)
  // @ApiOperation({ summary: 'Get renewal cost including penalty fee' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Renewal cost details',
  // })
  // getRenewalCost(@Param('id', ParseIntPipe) id: number) {
  //   return this.subscriptionsService.renewSubscriptionWithPayment(id, 0);
  // }
}

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
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { $Enums } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';


@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, RolesGuard, EmailVerifiedGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }
  @Roles($Enums.Role.admin)
  @Post()
  @ApiOperation({ summary: 'Create a new staff (Admin only)' })
  @ApiResponse({ status: 201, description: 'The staff has been successfully created.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles($Enums.Role.admin)
  @Get()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users.' })
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * Get current user profile from JWT token
   */
  @Get('me/profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile.' })
  getCurrentUser(@Request() req) {
    const userId = req.user?.sub;
    return this.usersService.getUserProfile(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOneById(id);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get user by email' })
  @ApiResponse({ status: 200, description: 'User details.' })
  findOneByEmail(@Param('email') email: string) {
    return this.usersService.findOneByEmail(email);
  }


  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'Updated user details.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Roles($Enums.Role.station_staff, $Enums.Role.driver)
  @Patch('change-password')
  @ApiOperation({ summary: 'Change password for current user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  changePassword(
    @Request() req,
    @Body() dto: ChangePasswordDto
  ) {
    return this.usersService.changePassword(req.user.sub, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}

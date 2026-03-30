import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, RequirePermissions } from '../../guards/roles.guard';
import { SettingsService } from './settings.service';
import { UpdateCompanyDto, CreateUserDto, UpdateUserDto } from './dto/settings.dto';

@Controller('settings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // --- Company ---

  @Get('company') @RequirePermissions('settings.read')
  getCompanyProfile(@Request() req: any) {
    return this.settingsService.getCompanyProfile(req.user.companyId);
  }

  @Put('company') @RequirePermissions('settings.write')
  updateCompanyProfile(@Request() req: any, @Body() dto: UpdateCompanyDto) {
    return this.settingsService.updateCompanyProfile(req.user.companyId, dto);
  }

  // --- Users / Staff ---

  @Get('users') @RequirePermissions('users.read')
  getUsers(@Request() req: any) {
    return this.settingsService.getUsers(req.user.companyId);
  }

  @Post('users') @RequirePermissions('users.write')
  createUser(@Request() req: any, @Body() dto: CreateUserDto) {
    return this.settingsService.createUser(req.user.companyId, dto);
  }

  @Put('users/:id') @RequirePermissions('users.update')
  updateUser(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.settingsService.updateUser(req.user.companyId, id, dto);
  }

  @Delete('users/:id') @RequirePermissions('users.delete')
  deleteUser(@Request() req: any, @Param('id') id: string) {
    return this.settingsService.deleteUser(req.user.companyId, id, req.user.userId);
  }
}

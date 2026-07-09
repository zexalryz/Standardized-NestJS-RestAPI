import { Controller, Get, Param, Patch, Delete, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '../common/constants/role';
import { UserService } from './user.service';
import { Roles } from '../common/decorators/roles.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly user: UserService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get profile',
    description: 'Returns the authenticated user\'s profile information (id, username, email, role, createdAt). Requires a valid JWT access token in the Authorization header.',
  })
  getProfile(@Req() req: any) {
    return this.user.getProfile(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({
    summary: 'Update profile',
    description: 'Update the authenticated user\'s profile. Currently supports changing email address.',
  })
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.user.updateProfile(req.user.id, dto);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Dashboard stats',
    description: 'Returns aggregate statistics for the dashboard: total users, new users in last 7 days, and role distribution.',
  })
  stats() {
    return this.user.stats();
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'List all users (paginated)',
    description: '🔒 **Admin only.** Paginated user list. Returns users, total count, and pagination metadata. Accessible only by users with the ADMIN role. Other roles receive 403 Forbidden.',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Records to take (max 100)' })
  list(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.user.list(
      skip ? Math.max(0, parseInt(skip, 10)) : 0,
      take ? Math.min(100, Math.max(1, parseInt(take, 10))) : 100,
    );
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Update user role',
    description: '🔒 **Admin only.** Change a user\'s role. Sends 400 for invalid role values, 404 if user not found.',
  })
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.user.updateRole(id, dto.role);
  }

  @Patch('profile/password')
  @ApiOperation({
    summary: 'Change password',
    description: 'Change the authenticated user\'s password. Requires current password and a new password meeting strength requirements.',
  })
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.user.changePassword(req.user.id, dto);
  }

  @Delete('profile')
  @ApiOperation({
    summary: 'Delete own account',
    description: 'Permanently delete the authenticated user\'s account.',
  })
  deleteProfile(@Req() req: any) {
    return this.user.deleteProfile(req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Delete user (admin)',
    description: '🔒 **Admin only.** Permanently delete any user account by ID.',
  })
  deleteUser(@Param('id') id: string) {
    return this.user.deleteProfile(id);
  }
}

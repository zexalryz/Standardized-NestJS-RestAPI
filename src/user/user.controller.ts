import { Controller, Get, Param, Patch, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '../common/constants/role';
import { UserService } from './user.service';
import { Roles } from '../common/decorators/roles.decorator';

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

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'List all users',
    description: '🔒 **Admin only.** Returns every registered user. Accessible only by users with the ADMIN role. Other roles receive 403 Forbidden.',
  })
  list() {
    return this.user.list();
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Update user role',
    description: '🔒 **Admin only.** Change a user\'s role to one of: ADMIN, MODERATOR, DONATOR, USER. Sends 400 for invalid role values, 404 if user not found.',
  })
  updateRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.user.updateRole(id, role);
  }
}

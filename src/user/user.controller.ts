import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly user: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get profile', description: 'Returns the authenticated user\'s profile information.' })
  getProfile(@Req() req: any) {
    return this.user.getProfile(req.user.id);
  }
}

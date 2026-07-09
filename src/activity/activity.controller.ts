import { Controller, Get, Post, Body, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@ApiTags('Activity')
@ApiBearerAuth()
@Controller('activity')
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Post()
  @ApiOperation({
    summary: 'Log activity',
    description: 'Log an activity event for the authenticated user.',
  })
  log(@Req() req: any, @Body() dto: CreateActivityDto) {
    return this.activity.log(req.user.id, dto.type, dto.detail ?? '');
  }

  @Get()
  @ApiOperation({
    summary: 'Get activity feed',
    description: 'Returns recent activity events for the authenticated user. Default 50, max 100.',
  })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of entries (max 100)' })
  list(@Req() req: any, @Query('take') take?: string) {
    return this.activity.list(req.user.id, take ? Math.min(100, Math.max(1, parseInt(take, 10))) : 50);
  }
}

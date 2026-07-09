import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { register } from 'prom-client';
import type { Response } from 'express';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  @Public()
  @Get()
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Prometheus metrics', description: 'Exposes default process and HTTP metrics in Prometheus text format.' })
  async get(@Res() res: Response) {
    const metrics = await register.metrics();
    res.setHeader('Content-Type', register.contentType);
    res.send(metrics);
  }
}

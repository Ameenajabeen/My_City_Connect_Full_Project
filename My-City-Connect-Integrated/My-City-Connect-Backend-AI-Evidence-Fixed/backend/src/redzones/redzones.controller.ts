import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RedzonesService } from './redzones.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Red Zones & Spatial Hotspots')
@Controller(['red-zones', 'redzones'])
export class RedzonesController {
  constructor(private readonly redzonesService: RedzonesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List geographical high-density civic defect clusters' })
  async getRedZones(
    @Query('radius') radius?: number,
    @Query('minComplaints') minComplaints?: number
  ) {
    return this.redzonesService.detectRedZones(
      radius ? Number(radius) : 300,
      minComplaints ? Number(minComplaints) : 3
    );
  }
}

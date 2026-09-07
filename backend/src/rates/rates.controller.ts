import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RatesService } from './rates.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('rates')
@UseGuards(ApiKeyGuard)
export class RatesController {
  constructor(private readonly ratesService: RatesService) {}

  @Get()
  async getRate(@Query('from') from?: string, @Query('to') to?: string) {
    if (!from || !to) {
      throw new BadRequestException('Both "from" and "to" query params are required');
    }
    return this.ratesService.getRate(from, to);
  }
}

import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { RatesService } from './rates.service';

@Controller('rates')
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

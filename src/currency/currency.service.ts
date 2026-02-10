import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CurrencyService {
  private readonly apiKey: string;
  private readonly base: string;
  private readonly apiUrl = 'https://openexchangerates.org/api/latest.json';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPEN_EXCHANGE_RATES_API_KEY') ?? '';
    this.base = this.configService.get<string>('OPEN_EXCHANGE_RATES_BASE') ?? 'USD';

    if (!this.apiKey) {
      throw new Error('OPEN_EXCHANGE_RATES_API_KEY is not set');
    }
  }

  /**
   * Converts an amount from one currency to another using Open Exchange Rates.
   * amount: number to convert
   * from: ISO code of the source currency (e.g., "USD", "EUR")
   * to: ISO code of the target currency (e.g., "EUR", "CAD")
   */
  async convert(amount: number, from: string, to: string): Promise<number> {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    const fromCode = from.toUpperCase();
    const toCode = to.toUpperCase();

    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          app_id: this.apiKey,
          // In free plans, the base is usually always USD,
          // but we include the parameter for clarity.
          base: this.base,
        },
      });

      const rates = response.data.rates as Record<string, number>;

      if (!rates[fromCode]) {
        throw new BadRequestException(`Unsupported source currency: ${fromCode}`);
      }
      if (!rates[toCode]) {
        throw new BadRequestException(`Unsupported target currency: ${toCode}`);
      }

      // If base = USD:
      //   1 USD = rates["EUR"] EUR
      //   1 EUR = 1 / rates["EUR"] USD
      //   amount_from -> USD -> to
      const amountInBase = amount / rates[fromCode];       // convert FROM to USD
      const converted = amountInBase * rates[toCode];      // convert USD to TO

      // Round to 2 decimals
      return Number(converted.toFixed(2));
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        console.error('Open Exchange Rates error:', error.response.data);
      } else if (error instanceof Error) {
        console.error('Open Exchange Rates error:', error.message);
      } else {
        console.error('Open Exchange Rates error:', error);
      }
      // If you already threw BadRequestException above, Nest will respect it.
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error while fetching exchange rates');
    }
  }
}
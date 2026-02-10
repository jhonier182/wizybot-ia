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
   * Convierte una cantidad de una moneda a otra usando las tasas de Open Exchange Rates.
   * amount: número a convertir
   * from: código ISO de la moneda origen (ej. "USD", "EUR")
   * to: código ISO de la moneda destino (ej. "EUR", "CAD")
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
          // En los planes gratuitos normalmente la base es siempre USD,
          // pero dejamos el parámetro por claridad.
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

      // Si base = USD:
      //   1 USD = rates["EUR"] EUR
      //   1 EUR = 1 / rates["EUR"] USD
      //   amount_from -> USD -> to
      const amountInBase = amount / rates[fromCode];       // pasar de FROM a USD
      const converted = amountInBase * rates[toCode];      // pasar de USD a TO

      // Redondear a 2 decimales
      return Number(converted.toFixed(2));
    } catch (error: any) {
      if (error.response) {
        console.error('Open Exchange Rates error:', error.response.data);
      } else {
        console.error('Open Exchange Rates error:', error.message);
      }
      // Si ya lanzaste BadRequestException arriba, Nest la respetará.
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error while fetching exchange rates');
    }
  }
}
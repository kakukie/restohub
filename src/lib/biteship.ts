/**
 * Biteship API Integration Library
 * Provides methods for shipping rate calculation, order creation, and tracking.
 */

const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY || 'your_biteship_api_key_here';
const BITESHIP_BASE_URL = 'https://api.biteship.com';

export interface BiteshipRateRequest {
  origin_latitude: number;
  origin_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  couriers: string; // e.g., 'grab,gojek'
  items: {
    name: string;
    description?: string;
    value: number;
    quantity: number;
    weight: number; // in grams
  }[];
}

export const biteship = {
  /**
   * Get shipping rates from Biteship
   */
  async getRates(payload: BiteshipRateRequest) {
    try {
      const response = await fetch(`${BITESHIP_BASE_URL}/v1/rates/couriers`, {
        method: 'POST',
        headers: {
          'Authorization': BITESHIP_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Biteship getRates Error:', error);
      throw error;
    }
  },

  /**
   * Create a shipment order in Biteship
   */
  async createOrder(payload: any) {
    try {
      const response = await fetch(`${BITESHIP_BASE_URL}/v1/orders`, {
        method: 'POST',
        headers: {
          'Authorization': BITESHIP_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Biteship createOrder Error:', error);
      throw error;
    }
  },

  /**
   * Get real-time tracking information
   */
  async getTracking(orderId: string) {
    try {
      const response = await fetch(`${BITESHIP_BASE_URL}/v1/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': BITESHIP_API_KEY,
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Biteship getTracking Error:', error);
      throw error;
    }
  }
};

/**
 * Biteship API Integration Library
 * Provides methods for shipping rate calculation, order creation, and tracking.
 */

const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY;
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

// Mock data for testing when API Key is missing
const MOCK_RATES = {
  success: true,
  pricing: [
    {
      courier_name: "gojek",
      courier_service_name: "Instant",
      price: 15000,
      duration: "1 - 2 Hours"
    },
    {
      courier_name: "grab",
      courier_service_name: "Same Day",
      price: 20000,
      duration: "6 - 8 Hours"
    }
  ]
};

export const biteship = {
  /**
   * Get shipping rates from Biteship
   */
  async getRates(payload: BiteshipRateRequest) {
    if (!BITESHIP_API_KEY || BITESHIP_API_KEY === 'your_biteship_api_key_here') {
      console.warn('Biteship API Key missing. Returning mock data for testing.');
      return MOCK_RATES;
    }

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
      if (!response.ok) {
        console.error('Biteship API Error Response:', data);
        throw new Error(data.error || 'Biteship API error');
      }
      return data;
    } catch (error) {
      console.error('Biteship getRates Exception:', error);
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

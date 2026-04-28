/**
 * Biteship API Integration Library
 * Provides methods for shipping rate calculation, order creation, and tracking.
 */

const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY?.trim();
const BITESHIP_BASE_URL = 'https://api.biteship.com';
const BITESHIP_MODE = process.env.BITESHIP_MODE || 'live'; // 'live' or 'mock'

if (BITESHIP_API_KEY && !BITESHIP_API_KEY.startsWith('biteship_')) {
  console.warn('Warning: BITESHIP_API_KEY does not start with "biteship_". Please ensure you are using a valid API Key from Biteship Dashboard.');
}

console.log(`[BITESHIP] Initialize with Mode: ${BITESHIP_MODE.toUpperCase()}`);
if (BITESHIP_API_KEY) {
  console.log(`[BITESHIP] API Key detected: ${BITESHIP_API_KEY.substring(0, 15)}...`);
} else {
  console.warn(`[BITESHIP] NO API KEY DETECTED! Mode will default to MOCK.`);
}

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

// Mock data for testing when API Key is missing or BITESHIP_MODE is 'mock'
const MOCK_RATES = {
  success: true,
  pricing: [
    {
      courier_name: "gojek",
      courier_code: "gojek",
      courier_service_name: "Instant",
      courier_service_code: "instant",
      price: 15000,
      duration: "1 - 2 Hours"
    },
    {
      courier_name: "grab",
      courier_code: "grab",
      courier_service_name: "Same Day",
      courier_service_code: "same_day",
      price: 20000,
      duration: "6 - 8 Hours"
    },
    {
      courier_name: "JNE",
      courier_code: "jne",
      courier_service_name: "Reguler",
      courier_service_code: "reg",
      price: 9000,
      duration: "2 - 3 Days"
    },
    {
      courier_name: "SiCepat",
      courier_code: "sicepat",
      courier_service_name: "HALU",
      courier_service_code: "halu",
      price: 8000,
      duration: "2 - 4 Days"
    },
    {
      courier_name: "J&T",
      courier_code: "jnt",
      courier_service_name: "EZ",
      courier_service_code: "ez",
      price: 10000,
      duration: "2 - 3 Days"
    }
  ]
};

const MOCK_TRACKING = (courierName: string) => ({
  success: true,
  id: "mock_track_" + Date.now(),
  status: "on_process",
  courier: {
    tracking_id: "TRACK-MOCK-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
    waybill_id: "WB-MOCK-" + Date.now(),
    company: courierName,
    driver_name: "Budi Santoso",
    driver_phone: "08123456789"
  },
  history: [
    {
      status: "picked",
      note: "Paket telah diambil oleh kurir " + courierName,
      updated_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      status: "on_process",
      note: "Paket sedang dalam perjalanan ke alamat tujuan",
      updated_at: new Date().toISOString()
    }
  ]
});

export const biteship = {
  /**
   * Get shipping rates from Biteship
   */
  async getRates(payload: BiteshipRateRequest) {
    if (BITESHIP_MODE === 'mock' || BITESHIP_MODE === 'hybrid' || !BITESHIP_API_KEY || BITESHIP_API_KEY === 'your_biteship_api_key_here') {
      console.warn(`Biteship ${BITESHIP_MODE.toUpperCase()} Mode: Returning mock data for testing.`);
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
    if (BITESHIP_MODE === 'mock' || !BITESHIP_API_KEY || BITESHIP_API_KEY === 'your_biteship_api_key_here') {
      console.warn('Biteship MOCK Mode: Returning mock data for order creation.');
      return {
        success: true,
        id: "mock_biteship_order_" + Date.now(),
        courier: {
          tracking_id: "BSH-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
          waybill_id: "WB-" + Date.now()
        },
        status: "allocated"
      };
    }

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
      if (!response.ok) {
        console.error('Biteship Create Order Error Response:', data);
        throw new Error(data.error || 'Failed to create Biteship order');
      }
      return data;
    } catch (error) {
      console.error('Biteship createOrder Exception:', error);
      throw error;
    }
  },

  /**
   * Get real-time tracking information
   */
  async getTracking(orderId: string) {
    if (BITESHIP_MODE === 'mock' || !BITESHIP_API_KEY || BITESHIP_API_KEY === 'your_biteship_api_key_here') {
      return MOCK_TRACKING("Kurir Simulasi");
    }

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

import { useState, useEffect, useCallback } from "react";
import type { SensorData } from "@/pages/RealTimeMonitoring";
import { useOfflineStorage, type OfflineData } from "./useOfflineStorage";

// Mock data generator for demonstration
// Replace this with actual PostgreSQL API calls
const generateMockData = (): SensorData => {
  const now = new Date();
  const baseStroke = 125 + Math.sin(Date.now() / 10000) * 100;
  const basePressure = 120 + Math.sin(Date.now() / 8000) * 30 + Math.random() * 10;
  const baseTemp = 45 + Math.random() * 15;
  const vibration = 0.1 + Math.random() * 0.3;
  
  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (basePressure > 180 || baseTemp > 65) status = 'critical';
  else if (basePressure > 160 || baseTemp > 55 || vibration > 0.3) status = 'warning';

  return {
    timestamp: now.toISOString(),
    stroke: Math.max(0, baseStroke),
    pressure: Math.max(0, basePressure),
    temperature: baseTemp,
    vibration: vibration,
    status
  };
};

export const useRealTimeData = () => {
  const [data, setData] = useState<SensorData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { db, isOnline, generateOfflineSensorData } = useOfflineStorage();

  // Load data from offline storage or PostgreSQL
  const connectToDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (isOnline) {
        // Try PostgreSQL connection first
        try {
          // TODO: Replace with your actual PostgreSQL API endpoint
          const response = await fetch('/api/hydraulic-data/recent?minutes=5', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // Add your authentication headers here
              // 'Authorization': `Bearer ${YOUR_API_TOKEN}`
            }
          });
          
          if (response.ok) {
            const postgresData = await response.json();
            setData(postgresData);
            setIsConnected(true);
            setIsLoading(false);
            return;
          }
        } catch (postgresError) {
          console.log('PostgreSQL connection failed, using offline data:', postgresError);
        }
      }
      
      // Fallback to offline data
      const offlineData = await db.getRecentSensorData(5); // Last 5 minutes
      
      // If no offline data exists, generate some sample data
      if (offlineData.length === 0) {
        await generateOfflineSensorData(30);
        const newOfflineData = await db.getRecentSensorData(5);
        setData(newOfflineData.map(convertOfflineToSensor));
      } else {
        setData(offlineData.map(convertOfflineToSensor));
      }
      
      setIsConnected(true);
    } catch (err) {
      console.error('Database connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [db, isOnline, generateOfflineSensorData]);

  const convertOfflineToSensor = (offline: OfflineData): SensorData => ({
    timestamp: offline.timestamp,
    stroke: offline.stroke,
    pressure: offline.pressure,
    temperature: offline.temperature,
    vibration: offline.vibration,
    status: offline.status
  });

  // Real-time data updates
  useEffect(() => {
    if (!isConnected) {
      connectToDatabase();
      return;
    }

    const interval = setInterval(async () => {
      if (isOnline) {
        // Try to fetch latest data from PostgreSQL
        try {
          const response = await fetch('/api/hydraulic-data/latest');
          if (response.ok) {
            const latestData = await response.json();
            setData(prevData => {
              const newData = [...prevData, latestData];
              return newData.slice(-30); // Keep only last 5 minutes (30 points at 10s intervals)
            });
            return;
          }
        } catch (error) {
          console.log('Failed to fetch latest data, generating offline data');
        }
      }

      // Generate offline data point
      const newDataPoint = generateMockData();
      
      // Save to offline storage
      await db.addSensorData(newDataPoint);
      
      setData(prevData => {
        const newData = [...prevData, newDataPoint];
        return newData.slice(-30); // Keep only last 5 minutes
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [isConnected, connectToDatabase, isOnline, db]);

  const reconnect = useCallback(() => {
    setIsConnected(false);
    setError(null);
    connectToDatabase();
  }, [connectToDatabase]);

  return {
    data,
    isConnected,
    isLoading,
    error,
    reconnect
  };
};

// PostgreSQL Integration Helper Functions
// TODO: Implement these functions with your actual database credentials

export const createPostgreSQLConnection = async (config: {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}) => {
  // Implementation for PostgreSQL connection
  // You can use libraries like 'pg' for Node.js backend or
  // create API endpoints that your frontend can call
  
  console.log('PostgreSQL config:', config);
  
  // Example API endpoint structure:
  // POST /api/db/connect
  // {
  //   "host": "your-postgres-host",
  //   "port": 5432,
  //   "database": "hydraulic_data",
  //   "username": "your-username",
  //   "password": "your-password"
  // }
};

export const fetchHydraulicData = async (timeRange: string = '1h') => {
  // Implementation for fetching data from PostgreSQL
  // Example query structure:
  
  // const query = `
  //   SELECT 
  //     timestamp,
  //     stroke,
  //     pressure,
  //     temperature,
  //     vibration
  //   FROM sensor_data 
  //   WHERE timestamp >= NOW() - INTERVAL '${timeRange}'
  //   ORDER BY timestamp ASC
  // `;
  
  console.log('Fetching data for time range:', timeRange);
  
  // Return mock data for now
  return [];
};

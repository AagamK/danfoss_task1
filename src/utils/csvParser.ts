import Papa from 'papaparse';
import { HydraulicParameters } from '@/components/HydraulicSimulator';
import type { SimulationDataPoint } from '@/hooks/useHydraulicCalculations';

// This function for parsing simulation parameters remains unchanged.
export const parseParametersFromCSV = (file: File): Promise<HydraulicParameters> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data[0] as any;
        if (!data) { reject(new Error("CSV file is empty or invalid.")); return; }
        const parameters: HydraulicParameters = {
          cylinderBore: Number(data.cylinderBore), rodDiameter: Number(data.rodDiameter),
          deadLoad: Number(data.deadLoad), holdingLoad: Number(data.holdingLoad),
          motorRpm: Number(data.motorRpm), pumpEfficiency: Number(data.pumpEfficiency),
          systemLosses: Number(data.systemLosses),
          phases: {
            fastDown: { speed: Number(data['fastDown.speed']), stroke: Number(data['fastDown.stroke']), time: Number(data['fastDown.time']) },
            workingCycle: { speed: Number(data['workingCycle.speed']), stroke: Number(data['workingCycle.stroke']), time: Number(data['workingCycle.time']) },
            holding: { speed: Number(data['holding.speed']), stroke: Number(data['holding.stroke']), time: Number(data['holding.time']) },
            fastUp: { speed: Number(data['fastUp.speed']), stroke: Number(data['fastUp.stroke']), time: Number(data['fastUp.time']) },
          },
        };
        resolve(parameters);
      },
      error: (error) => { reject(error); },
    });
  });
};

const toNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

/**
 * UPDATED: Parser now dynamically finds the start of the data instead of skipping a fixed number of rows.
 */
export const parseGraphDataFromCSV = (file: File): Promise<SimulationDataPoint[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      // Papaparse will automatically detect the delimiter (comma or semicolon)
      complete: (results: { data: string[][] }) => {
        if (!results.data || results.data.length === 0) {
          return reject(new Error("The file is empty or could not be parsed."));
        }

        // Dynamically find the first row that starts with a valid number.
        // This robustly skips any number of header or metadata lines.
        const dataStartIndex = results.data.findIndex(row => row && row.length > 0 && !isNaN(parseFloat(row[0])));

        if (dataStartIndex === -1) {
          return reject(new Error("Could not find any valid numerical data rows in the file."));
        }

        // Slice from the detected start of the data to the end of the file.
        const dataRows = results.data.slice(dataStartIndex);
        
        const graphData = dataRows.map((row: string[]) => ({
          time: toNumber(row[0]),
          stroke: toNumber(row[1]),
          velocity: toNumber(row[2]),
          pressure_rod: toNumber(row[3]),
          pressure_cap: toNumber(row[4]),
        }));

        const finalGraphData = graphData.map(p => {
          // These are typical values for simulation; in a real scenario, these would come from known system parameters.
          const C_BORE_DIAMETER = 75 / 1000; // 75mm in meters
          const C_ROD_DIAMETER = 45 / 1000; // 45mm in meters
          const PUMP_EFFICIENCY = 0.9;

          const areaCap = (Math.PI * C_BORE_DIAMETER**2) / 4;
          const areaRod = (Math.PI * C_ROD_DIAMETER**2) / 4;
          const areaAnnular = areaCap - areaRod;
          
          const isExtending = p.velocity >= 0; // Consider 0 velocity as part of extension/hold phase
          const effectiveArea = isExtending ? areaCap : areaAnnular;
          const effectivePressure = isExtending ? p.pressure_cap : p.pressure_rod;

          // Flow Rate (L/min) = Area (m^2) * Velocity (m/s) * 60,000
          const flow = effectiveArea * Math.abs(p.velocity) * 60000;

          // Actuator Power (kW) = Force (N) * Velocity (m/s) / 1000
          const force = effectivePressure * 100000 * effectiveArea;
          const actuatorPower = (force * Math.abs(p.velocity)) / 1000;
          
          // Pump Input Power (kW) = Pressure (bar) * Flow (L/min) / 600
          const pumpInputPower = (effectivePressure * flow) / 600;

          const motorPower = pumpInputPower > 0 ? pumpInputPower / PUMP_EFFICIENCY : 0;

          return {
            ...p,
            flow,
            actuatorPower,
            motorPower,
            phase: 'Uploaded Data',
            pumpInputPower,
            actualMotorInputPower: motorPower,
            actuatorOutputPower: actuatorPower,
            idealMotorInputPower: pumpInputPower,
          };
        });

        resolve(finalGraphData);
      },
      error: (error: any) => {
        reject(error);
      },
    });
  });
};
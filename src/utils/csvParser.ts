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
 * UPDATED: This parser is now specifically tailored to the format of 'Copy of circuit_1_data_sheet(2).csv'.
 */
export const parseGraphDataFromCSV = (file: File): Promise<SimulationDataPoint[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      // This file uses commas, but we will let Papaparse guess for flexibility
      delimitersToGuess: [',', ';', '\t'],
      complete: (results: { data: string[][] }) => {
        if (!results.data || results.data.length < 5) {
          return reject(new Error("The file appears to be missing the required header and data rows."));
        }

        // The specific format of this file means the data starts at the 5th row (index 4).
        // We slice the array to remove the metadata/header lines.
        const dataRows = results.data.slice(4);

        if (dataRows.length === 0) {
          return reject(new Error("No data rows found after the initial metadata."));
        }

        const graphData = dataRows.map((row: string[]) => {
          // Map data by its known column position: t,x,v,p,p
          const dataPoint = {
            time: toNumber(row[0]),          // Column 0 is 't' (Time)
            stroke: toNumber(row[1]),        // Column 1 is 'x' (Displacement)
            velocity: toNumber(row[2]),      // Column 2 is 'v' (Velocity)
            pressure_rod: toNumber(row[3]),  // Column 3 is 'Pressure at rod end'
            pressure_cap: toNumber(row[4]),  // Column 4 is 'Pressure at cap end'
          };
          return dataPoint;
        });

        // Approximate flow and calculate power based on the parsed data
        const finalGraphData = graphData.map(p => {
          const flow = Math.abs(p.velocity) > 0.001 ? 65 : 0;
          const power = (p.pressure_cap * flow) / 600;
          return {
            ...p,
            flow: flow,
            actuatorPower: power > 0 ? power * 0.9 : 0,
            motorPower: power > 0 ? power / 0.9 : 0,
            phase: 'Uploaded Data',
            pumpInputPower: 0,
            actualMotorInputPower: 0,
            actuatorOutputPower: 0,
            idealMotorInputPower: 0,
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
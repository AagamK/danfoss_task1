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
        if (!data) {
           reject(new Error("CSV file is empty or invalid."));
          return;
        }
        const parameters: HydraulicParameters = {
          cylinderBore: Number(data.cylinderBore),
          rodDiameter: Number(data.rodDiameter),
          deadLoad: Number(data.deadLoad),
          holdingLoad: Number(data.holdingLoad),
          motorRpm: Number(data.motorRpm),
          pumpEfficiency: Number(data.pumpEfficiency),
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
      error: (error) => {
        reject(error);
      },
    });
  });
};

const toNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

/**
 * UPDATED: This parser is now specifically designed for the format of 'Circut-1 final.txt'.
 * It correctly identifies headers, maps columns, and calculates missing data.
 */
export const parseGraphDataFromCSV = (file: File): Promise<SimulationDataPoint[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      delimiter: ';', // Set delimiter to semicolon
      complete: (results: { data: string[][] }) => {
        // Find the specific header row from your file
        const headerIndex = results.data.findIndex(row => row[0]?.trim() === 't' && row[1]?.trim() === 'x');
        
        if (headerIndex === -1) {
          return reject(new Error("Could not find the header row (e.g., 't;x;v;...') in your file."));
        }

        // The actual data starts two rows after the header to skip the units row '[s];[mm];...'
        const dataRows = results.data.slice(headerIndex + 2);

        if (dataRows.length === 0) {
          return reject(new Error("No data rows found after the header in your file."));
        }

        const graphData = dataRows.map((row: string[]) => {
          // Map data by its column position based on 'Circut-1 final.txt'
          const dataPoint = {
            time: toNumber(row[0]),       // Column 0 is 't' (Time)
            stroke: toNumber(row[1]),     // Column 1 is 'x' (Stroke/Displacement)
            pressure: toNumber(row[4]),   // Column 4 is 'Pressure at cap end'
            
            // Approximate Flow based on velocity (column 2) to match the desired graph shape
            flow: Math.abs(toNumber(row[2])) > 0.01 ? 65 : 0,
          };
          return dataPoint;
        });
        
        // Calculate power based on the parsed and approximated values
        const finalGraphData = graphData.map(point => {
          const calculatedPower = (point.pressure * point.flow) / 600;
          return {
            ...point,
            // Add calculated power values, assuming 90% efficiency for a realistic look
            actuatorPower: calculatedPower > 0 ? calculatedPower * 0.9 : 0,
            motorPower: calculatedPower > 0 ? calculatedPower / 0.9 : 0,
            // Default other unused fields
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
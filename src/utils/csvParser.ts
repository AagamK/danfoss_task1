import Papa from 'papaparse';
import { HydraulicParameters } from '@/components/HydraulicSimulator';

export const parseParametersFromCSV = (file: File): Promise<HydraulicParameters> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Assuming the CSV has a single row of parameters
        const data = results.data[0] as any;
        
        if (!data) {
          reject(new Error("CSV file is empty or invalid."));
          return;
        }

        // Map CSV columns to the HydraulicParameters structure
        const parameters: HydraulicParameters = {
          cylinderBore: Number(data.cylinderBore),
          rodDiameter: Number(data.rodDiameter),
          deadLoad: Number(data.deadLoad),
          holdingLoad: Number(data.holdingLoad),
          motorRpm: Number(data.motorRpm),
          pumpEfficiency: Number(data.pumpEfficiency),
          systemLosses: Number(data.systemLosses),
          phases: {
            fastDown: { 
              speed: Number(data['fastDown.speed']), 
              stroke: Number(data['fastDown.stroke']), 
              time: Number(data['fastDown.time']) 
            },
            workingCycle: { 
              speed: Number(data['workingCycle.speed']), 
              stroke: Number(data['workingCycle.stroke']), 
              time: Number(data['workingCycle.time']) 
            },
            holding: { 
              speed: Number(data['holding.speed']), 
              stroke: Number(data['holding.stroke']), 
              time: Number(data['holding.time']) 
            },
            fastUp: { 
              speed: Number(data['fastUp.speed']), 
              stroke: Number(data['fastUp.stroke']), 
              time: Number(data['fastUp.time']) 
            },
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
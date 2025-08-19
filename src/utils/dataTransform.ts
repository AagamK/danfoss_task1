import { SimulationDataPoint } from "@/hooks/useHydraulicCalculations";
import { EnhancedSensorData } from "@/types/hydraulicData";

export const transformSimulationData = (simulationData: SimulationDataPoint[]): EnhancedSensorData[] => {
  return simulationData.map((point, index) => ({
    timestamp: new Date(Date.now() + index * 1000).toISOString(),
    time: point.time,
    pressure: point.pressure,
    flowRate: point.flow,
    pumpInputPower: point.pumpInputPower,
    actualMotorInputPower: point.actualMotorInputPower,
    actuatorOutputPower: point.actuatorOutputPower,
    idealMotorInputPower: point.idealMotorInputPower,
    stroke: point.stroke,
    temperature: 25 + Math.random() * 10, // Simulated temperature
    vibration: 0.001 + Math.random() * 0.01, // Simulated vibration
    status: point.phase
  }));
};

export const generateSampleData = (): EnhancedSensorData[] => {
  const data: EnhancedSensorData[] = [];
  const phases = ['fastDown', 'workingCycle', 'holding', 'fastUp'];
  const phaseData = {
    fastDown: { pressure: 150, flow: 120, pumpPower: 30, motorPower: 35, actuatorPower: 25, idealPower: 30 },
    workingCycle: { pressure: 200, flow: 80, pumpPower: 26.7, motorPower: 30, actuatorPower: 22, idealPower: 26.7 },
    holding: { pressure: 200, flow: 0, pumpPower: 0, motorPower: 2, actuatorPower: 0, idealPower: 0 },
    fastUp: { pressure: 180, flow: 100, pumpPower: 30, motorPower: 35, actuatorPower: 28, idealPower: 30 }
  };

  let currentTime = 0;
  phases.forEach(phase => {
    const phaseInfo = phaseData[phase as keyof typeof phaseData];
    const duration = phase === 'fastDown' ? 5 : phase === 'workingCycle' ? 10 : phase === 'holding' ? 3 : 7;
    
    for (let i = 0; i <= duration; i++) {
      data.push({
        timestamp: new Date(Date.now() + currentTime * 1000).toISOString(),
        time: currentTime,
        pressure: phaseInfo.pressure + (Math.random() - 0.5) * 10,
        flowRate: phaseInfo.flow + (Math.random() - 0.5) * 5,
        pumpInputPower: phaseInfo.pumpPower + (Math.random() - 0.5) * 2,
        actualMotorInputPower: phaseInfo.motorPower + (Math.random() - 0.5) * 2,
        actuatorOutputPower: phaseInfo.actuatorPower + (Math.random() - 0.5) * 2,
        idealMotorInputPower: phaseInfo.idealPower + (Math.random() - 0.5) * 2,
        stroke: Math.random() * 100,
        temperature: 25 + Math.random() * 10,
        vibration: 0.001 + Math.random() * 0.01,
        status: phase
      });
      currentTime += 1;
    }
  });

  return data;
};

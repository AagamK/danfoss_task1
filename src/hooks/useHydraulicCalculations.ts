import { useState, useCallback } from "react";
import { HydraulicParameters } from "@/components/HydraulicSimulator";
import { HydraulicResults } from "@/components/ResultsDashboard";
import { EnhancedSensorData } from "@/types/hydraulicData";

export interface SimulationDataPoint {
  time: number;
  flow: number;
  pressure: number;
  stroke: number;
  motorPower: number;
  actuatorPower: number;
  phase: string;
  pumpInputPower: number;
  actualMotorInputPower: number;
  actuatorOutputPower: number;
  idealMotorInputPower: number;
}

export const useHydraulicCalculations = (parameters: HydraulicParameters) => {
  const [results, setResults] = useState<HydraulicResults | null>(null);
  const [simulationData, setSimulationData] = useState<SimulationDataPoint[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const runSimulation = useCallback(async () => {
    setIsCalculating(true);
    
    // Simulate calculation delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Calculate cylinder areas (m²) - exact Danfoss formulas
      const cylinderAreaBore = Math.PI * Math.pow(parameters.cylinderBore / 1000, 2) / 4; // m²
      const rodArea = Math.PI * Math.pow(parameters.rodDiameter / 1000, 2) / 4; // m²
      const annularArea = cylinderAreaBore - rodArea; // m²

      // Convert loads to force (N)
      const deadLoadN = parameters.deadLoad * 1000 * 9.81; // N
      const holdingLoadN = parameters.holdingLoad * 1000 * 9.81; // N

      // Calculate required pressures (bar) - exact Danfoss formulas
      const headLoss = parameters.systemLosses || 10; // Default 10 bar head loss
      
      // Fast down pressure: (Load / Bore Area) + Head Loss
      const pressureFastDownBase = (deadLoadN / (cylinderAreaBore * 100000)); // bar
      const pressureFastDown = pressureFastDownBase + headLoss; // bar

      // Working pressure: (Load / Bore Area) + Head Loss
      const pressureWorkingCycleBase = (holdingLoadN / (cylinderAreaBore * 100000)); // bar
      const pressureWorkingCycle = pressureWorkingCycleBase + headLoss; // bar

      // Holding pressure: Same as working pressure
      const pressureHolding = pressureWorkingCycle; // bar

      // Fast up pressure: (Load / Annular Area) + Head Loss
      const pressureFastUpBase = (deadLoadN / (annularArea * 100000)); // bar
      const pressureFastUp = pressureFastUpBase + headLoss; // bar

      // Calculate flow requirements for each phase (L/min) - exact Danfoss formulas
      const velocityFastDown = parameters.phases.fastDown.speed / 1000; // m/s
      const velocityWorking = parameters.phases.workingCycle.speed / 1000; // m/s
      const velocityFastUp = parameters.phases.fastUp.speed / 1000; // m/s

      // Flow rate calculations based on velocity and area
      const flowFastDown = (cylinderAreaBore * velocityFastDown * 60 * 1000); // L/min
      const flowWorkingCycle = (cylinderAreaBore * velocityWorking * 60 * 1000); // L/min
      const flowHolding = 0; // L/min
      const flowFastUp = (annularArea * velocityFastUp * 60 * 1000); // L/min

      // Determine maximum flow rate for pump sizing
      const maxFlow = Math.max(flowFastDown, flowWorkingCycle, flowFastUp);
      const pumpFlowRate = maxFlow; // L/min

      // Calculate pump displacement (cc/rev) - exact Danfoss formula
      const pumpDisplacement = ((pumpFlowRate * 1000) / parameters.motorRpm)+1; // cc/rev

      // Calculate motor power requirements for each phase - exact Danfoss formulas
      const powerFastDownPump = (pressureFastDown * flowFastDown) / 600; // kW (pump)
      const powerFastDownMotor = powerFastDownPump / parameters.pumpEfficiency; // kW (motor)

      const powerWorkingCyclePump = (pressureWorkingCycle * flowWorkingCycle) / 600; // kW (pump)
      const powerWorkingCycleMotor = powerWorkingCyclePump / parameters.pumpEfficiency; // kW (motor)

      const powerHoldingPump = 0; // kW (no flow during holding)
      const powerHoldingMotor = 0; // kW

      const powerFastUpPump = (pressureFastUp * flowFastUp) / 600; // kW (pump)
      const powerFastUpMotor = powerFastUpPump / parameters.pumpEfficiency; // kW (motor)

      const maxMotorPower = Math.max(powerFastDownMotor, powerWorkingCycleMotor, powerFastUpMotor);

      // Calculate energy consumption per phase
      const energyFastDown = powerFastDownMotor * (parameters.phases.fastDown.time / 3600); // kWh
      const energyWorkingCycle = powerWorkingCycleMotor * (parameters.phases.workingCycle.time / 3600); // kWh
      const energyHolding = powerHoldingMotor * (parameters.phases.holding.time / 3600); // kWh
      const energyFastUp = powerFastUpMotor * (parameters.phases.fastUp.time / 3600); // kWh

      const totalEnergy = energyFastDown + energyWorkingCycle + energyHolding + energyFastUp;

      // Calculate actuator output power (Force × Velocity)
      const actuatorVelocityFastDown = parameters.phases.fastDown.speed / 1000; // m/s
      const actuatorVelocityWorking = parameters.phases.workingCycle.speed / 1000; // m/s
      const actuatorVelocityFastUp = parameters.phases.fastUp.speed / 1000; // m/s
      
      const actuatorPowerFastDown = (deadLoadN * actuatorVelocityFastDown) / 1000; // kW
      const actuatorPowerWorking = (holdingLoadN * actuatorVelocityWorking) / 1000; // kW
      const actuatorPowerFastUp = (deadLoadN * actuatorVelocityFastUp) / 1000; // kW

      // Calculate ideal motor input power (100% efficiency)
      const idealMotorPowerFastDown = powerFastDownPump; // kW (100% efficiency)
      const idealMotorPowerWorking = powerWorkingCyclePump; // kW (100% efficiency)
      const idealMotorPowerFastUp = powerFastUpPump; // kW (100% efficiency)

      // Set relief valve pressure (20% above maximum working pressure) - Danfoss standard
      const maxWorkingPressure = Math.max(pressureFastDown, pressureWorkingCycle, pressureHolding, pressureFastUp);
      const reliefValvePressure = maxWorkingPressure * 1.2;

      // Generate simulation data for all phases
      const simulationData: SimulationDataPoint[] = [];
      const phases = [
        { name: 'fastDown', time: parameters.phases.fastDown.time, pressure: pressureFastDown, flow: flowFastDown, motorPower: powerFastDownMotor, actuatorPower: actuatorPowerFastDown, idealPower: idealMotorPowerFastDown },
        { name: 'workingCycle', time: parameters.phases.workingCycle.time, pressure: pressureWorkingCycle, flow: flowWorkingCycle, motorPower: powerWorkingCycleMotor, actuatorPower: actuatorPowerWorking, idealPower: idealMotorPowerWorking },
        { name: 'holding', time: parameters.phases.holding.time, pressure: pressureHolding, flow: flowHolding, motorPower: powerHoldingMotor, actuatorPower: 0, idealPower: 0 },
        { name: 'fastUp', time: parameters.phases.fastUp.time, pressure: pressureFastUp, flow: flowFastUp, motorPower: powerFastUpMotor, actuatorPower: actuatorPowerFastUp, idealPower: idealMotorPowerFastUp }
      ];

      let currentTime = 0;
let currentStroke = 0;

phases.forEach(phase => {
  // Get the parameters for the current phase (e.g., speed, total stroke for the phase)
  const phaseParams = parameters.phases[phase.name as keyof typeof parameters.phases];
  const timeStep = phase.time / 10; // Create 10 data points per phase

  for (let i = 0; i <= 10; i++) {
    const timeInPhase = i * timeStep;
    const time = currentTime + timeInPhase;
    let strokeAtTime = currentStroke;

    // Calculate stroke based on speed (mm/s) and time elapsed in this phase
    if (phase.name === 'fastUp') {
      // Stroke decreases (retracts) during the 'fastUp' phase
      strokeAtTime -= phaseParams.speed * timeInPhase;
    } else {
      // Stroke increases (extends) during all other phases
      strokeAtTime += phaseParams.speed * timeInPhase;
    }

    simulationData.push({
      time,
      flow: phase.flow,
      pressure: phase.pressure,
      stroke: Math.max(0, strokeAtTime), // Use the calculated value and prevent it from going below 0
      motorPower: phase.motorPower,
      actuatorPower: phase.actuatorPower,
      phase: phase.name,
      pumpInputPower: phase.pressure * phase.flow / 600,
      actualMotorInputPower: phase.motorPower,
      actuatorOutputPower: phase.actuatorPower,
      idealMotorInputPower: phase.idealPower
    });
  }

  // Update the cumulative stroke for the start of the next phase
  if (phase.name === 'fastUp') {
    currentStroke -= phaseParams.stroke;
  } else {
    currentStroke += phaseParams.stroke;
  }
  currentStroke = Math.max(0, currentStroke); // Ensure stroke doesn't become negative
  currentTime += phase.time;
});

      const calculatedResults: HydraulicResults = {
        pumpFlowRate,
        pumpDisplacement,
        cylinderArea: {
          bore: cylinderAreaBore * 10000, // Convert to cm² for display
          rod: rodArea * 10000, // Convert to cm² for display
          annular: annularArea * 10000 // Convert to cm² for display
        },
        requiredPressure: {
          fastDown: pressureFastDown,
          workingCycle: pressureWorkingCycle,
          holding: pressureHolding,
          fastUp: pressureFastUp
        },
        motorPower: maxMotorPower,
        maxReliefValve: reliefValvePressure,
        energyConsumption: {
          total: totalEnergy,
          perPhase: {
            fastDown: energyFastDown,
            workingCycle: energyWorkingCycle,
            holding: energyHolding,
            fastUp: energyFastUp
          }
        }
      };

      setResults(calculatedResults);
      setSimulationData(simulationData);
    } catch (error) {
      console.error("Calculation error:", error);
    } finally {
      setIsCalculating(false);
    }
  }, [parameters]);

  return {
    results,
    simulationData :simulationData,
    isCalculating,
    runSimulation
  };
};

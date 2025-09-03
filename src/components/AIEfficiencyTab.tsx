import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Lightbulb, Zap } from "lucide-react";
import type { SimulationDataPoint } from "@/hooks/useHydraulicCalculations";
import type { HydraulicResults } from "./ResultsDashboard";

interface AIEfficiencyTabProps {
  simulationData: SimulationDataPoint[];
  results: HydraulicResults | null;
}

export const AIEfficiencyTab = ({ simulationData, results }: AIEfficiencyTabProps) => {
  // Use simulationData as the primary check. It will exist for both simulations and file plots.
  if (!simulationData || simulationData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Run a simulation or plot a file to analyze its energy efficiency.
        </CardContent>
      </Card>
    );
  }

  // Check if the data is from a simulation (results object exists) or a file (results is null)
  const isSimulatedData = results !== null;

  const efficiencyData = simulationData.map(d => ({
    ...d,
    efficiency: d.motorPower > 0 ? (d.actuatorPower / d.motorPower) * 100 : 0,
  }));

  const totalActuatorEnergy = simulationData.reduce((acc, point, index) => {
    if (index === 0) return 0;
    const timeStep = point.time - simulationData[index - 1].time;
    const energy = point.actuatorPower * (timeStep / 3600);
    return acc + energy;
  }, 0);
  
  // If data is from a simulation, use the precise total energy.
  // Otherwise, calculate it from the plotted data.
  const totalMotorEnergy = isSimulatedData
    ? results.energyConsumption.total
    : simulationData.reduce((acc, point, index) => {
        if (index === 0) return 0;
        const timeStep = point.time - simulationData[index - 1].time;
        const energy = point.motorPower * (timeStep / 3600);
        return acc + energy;
      }, 0);

  const overallEfficiency = totalMotorEnergy > 0 ? (totalActuatorEnergy / totalMotorEnergy) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="text-yellow-500" /> Overall Cycle Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{overallEfficiency.toFixed(1)}%</div>
          <p className="text-muted-foreground mt-2">
            This is the ratio of useful work done by the actuator to the total energy consumed by the motor.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Efficiency vs. Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={efficiencyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" unit="s" />
              <YAxis unit="%" domain={[0, 100]} label={{ value: 'Efficiency', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Efficiency']} />
              <Line type="monotone" dataKey="efficiency" name="Instantaneous Efficiency" stroke="#8884d8" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="text-primary" />Suggestions for Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show different suggestions based on whether the data is from a simulation or a file */}
          {isSimulatedData ? (
            <>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold">Observation: Efficiency is lowest during the 'Holding' phase.</p>
                <p className="text-sm text-muted-foreground">This is because the motor consumes idle power while no work is being done.</p>
                <p className="text-sm mt-2"><strong>Suggestion:</strong> Consider using a variable displacement pump to reduce power loss during holding periods.</p>
              </div>
               <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold">Observation: A significant efficiency gap exists during high-speed movements.</p>
                <p className="text-sm text-muted-foreground">This indicates energy loss, likely as heat, due to fluid friction or mechanical friction.</p>
                <p className="text-sm mt-2"><strong>Suggestion:</strong> Check for undersized valves or piping that could be causing pressure drops.</p>
              </div>
            </>
          ) : (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-semibold">Observation: The overall efficiency of the provided data is {overallEfficiency.toFixed(1)}%.</p>
              {overallEfficiency < 75 ? (
                <p className="text-sm mt-2"><strong>Suggestion:</strong> An efficiency below 75% suggests potential for improvement. Analyze the efficiency graph to identify periods of low performance and investigate their causes, such as hydraulic leaks, high mechanical friction, or pressure drops from undersized components.</p>
              ) : (
                <p className="text-sm mt-2"><strong>Suggestion:</strong> This is a good efficiency rating. To further optimize, focus on the brief periods of lowest efficiency in the graph to identify minor throttling losses or friction.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
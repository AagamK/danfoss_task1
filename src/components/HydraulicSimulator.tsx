import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator,ArrowLeft, BarChart3, Download, Settings } from "lucide-react";
import { ParameterForm } from "./ParameterForm";
import { ResultsDashboard } from "./ResultsDashboard";
import { SimulationGraphs } from "./SimulationGraphs";
import { useHydraulicCalculations } from "@/hooks/useHydraulicCalculations";
import { useNavigate } from "react-router-dom";

export interface HydraulicParameters {
  cylinderBore: number;
  rodDiameter: number;
  deadLoad: number;
  holdingLoad: number;
  motorRpm: number;
  pumpEfficiency: number;
  systemLosses: number;
  phases: {
    fastDown: { speed: number; stroke: number; time: number };
    workingCycle: { speed: number; stroke: number; time: number };
    holding: { speed: number; stroke: number; time: number };
    fastUp: { speed: number; stroke: number; time: number };
  };
}

const defaultParameters: HydraulicParameters = {
  cylinderBore: 75,
  rodDiameter: 45,
  deadLoad: 2.5,
  holdingLoad: 8,
  motorRpm: 1800,
  pumpEfficiency: 0.9,
  systemLosses: 10,
  phases: {
    fastDown: { speed: 200, stroke: 200, time: 1 },
    workingCycle: { speed: 10, stroke: 50, time: 5 },
    holding: { speed: 0, stroke: 0, time: 2 },
    fastUp: { speed: 200, stroke: 250, time: 1.25 }
  }
};

export const HydraulicSimulator = () => {
  const navigate = useNavigate();
  const [parameters, setParameters] = useState<HydraulicParameters>(defaultParameters);
  const [activeTab, setActiveTab] = useState("parameters");
  
  const { results, simulationData, isCalculating, runSimulation } = useHydraulicCalculations(parameters);

  const handleRunSimulation = () => {
    runSimulation();
    setActiveTab("results");
  };

  const handleExportData = () => {
    if (!simulationData.length) return;
    
    const csvContent = [
      ["Time (s)", "Flow (L/min)", "Pressure (bar)", "Stroke (mm)", "Motor Power (kW)", "Actuator Power (kW)"],
      ...simulationData.map(row => [
        row.time.toFixed(3),
        row.flow.toFixed(2),
        row.pressure.toFixed(1),
        row.stroke.toFixed(1),
        row.motorPower.toFixed(2),
        row.actuatorPower.toFixed(2)
      ])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hydraulic_simulation_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
                      <Button variant="outline" onClick={() => navigate('/')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Home
                      </Button>
                    </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Hydraulic Press Simulator</h1>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleRunSimulation}
              disabled={isCalculating}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent/90"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {isCalculating ? "Calculating..." : "Run Simulation"}
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={handleExportData}
              disabled={!simulationData.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="parameters" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Parameters
            </TabsTrigger>
            <TabsTrigger value="results">
              <Calculator className="h-4 w-4 mr-2" />
              Results
            </TabsTrigger>
            <TabsTrigger value="graphs">
              <BarChart3 className="h-4 w-4 mr-2" />
              Graphs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parameters" className="mt-6">
            <ParameterForm 
              parameters={parameters}
              onParametersChange={setParameters}
            />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <ResultsDashboard 
              results={results}
              isCalculating={isCalculating}
            />
          </TabsContent>

          <TabsContent value="graphs" className="mt-6">
            <SimulationGraphs 
              data={simulationData}
              isLoading={isCalculating}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
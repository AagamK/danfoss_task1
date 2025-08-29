import { useState, ChangeEvent, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, ArrowLeft, BarChart3, Download, Settings, Brain, Activity } from "lucide-react";
import { ParameterForm } from "./ParameterForm";
import { ResultsDashboard } from "./ResultsDashboard";
import { SimulationGraphs } from "./SimulationGraphs";
import { useHydraulicCalculations, SimulationDataPoint } from "@/hooks/useHydraulicCalculations";
import { useNavigate } from "react-router-dom";
import { parseGraphDataFromCSV } from '@/utils/csvParser';
import { toast } from "@/components/ui/sonner";
import { AIEfficiencyTab } from "./AIEfficiencyTab";
import { DetailedSensorComparison } from "./DetailedSensorComparison"; // Import the new detailed comparison component

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
  const [file, setFile] = useState<File | null>(null);
  const [isPlotting, setIsPlotting] = useState(false);
  const { results, setResults, simulationData, setSimulationData, isCalculating, runSimulation, error } = useHydraulicCalculations(parameters);
  
  const [sensorOneFile, setSensorOneFile] = useState<File | null>(null);
  const [sensorTwoFile, setSensorTwoFile] = useState<File | null>(null);
  const [sensorOneData, setSensorOneData] = useState<SimulationDataPoint[]>([]);
  const [sensorTwoData, setSensorTwoData] = useState<SimulationDataPoint[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error("Simulation Failed", {
        description: error,
      });
    }
  }, [error]);

  const handleRunSimulation = () => {
    setSimulationData([]); 
    runSimulation();
    setActiveTab("results");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handlePlotFromFile = async () => {
    if (!file) return;
    setIsPlotting(true);
    try {
      const parsedData = await parseGraphDataFromCSV(file);
      setSimulationData(parsedData);
      setResults(null); 
      setActiveTab("graphs");
      toast.success("File Plotted Successfully", {
        description: `${parsedData.length} data points have been loaded from your file.`,
      });
    } catch (err) {
      console.error("Failed to parse or plot file:", err);
      toast.error("File Plotting Error", {
        description: err instanceof Error ? err.message : "Could not read the file.",
      });
    } finally {
      setIsPlotting(false);
    }
  };

  const handleExportData = () => {
    if (!simulationData.length) return;
    const csvContent = [
      ["Time (s)", "Flow (L/min)", "Pressure (bar)", "Stroke (mm)", "Motor Power (kW)", "Actuator Power (kW)"],
      ...simulationData.map(row => [
        row.time.toFixed(3),
        row.flow.toFixed(2),
        row.pressure_cap.toFixed(1),
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

  const handleSensorFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    sensorNumber: 1 | 2
  ) => {
    if (event.target.files) {
      if (sensorNumber === 1) {
        setSensorOneFile(event.target.files[0]);
      } else {
        setSensorTwoFile(event.target.files[0]);
      }
    }
  };

  const handleCompareSensors = async () => {
    if (!sensorOneFile || !sensorTwoFile) return;
    setIsComparing(true);
    try {
      const data1 = await parseGraphDataFromCSV(sensorOneFile);
      const data2 = await parseGraphDataFromCSV(sensorTwoFile);
      setSensorOneData(data1);
      setSensorTwoData(data2);
      setActiveTab("sensorComparison"); 
      toast.success("Sensor Comparison Ready", {
        description: "Both sensor data files have been plotted successfully.",
      });
    } catch (err) {
      console.error("Failed to parse or compare files:", err);
      toast.error("File Comparison Error", {
        description: err instanceof Error ? err.message : "Could not process the files.",
      });
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-6 max-w-7xl">
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
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
                <Button
                  onClick={handleRunSimulation}
                  disabled={isCalculating || isPlotting || isComparing}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent/90"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  {isCalculating ? "Calculating..." : "Run Simulation"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleExportData}
                  disabled={!simulationData.length || isCalculating || isPlotting || isComparing}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Results
                </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                type="file" 
                accept=".csv, .txt" 
                onChange={handleFileChange} 
                className="max-w-xs"
              />
              <Button 
                onClick={handlePlotFromFile} 
                disabled={!file || isCalculating || isPlotting || isComparing}
              >
                {isPlotting ? "Plotting..." : "Plot Data from File"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 border rounded-lg bg-card shadow-sm">
          <h3 className="font-semibold mb-2 text-foreground">Sensor Data Comparison</h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <label htmlFor="sensor1" className="text-sm font-medium text-muted-foreground">Circuit 1 Data (.csv, .txt)</label>
              <Input 
                id="sensor1"
                type="file" 
                accept=".csv, .txt" 
                onChange={(e) => handleSensorFileChange(e, 1)} 
                className="mt-1"
              />
            </div>
            <div className="flex-1 w-full">
              <label htmlFor="sensor2" className="text-sm font-medium text-muted-foreground">Circuit 2 Data (.csv, .txt)</label>
              <Input 
                id="sensor2"
                type="file" 
                accept=".csv, .txt" 
                onChange={(e) => handleSensorFileChange(e, 2)} 
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleCompareSensors} 
              disabled={!sensorOneFile || !sensorTwoFile || isComparing}
              className="w-full sm:w-auto mt-4 sm:mt-0"
            >
              {isComparing ? "Comparing..." : "Compare Circuit Data"}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-5">
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
            <TabsTrigger value="aiEfficiency">
               <Brain className="h-4 w-4 mr-2" />
              AI Efficiency
            </TabsTrigger>
            <TabsTrigger value="sensorComparison" disabled={!sensorOneData.length || !sensorTwoData.length}>
              <Activity className="h-4 w-4 mr-2" />
              Circuit Comparison
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
              isLoading={isCalculating || isPlotting}
            />
          </TabsContent>
          <TabsContent value="aiEfficiency" className="mt-6">
            <AIEfficiencyTab 
              simulationData={simulationData}
              results={results}
            />
          </TabsContent>
          <TabsContent value="sensorComparison" className="mt-6">
            <DetailedSensorComparison 
              sensorOneData={sensorOneData}
              sensorTwoData={sensorTwoData}
              isLoading={isComparing}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
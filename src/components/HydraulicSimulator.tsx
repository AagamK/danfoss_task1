import { useState, ChangeEvent, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, ArrowLeft, BarChart3, Download, Settings, Brain, Activity, FileText } from "lucide-react";
import { ParameterForm } from "./ParameterForm";
import { ResultsDashboard } from "./ResultsDashboard";
import { SimulationGraphs } from "./SimulationGraphs";
import { useHydraulicCalculations, SimulationDataPoint } from "@/hooks/useHydraulicCalculations";
import { useNavigate } from "react-router-dom";
import { parseGraphDataFromCSV } from '@/utils/csvParser';
import { toast } from "@/components/ui/sonner";
import { AIEfficiencyTab } from "./AIEfficiencyTab";
import { DetailedSensorComparison } from "./DetailedSensorComparison";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Import the new detailed comparison component

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
  const [isExportingPDF, setIsExportingPDF] = useState(false);

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

  const handleExportPDF = async () => {
    if (!results || !simulationData.length) {
      toast.error("No Data to Export", {
        description: "Please run a simulation first to generate data for the PDF report.",
      });
      return;
    }

    setIsExportingPDF(true);
    toast.info("Generating PDF report...", {
      description: "This process may take a few moments.",
    });

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      let yPos = 20;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;

      const checkNewPage = (currentY: number, requiredHeight: number) => {
        if (currentY + requiredHeight > pageHeight - margin) {
          doc.addPage();
          return margin;
        }
        return currentY;
      };
      
      const addFormulaBlock = (title: string, formulaLines: string[], calcSteps: string[], currentY: number) => {
        let y = checkNewPage(currentY, 30); // Approx height for a block
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, y);
        y += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        formulaLines.forEach(line => {
            doc.text(line, margin + 5, y);
            y += 5;
        });
        y += 2;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        calcSteps.forEach(step => {
            y = checkNewPage(y, 6);
            doc.text(step, margin + 5, y);
            y += 6;
        });
        return y + 5;
      };

      // --- PDF Header ---
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Hydraulic Press Simulation Report', margin, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPos);
      yPos += 15;

      // --- Input Parameters ---
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Input Parameters', margin, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const params = [
        { label: "Cylinder Bore", value: `${parameters.cylinderBore} mm` },
        { label: "Rod Diameter", value: `${parameters.rodDiameter} mm` },
        { label: "Dead Load", value: `${parameters.deadLoad} Ton` },
        { label: "Holding Load", value: `${parameters.holdingLoad} Ton` },
        { label: "Motor Speed", value: `${parameters.motorRpm} RPM` },
        { label: "Pump Efficiency", value: `${parameters.pumpEfficiency * 100}%` },
        { label: "System Losses", value: `${parameters.systemLosses} bar` },
      ];
      params.forEach(p => {
        yPos = checkNewPage(yPos, 7);
        doc.text(`${p.label}:`, margin, yPos);
        doc.text(p.value, 80, yPos);
        yPos += 7;
      });
      yPos += 5;

      // --- ALL CALCULATIONS ---
      yPos = checkNewPage(yPos, 15);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Detailed Calculations', margin, yPos);
      yPos += 8;

      // ... Add detailed results sections ...
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Metrics', margin, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const resultMetrics = [
          { label: "Pump Flow Rate", value: `${results.pumpFlowRate.toFixed(2)} L/min` },
          { label: "Pump Displacement", value: `${results.pumpDisplacement.toFixed(1)} cc/rev` },
          { label: "Required Motor Power", value: `${results.motorPower.toFixed(2)} kW` },
          { label: "Max Relief Valve Setting", value: `${results.maxReliefValve.toFixed(0)} bar` },
          { label: "Total Energy Consumption", value: `${results.energyConsumption.total.toFixed(3)} kWh/cycle` },
      ];
      resultMetrics.forEach(r => {
        yPos = checkNewPage(yPos, 7);
        doc.text(`${r.label}:`, margin, yPos);
        doc.text(r.value, 80, yPos);
        yPos += 7;
      });
      yPos += 5;

      // --- FORMULAS & CALCULATION STEPS ---
      doc.addPage();
      yPos = margin;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Formulas & Example Calculations', margin, yPos);
      yPos += 10;
      
      // 1. Cylinder Area
      yPos = addFormulaBlock('Cylinder Area',
        ['Area = (π * Diameter²) / 4'],
        [
          `Bore Area = (π * ${parameters.cylinderBore}² mm²) / 4 = ${results.cylinderArea.bore.toFixed(1)} cm²`,
          `Rod Area = (π * ${parameters.rodDiameter}² mm²) / 4 = ${results.cylinderArea.rod.toFixed(1)} cm²`,
          `Annular Area = ${results.cylinderArea.bore.toFixed(1)} - ${results.cylinderArea.rod.toFixed(1)} = ${results.cylinderArea.annular.toFixed(1)} cm²`,
        ], yPos);

      // 2. Pressure Calculation
      yPos = addFormulaBlock('Pressure (Working Cycle Example)',
        ['Pressure (bar) = (Load (N) / (Area (m²) * 100000)) + System Losses (bar)'],
        [
            `Load (N) = ${parameters.holdingLoad} Ton * 1000 * 9.81 = ${(parameters.holdingLoad * 1000 * 9.81).toFixed(0)} N`,
            `Pressure = (${(parameters.holdingLoad * 1000 * 9.81).toFixed(0)} N / (${(results.cylinderArea.bore / 10000).toFixed(5)} m² * 100000)) + ${parameters.systemLosses} bar`,
            `Result = ${results.requiredPressure.workingCycle.toFixed(1)} bar`
        ], yPos);

      // 3. Flow Rate Calculation
      yPos = addFormulaBlock('Flow Rate (Fast Down Example)',
        ['Flow (L/min) = Area (m²) * Speed (m/s) * 60000'],
        [
            `Speed = ${parameters.phases.fastDown.speed} mm/s = ${(parameters.phases.fastDown.speed / 1000).toFixed(3)} m/s`,
            `Flow = ${(results.cylinderArea.bore / 10000).toFixed(5)} m² * ${(parameters.phases.fastDown.speed / 1000).toFixed(3)} m/s * 60000`,
            `Result = ${results.pumpFlowRate.toFixed(2)} L/min (based on max flow across all phases)`
        ], yPos);

      // 4. Motor Power Calculation
      yPos = addFormulaBlock('Motor Power (Working Cycle Example)',
        ['Pump Power (kW) = (Pressure (bar) * Flow (L/min)) / 600', 'Motor Power (kW) = Pump Power / Pump Efficiency'],
        [
            `Flow (Working Cycle) = ${(results.cylinderArea.bore / 10000 * (parameters.phases.workingCycle.speed / 1000) * 60000).toFixed(2)} L/min`,
            `Pump Power = (${results.requiredPressure.workingCycle.toFixed(1)} bar * ${(results.cylinderArea.bore / 10000 * (parameters.phases.workingCycle.speed / 1000) * 60000).toFixed(2)} L/min) / 600`,
            `Motor Power = ${((results.requiredPressure.workingCycle * (results.cylinderArea.bore / 10000 * (parameters.phases.workingCycle.speed / 1000) * 60000)) / 600).toFixed(2)} kW / ${parameters.pumpEfficiency}`,
            `Result = ${(((results.requiredPressure.workingCycle * (results.cylinderArea.bore / 10000 * (parameters.phases.workingCycle.speed / 1000) * 60000)) / 600) / parameters.pumpEfficiency).toFixed(2)} kW`
        ], yPos);

      doc.save('hydraulic-simulation-report.pdf');
      toast.success("PDF Report with Formulas Generated Successfully");

    } catch (e) {
      console.error("Failed to export PDF:", e);
      toast.error("PDF Export Failed", {
        description: "An error occurred while generating the PDF.",
      });
    } finally {
      setIsExportingPDF(false);
    }
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
                  disabled={isCalculating || isPlotting || isComparing || isExportingPDF}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent/90"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  {isCalculating ? "Calculating..." : "Run Simulation"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleExportData}
                  disabled={!simulationData.length || isCalculating || isPlotting || isComparing || isExportingPDF}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Results (CSV)
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleExportPDF}
                  disabled={!simulationData.length || isCalculating || isPlotting || isComparing || isExportingPDF}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isExportingPDF ? "Exporting..." : "Export Report (PDF)"}
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
                disabled={!file || isCalculating || isPlotting || isComparing || isExportingPDF}
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
              Efficiency
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
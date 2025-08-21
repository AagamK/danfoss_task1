import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { SimulationDataPoint } from "@/hooks/useHydraulicCalculations";
import { TrendingUp, Gauge, Zap, Activity } from "lucide-react";

interface SimulationGraphsProps {
  data: SimulationDataPoint[];
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">
          Time: {Number(label).toFixed(2)}s
        </p>
        <p className="text-xs text-muted-foreground mb-2">
          Phase: {data.phase}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {Number(entry.value).toFixed(2)}{" "}
            {getUnit(entry.dataKey)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const getUnit = (dataKey: string) => {
  switch (dataKey) {
    case "flow":
      return "L/min";
    case "pressure":
      return "bar";
    case "stroke":
      return "mm";
    case "motorPower":
    case "actuatorPower":
      return "kW";
    default:
      return "";
  }
};

const getPhaseColor = (phase: string) => {
  switch (phase) {
    case "Fast Down":
      return "#3b82f6"; // primary
    case "Working Cycle":
      return "#f59e0b"; // warning
    case "Holding":
      return "#ef4444"; // destructive
    case "Fast Up":
      return "#10b981"; // success
    default:
      return "#6b7280";
  }
};

export const SimulationGraphs = ({
  data,
  isLoading,
}: SimulationGraphsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-technical">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <Card className="shadow-technical">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No simulation data available</p>
            <p className="text-sm mt-2">
              Run the simulation to generate graphs
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const phaseAnnotations = [];
  let currentPhase = data[0]?.phase;
  let phaseStart = 0;

  for (let i = 1; i < data.length; i++) {
    if (data[i].phase !== currentPhase || i === data.length - 1) {
      phaseAnnotations.push({
        phase: currentPhase,
        startTime: data[phaseStart].time,
        endTime: data[i - 1].time,
        color: getPhaseColor(currentPhase),
      });
      currentPhase = data[i].phase;
      phaseStart = i;
    }
  }

  return (
    // Change: Updated grid to be single-column
    <div className="grid grid-cols-1 gap-6">
      {/* Flow vs Time */}
      <Card className="shadow-technical">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Gauge className="h-5 w-5 text-primary" />
            Flow Rate vs Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Change: Switched from AreaChart to LineChart */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--muted))"
              />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value.toFixed(1)}s`}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="flow"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pressure vs Time */}
      <Card className="shadow-technical">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Activity className="h-5 w-5 text-warning" />
            Pressure vs Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--muted))"
              />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value.toFixed(1)}s`}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="pressure"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "hsl(var(--warning))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Stroke vs Time */}
      <Card className="shadow-technical">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5 text-accent" />
            Stroke Position vs Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--muted))"
              />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value.toFixed(1)}s`}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value.toFixed(0)}mm`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="linear"
                dataKey="stroke"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "hsl(var(--accent))" }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {phaseAnnotations.map((annotation, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: annotation.color }}
                />
                <span className="text-muted-foreground">
                  {annotation.phase}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Power vs Time */}
      <Card className="shadow-technical">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Zap className="h-5 w-5 text-destructive" />
            Power vs Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--muted))"
              />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value.toFixed(1)}s`}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value.toFixed(1)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="motorPower"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                name="Motor Power"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="actuatorPower"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                name="Actuator Power"
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
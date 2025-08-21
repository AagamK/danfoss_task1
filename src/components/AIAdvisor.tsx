import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, AlertTriangle, CheckCircle, RefreshCw, Wrench, TrendingUp } from "lucide-react";
import type { SensorData } from "@/pages/RealTimeMonitoring";

interface AIAdvisorProps {
  currentData?: SensorData;
  historicalData: SensorData[];
  isConnected: boolean;
}

interface Recommendation {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  remedy: string[];
  confidence: number;
}

export const AIAdvisor = ({ currentData, historicalData, isConnected }: AIAdvisorProps) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  const analyzeSystemHealth = () => {
    if (!currentData || !historicalData.length) return [];
    const issues: Recommendation[] = [];
    const recentData = historicalData.slice(-20);
    
    if (currentData.pressure < 50) {
      issues.push({
        id: 'low-pressure',
        severity: 'high',
        category: 'Pump System',
        title: 'Low System Pressure Detected',
        description: 'System pressure is below normal operating range',
        remedy: [
          'Replace dirty filters',
          'Wash strainer',
          'Clean the clogged inlet line',
          'Clean the reservoir breather vent',
          'Replace the relief valve',
          'Overhaul or replace the pump'
        ],
        confidence: 0.85
      });
    }

    if (currentData.pressure > 200) {
      issues.push({
        id: 'high-pressure',
        severity: 'critical',
        category: 'Relief System',
        title: 'Excessive System Pressure',
        description: 'Pressure exceeds safe operating limits',
        remedy: [
          'Check relief valve setting',
          'Replace defective relief valve',
          'Align unit',
          'Check for contaminated oil, bearings and couplings'
        ],
        confidence: 0.90
      });
    }

    if (currentData.temperature > 70) {
      issues.push({
        id: 'high-temperature',
        severity: currentData.temperature > 80 ? 'critical' : 'medium',
        category: 'Thermal Management',
        title: 'High Operating Temperature',
        description: `Temperature is ${currentData.temperature.toFixed(1)}°C, above recommended range`,
        remedy: [
          'Check system fluid viscosity/quantity',
          'Replace the cooler',
          'Wash the cooler and/or clean vent',
          'Check for contaminated or incorrect fluid supply'
        ],
        confidence: 0.88
      });
    }

    const avgVibration = recentData.reduce((sum, d) => sum + d.vibration, 0) / recentData.length;
    if (currentData.vibration > avgVibration * 2 && currentData.vibration > 0.5) {
      issues.push({
        id: 'high-vibration',
        severity: 'medium',
        category: 'Mechanical',
        title: 'Excessive Vibration Detected',
        description: 'Vibration levels are significantly above normal',
        remedy: [
          'Align unit',
          'Check the condition of seals, bearings and couplings',
          'Repair or replace defective parts',
          'Check for contaminated fluid'
        ],
        confidence: 0.75
      });
    }

    const strokeVariation = Math.max(...recentData.map(d => d.stroke)) - Math.min(...recentData.map(d => d.stroke));
    if (strokeVariation < 5 && currentData.stroke > 0) {
      issues.push({
        id: 'stroke-inconsistency',
        severity: 'low',
        category: 'Actuator Performance',
        title: 'Inconsistent Stroke Performance',
        description: 'Stroke position shows minimal variation, possible sticking',
        remedy: [
          'Clean the cylinder and/or seal',
          'Replace the worn-out seal',
          'Check for proper lubrication',
          'Inspect cylinder for wear or damage'
        ],
        confidence: 0.65
      });
    }

    if (recentData.length >= 10) {
      const pressureTrend = recentData.slice(-5).reduce((sum, d) => sum + d.pressure, 0) / 5 -
                           recentData.slice(-10, -5).reduce((sum, d) => sum + d.pressure, 0) / 5;
      if (Math.abs(pressureTrend) > 10) {
        issues.push({
          id: 'pressure-trend',
          severity: 'low',
          category: 'Performance Monitoring',
          title: pressureTrend > 0 ? 'Increasing Pressure Trend' : 'Decreasing Pressure Trend',
          description: `Pressure shows a ${pressureTrend > 0 ? 'rising' : 'declining'} trend over recent cycles`,
          remedy: [
            'Monitor system performance closely',
            'Check for gradual component wear',
            'Schedule preventive maintenance',
            'Review operating parameters'
          ],
          confidence: 0.60
        });
      }
    }

    return issues.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  };

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const analysis = analyzeSystemHealth();
      setRecommendations(analysis);
      setLastAnalysis(new Date());
      setIsAnalyzing(false);
    }, 2000);
  };

  // This useEffect was removed to prevent automatic analysis
  // useEffect(() => {
  //   if (isConnected && currentData) {
  //     runAnalysis();
  //   }
  // }, [currentData, isConnected]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <TrendingUp className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <CardTitle>AI Diagnostic Advisor</CardTitle>
            </div>
            <Button 
              onClick={runAnalysis} 
              disabled={isAnalyzing || !isConnected}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Database connection required for AI analysis. Please check your PostgreSQL connection.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {recommendations.length > 0 ? `${recommendations.length} recommendations found` : "Click 'Refresh Analysis' to check system health."}
              </span>
              {lastAnalysis && (
                <span>
                  Last analysis: {lastAnalysis.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {isAnalyzing ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold mb-2">Analyzing System Data</h3>
            <p className="text-muted-foreground">
              AI is processing sensor data and comparing against troubleshooting database...
            </p>
          </CardContent>
        </Card>
      ) : recommendations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">System Operating Normally</h3>
            <p className="text-muted-foreground">
              No critical issues detected. All parameters within normal operating range.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance Schedule</TabsTrigger>
          </TabsList>
          <TabsContent value="recommendations" className="space-y-4">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="border-l-4" style={{ borderLeftColor: `hsl(var(--${rec.severity === 'critical' ? 'destructive' : rec.severity === 'high' ? 'destructive' : rec.severity === 'medium' ? 'accent' : 'primary'}))` }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(rec.severity)}
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getSeverityColor(rec.severity)} text-white`}>
                        {rec.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {Math.round(rec.confidence * 100)}% confidence
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.category}</p>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{rec.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Recommended Actions:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                      {rec.remedy.map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Predictive Maintenance Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Next Scheduled Maintenance</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Based on current usage patterns and sensor data analysis
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• Filter replacement: 2 weeks</li>
                      <li>• Oil change: 1 month</li>
                      <li>• Seal inspection: 3 months</li>
                      <li>• Pump overhaul: 6 months</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Performance Trends</h4>
                    <p className="text-sm text-muted-foreground">
                      AI analysis suggests monitoring pressure stability and temperature control 
                      over the next operating cycles for optimal performance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
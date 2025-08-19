import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calculator,ArrowLeft, Activity, Brain, BarChart3 } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Hydraulic Press Control Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Advanced monitoring, simulation, and AI-powered diagnostics for hydraulic press systems
          </p>
        </div>

        {/* Main Navigation Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Simulation Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-4">
                <Calculator className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Hydraulic Press Simulator</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Design and simulate hydraulic press systems with custom parameters, 
                analyze performance, and export detailed reports.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Parameter Input & Validation</li>
                <li>• Real-time Calculations</li>
                <li>• Performance Graphs</li>
                <li>• CSV Export</li>
              </ul>
              <Button 
                onClick={() => navigate('/simulator')}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent/90"
              >
                Launch Simulator
              </Button>
            </CardContent>
          </Card>

          {/* Real-time Monitoring Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-secondary/20">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-secondary/10 rounded-full w-fit mb-4">
                <Activity className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Real-time Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Monitor live hydraulic press data from PostgreSQL database 
                with AI-powered diagnostics and maintenance recommendations.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Live Data Monitoring</li>
                <li>• AI Fault Detection</li>
                <li>• Maintenance Alerts</li>
                <li>• Historical Analysis</li>
              </ul>
              <Button 
                onClick={() => navigate('/monitoring')}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent/90"
              >
                View Live Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-6 w-6 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Data Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Interactive charts for pressure, temperature, vibration, and performance metrics
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Brain className="h-6 w-6 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">AI Diagnostics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Machine learning algorithms detect anomalies and predict maintenance needs
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Activity className="h-6 w-6 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Real-time Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Instant notifications for critical system events and maintenance schedules
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
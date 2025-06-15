// components/system/initialization-wizard.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Rocket, 
  Database, 
  Wallet, 
  TrendingUp,
  Bitcoin,
  Shield,
  Zap,
  ArrowRight,
  RefreshCw,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

interface InitializationStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: 'pending' | 'loading' | 'completed' | 'error';
  error?: string;
}

interface SystemStatus {
  markets_initialized: boolean;
  user_wallet_created: boolean;
  demo_data_loaded: boolean;
  real_time_connected: boolean;
}

export function InitializationWizard() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    markets_initialized: false,
    user_wallet_created: false,
    demo_data_loaded: false,
    real_time_connected: false
  });

  const [steps, setSteps] = useState<InitializationStep[]>([
    {
      id: 'markets',
      title: 'Initialize Crypto Markets',
      description: 'Setting up real-time market data for major cryptocurrencies',
      icon: TrendingUp,
      status: 'pending'
    },
    {
      id: 'wallet',
      title: 'Create User Wallet',
      description: 'Setting up your INR wallet with demo balance',
      icon: Wallet,
      status: 'pending'
    },
    {
      id: 'demo_data',
      title: 'Load Demo Portfolio',
      description: 'Adding sample trades to showcase the platform',
      icon: Database,
      status: 'pending'
    },
    {
      id: 'real_time',
      title: 'Connect Real-time Data',
      description: 'Establishing live market data connections',
      icon: Zap,
      status: 'pending'
    }
  ]);

  // Check system status on mount
  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const response = await fetch('/api/crypto/status');
      const result = await response.json();
      
      if (result.success) {
        setSystemStatus(result.status);
        updateStepsBasedOnStatus(result.status);
      }
    } catch (error) {
      console.error('Error checking system status:', error);
    }
  };

  const updateStepsBasedOnStatus = (status: SystemStatus) => {
    setSteps(prev => prev.map(step => {
      switch (step.id) {
        case 'markets':
          return { ...step, status: status.markets_initialized ? 'completed' : 'pending' };
        case 'wallet':
          return { ...step, status: status.user_wallet_created ? 'completed' : 'pending' };
        case 'demo_data':
          return { ...step, status: status.demo_data_loaded ? 'completed' : 'pending' };
        case 'real_time':
          return { ...step, status: status.real_time_connected ? 'completed' : 'pending' };
        default:
          return step;
      }
    }));
  };

  const updateStepStatus = (stepId: string, status: 'loading' | 'completed' | 'error', error?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, error } : step
    ));
  };

  const initializeSystem = async () => {
    if (!user) {
      toast.error('Please log in to initialize the system');
      return;
    }

    setIsInitializing(true);
    setCurrentStep(0);

    try {
      // Step 1: Initialize markets
      updateStepStatus('markets', 'loading');
      setCurrentStep(0);
      
      const marketsResponse = await fetch('/api/crypto/initialize', {
        method: 'POST'
      });
      const marketsResult = await marketsResponse.json();
      
      if (marketsResult.success) {
        updateStepStatus('markets', 'completed');
        setSystemStatus(prev => ({ ...prev, markets_initialized: true }));
      } else {
        throw new Error(marketsResult.error || 'Failed to initialize markets');
      }

      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Create user wallet
      updateStepStatus('wallet', 'loading');
      setCurrentStep(1);
      
      const walletResponse = await fetch('/api/crypto/wallet/initialize', {
        method: 'POST'
      });
      const walletResult = await walletResponse.json();
      
      if (walletResult.success) {
        updateStepStatus('wallet', 'completed');
        setSystemStatus(prev => ({ ...prev, user_wallet_created: true }));
      } else {
        throw new Error(walletResult.error || 'Failed to create wallet');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Load demo data
      updateStepStatus('demo_data', 'loading');
      setCurrentStep(2);
      
      const demoResponse = await fetch('/api/crypto/demo-data', {
        method: 'POST'
      });
      const demoResult = await demoResponse.json();
      
      if (demoResult.success) {
        updateStepStatus('demo_data', 'completed');
        setSystemStatus(prev => ({ ...prev, demo_data_loaded: true }));
      } else {
        throw new Error(demoResult.error || 'Failed to load demo data');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Connect real-time data
      updateStepStatus('real_time', 'loading');
      setCurrentStep(3);
      
      const realtimeResponse = await fetch('/api/crypto/realtime/connect', {
        method: 'POST'
      });
      const realtimeResult = await realtimeResponse.json();
      
      if (realtimeResult.success) {
        updateStepStatus('real_time', 'completed');
        setSystemStatus(prev => ({ ...prev, real_time_connected: true }));
      } else {
        throw new Error(realtimeResult.error || 'Failed to connect real-time data');
      }

      toast.success('🎉 System initialized successfully! You can now start trading.');
      
    } catch (error: any) {
      console.error('Initialization error:', error);
      const currentStepId = steps[currentStep]?.id;
      if (currentStepId) {
        updateStepStatus(currentStepId, 'error', error.message);
      }
      toast.error(`Initialization failed: ${error.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const allStepsCompleted = steps.every(step => step.status === 'completed');
  const hasErrors = steps.some(step => step.status === 'error');
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-blue-600/10">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/20 rounded-full">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Setup Crypto Trading System</CardTitle>
            <CardDescription className="text-base">
              Initialize your personalized trading environment with live market data
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {/* Progress Overview */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Setup Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completedSteps}/{steps.length} completed
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              
              {allStepsCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">
                      System Ready! You can now start trading cryptocurrencies.
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Initialization Steps */}
            <div className="space-y-4 mb-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    step.status === 'completed' 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                      : step.status === 'loading'
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                      : step.status === 'error'
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                      : 'bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {step.status === 'completed' ? (
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                    ) : step.status === 'loading' ? (
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      </div>
                    ) : step.status === 'error' ? (
                      <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-muted rounded-full">
                        <step.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.error && (
                      <p className="text-sm text-red-600 mt-1">{step.error}</p>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Badge 
                      variant={
                        step.status === 'completed' ? 'default' :
                        step.status === 'loading' ? 'secondary' :
                        step.status === 'error' ? 'destructive' : 'outline'
                      }
                    >
                      {step.status === 'completed' ? 'Done' :
                       step.status === 'loading' ? 'Processing' :
                       step.status === 'error' ? 'Failed' : 'Pending'}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>

            <Separator className="my-6" />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {!allStepsCompleted ? (
                <>
                  <Button
                    onClick={initializeSystem}
                    disabled={isInitializing}
                    className="flex-1"
                    size="lg"
                  >
                    {isInitializing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {isInitializing ? 'Initializing...' : 'Start Setup'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={checkSystemStatus}
                    disabled={isInitializing}
                    size="lg"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check Status
                  </Button>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <Button asChild className="flex-1" size="lg">
                    <a href="/crypto">
                      <Bitcoin className="h-4 w-4 mr-2" />
                      Start Trading
                    </a>
                  </Button>
                  
                  <Button variant="outline" asChild className="flex-1" size="lg">
                    <a href="/portfolio">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Portfolio
                    </a>
                  </Button>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Demo Environment
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This system uses demo data and virtual currency. You'll start with ₹1,00,000 
                    virtual INR to explore the platform. All trades are simulated for learning purposes.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

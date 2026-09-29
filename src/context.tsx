import React, { createContext, useContext, useState, useEffect, useTransition } from 'react';
import {
  Transaction,
  CustomerFeatures,
  ClusterProfile,
  ClusteringMetrics,
  KEvaluationResult,
  DataQualityReport,
  ModelMetadata,
  SegmentDriftComparison,
  ActiveTab
} from './types';
import {
  generateDemoRestaurantTransactions,
  executeSegmentationPipeline,
  PipelineConfig,
  parseTransactionCsv,
  exportSegmentationToCsv
} from './ml';

interface AppContextType {
  // Navigation & UI
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Data Source & Status
  dataSource: 'demo' | 'csv' | 'mongodb';
  isMongoConnected: boolean;
  mongoUri: string;
  setMongoUri: (uri: string) => void;
  connectMongo: (uri: string) => Promise<boolean>;

  // Pipeline Data & State
  transactions: Transaction[];
  customers: CustomerFeatures[];
  profiles: ClusterProfile[];
  metrics: ClusteringMetrics | null;
  kEvaluations: KEvaluationResult[];
  recommendedK: number;
  dataQualityReport: DataQualityReport | null;
  modelMetadata: ModelMetadata | null;
  driftComparison: SegmentDriftComparison | null;
  pcaVariance: [number, number];

  // Pipeline Execution & Controls
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  pipelineConfig: PipelineConfig;
  setPipelineConfig: React.Dispatch<React.SetStateAction<PipelineConfig>>;
  runPipeline: (customConfig?: PipelineConfig, customTxs?: Transaction[]) => void;
  retrainModel: () => void;

  // Customer Explorer
  selectedCustomer: CustomerFeatures | null;
  setSelectedCustomer: (customer: CustomerFeatures | null) => void;
  searchCustomerId: string;
  setSearchCustomerId: (id: string) => void;

  // Actions
  loadDemoData: () => void;
  handleCsvUpload: (csvString: string) => boolean;
  exportCsv: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('rest_seg_theme') === 'dark';
  });
  const [dataSource, setDataSource] = useState<'demo' | 'csv' | 'mongodb'>('demo');
  const [isMongoConnected, setIsMongoConnected] = useState<boolean>(false);
  const [mongoUri, setMongoUri] = useState<string>('');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<CustomerFeatures[]>([]);
  const [profiles, setProfiles] = useState<ClusterProfile[]>([]);
  const [metrics, setMetrics] = useState<ClusteringMetrics | null>(null);
  const [kEvaluations, setKEvaluations] = useState<KEvaluationResult[]>([]);
  const [recommendedK, setRecommendedK] = useState<number>(4);
  const [dataQualityReport, setDataQualityReport] = useState<DataQualityReport | null>(null);
  const [modelMetadata, setModelMetadata] = useState<ModelMetadata | null>(null);
  const [driftComparison, setDriftComparison] = useState<SegmentDriftComparison | null>(null);
  const [pcaVariance, setPcaVariance] = useState<[number, number]>([0.42, 0.23]);

  const [pipelineConfig, setPipelineConfig] = useState<PipelineConfig>({
    algorithm: 'K-Means',
    k: undefined
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFeatures | null>(null);
  const [searchCustomerId, setSearchCustomerId] = useState<string>('');

  const [, startTransition] = useTransition();

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('rest_seg_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('rest_seg_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Core Pipeline Execution
  const runPipeline = (customConfig?: PipelineConfig, customTxs?: Transaction[]) => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Validating transactions & engineering behavioral features...');

    const txsToUse = customTxs || transactions;
    const configToUse = customConfig || pipelineConfig;

    setTimeout(() => {
      try {
        setLoadingMessage('Normalizing features & calculating RFM quantiles...');
        
        setTimeout(() => {
          try {
            setLoadingMessage(`Executing ${configToUse.algorithm} clustering & Silhouette evaluation...`);
            
            const result = executeSegmentationPipeline(txsToUse, configToUse);

            startTransition(() => {
              setCustomers(result.customers);
              setProfiles(result.profiles);
              setMetrics(result.metrics);
              setKEvaluations(result.kEvaluations);
              setRecommendedK(result.recommendedK);
              setDataQualityReport(result.dataQualityReport);
              setModelMetadata(result.modelMetadata);
              if (result.driftComparison) {
                setDriftComparison(result.driftComparison);
              }
              setPcaVariance(result.pcaVariance);
              setIsLoading(false);
              setLoadingMessage('');
            });
          } catch (pipelineErr: any) {
            console.error('Pipeline error:', pipelineErr);
            setError(pipelineErr.message || 'Error occurred during ML pipeline execution.');
            setIsLoading(false);
          }
        }, 150);
      } catch (err: any) {
        console.error('Feature engineering error:', err);
        setError(err.message || 'Error processing transaction data.');
        setIsLoading(false);
      }
    }, 150);
  };

  // Initial Load: Demo Data
  useEffect(() => {
    const rawDemo = generateDemoRestaurantTransactions(520);
    setTransactions(rawDemo);
    setDataSource('demo');
    runPipeline(pipelineConfig, rawDemo);
  }, []);

  const loadDemoData = () => {
    const rawDemo = generateDemoRestaurantTransactions(520);
    setTransactions(rawDemo);
    setDataSource('demo');
    runPipeline(pipelineConfig, rawDemo);
  };

  const handleCsvUpload = (csvString: string): boolean => {
    const parsed = parseTransactionCsv(csvString);
    if (parsed.error) {
      setError(parsed.error);
      return false;
    }
    if (parsed.transactions.length === 0) {
      setError('No valid transactions found in CSV.');
      return false;
    }
    setTransactions(parsed.transactions);
    setDataSource('csv');
    setError(null);
    runPipeline(pipelineConfig, parsed.transactions);
    return true;
  };

  const connectMongo = async (uri: string): Promise<boolean> => {
    setIsLoading(true);
    setLoadingMessage('Verifying MongoDB connection string...');
    await new Promise(r => setTimeout(r, 700));

    if (!uri || !uri.startsWith('mongodb')) {
      setIsLoading(false);
      setError('Invalid MongoDB connection URI. Falling back to Demo Mode.');
      setIsMongoConnected(false);
      return false;
    }

    // In a pure client-side environment or demo mode:
    setIsLoading(false);
    setIsMongoConnected(true);
    setDataSource('mongodb');
    setError(null);
    return true;
  };

  const retrainModel = () => {
    runPipeline();
  };

  const exportCsv = () => {
    if (customers.length === 0) {
      setError('No customer segmentation data available to export.');
      return;
    }
    exportSegmentationToCsv(customers);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        darkMode,
        toggleDarkMode,
        dataSource,
        isMongoConnected,
        mongoUri,
        setMongoUri,
        connectMongo,
        transactions,
        customers,
        profiles,
        metrics,
        kEvaluations,
        recommendedK,
        dataQualityReport,
        modelMetadata,
        driftComparison,
        pcaVariance,
        isLoading,
        loadingMessage,
        error,
        pipelineConfig,
        setPipelineConfig,
        runPipeline,
        retrainModel,
        selectedCustomer,
        setSelectedCustomer,
        searchCustomerId,
        setSearchCustomerId,
        loadDemoData,
        handleCsvUpload,
        exportCsv
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

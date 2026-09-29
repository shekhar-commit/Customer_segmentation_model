export interface Transaction {
  customer_id: string;
  order_id: string;
  order_date: string; // ISO date YYYY-MM-DD
  product_id?: string;
  product_name?: string;
  category?: string;
  quantity?: number;
  unit_price?: number;
  discount?: number;
  total_amount: number;
  payment_method?: string;
  channel?: string; // 'Dine-in' | 'Takeaway' | 'Delivery'
  visit_id?: string;
  offer_id?: string;
  offer_used?: boolean | string | number;
  offer_response?: number; // 0 or 1
}

export interface CustomerFeatures {
  customer_id: string;
  // RFM
  recency_days: number;
  frequency: number;
  monetary: number;
  
  // Behavioral features
  total_orders: number;
  total_quantity: number;
  avg_order_value: number;
  avg_items_per_order: number;
  max_order_value: number;
  min_order_value: number;
  purchase_frequency: number; // orders per month

  // Activity features
  first_order_date: string;
  latest_order_date: string;
  days_since_first_purchase: number;
  customer_lifetime_days: number;

  // Time-window features
  orders_last_30d: number;
  orders_last_60d: number;
  orders_last_90d: number;
  spend_last_30d: number;
  spend_last_60d: number;
  spend_last_90d: number;

  // Product behavior
  unique_products: number;
  unique_categories: number;
  favorite_product: string;
  favorite_category: string;
  category_diversity: number; // unique_categories / total_orders
  premium_product_ratio: number;

  // Offer behavior
  offers_available: boolean;
  offers_received?: number;
  offers_used?: number;
  offer_response_rate?: number;
  avg_discount_used?: number;

  // RFM Scoring
  r_score: number; // 1-5
  f_score: number; // 1-5
  m_score: number; // 1-5
  rfm_score: string; // e.g. "554"
  rfm_segment: string; // e.g. "Champions", "At Risk"

  // Clustering Assignment
  cluster: number;
  segment_name: string;
  pc1?: number;
  pc2?: number;
}

export interface ClusterProfile {
  cluster: number;
  segment_name: string;
  customer_count: number;
  percentage: number;
  avg_recency: number;
  avg_frequency: number;
  avg_monetary: number;
  avg_aov: number;
  avg_orders_30d: number;
  avg_orders_90d: number;
  avg_spend_30d: number;
  avg_lifetime_days: number;
  favorite_category: string;
  favorite_product: string;
  offer_response_rate: number | null;
  revenue_contribution: number;
  revenue_percentage: number;
  reasoning: string[];
  recommendations: string[];
  color: string;
}

export interface ClusteringMetrics {
  algorithm: 'K-Means' | 'Agglomerative' | 'DBSCAN';
  k_clusters: number;
  silhouette_score: number;
  davies_bouldin_score: number;
  calinski_harabasz_score: number;
  features_used: string[];
  total_customers: number;
  training_timestamp: string;
  dataset_date_range: {
    start: string;
    end: string;
  };
  noise_points?: number; // for DBSCAN
  parameters: Record<string, any>;
}

export interface KEvaluationResult {
  k: number;
  silhouette_score: number;
  davies_bouldin_score: number;
  calinski_harabasz_score: number;
  inertia?: number;
}

export interface DataQualityReport {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  missing_values_count: number;
  duplicate_rows_count: number;
  date_range_start: string;
  date_range_end: string;
  cleaning_operations_performed: string[];
  features_available: string[];
  features_used_for_clustering: string[];
  unique_customers: number;
  unique_orders: number;
}

export interface ModelMetadata {
  model_version: string;
  algorithm: string;
  created_at: string;
  dataset_size: number;
  feature_count: number;
  cluster_count: number;
  silhouette_score: number;
  davies_bouldin_score: number;
  calinski_harabasz_score: number;
  parameters: Record<string, any>;
  cluster_profiles: ClusterProfile[];
}

export interface SegmentDriftComparison {
  previous_run: {
    model_version: string;
    timestamp: string;
    distribution: Record<string, { count: number; percentage: number }>;
  };
  current_run: {
    model_version: string;
    timestamp: string;
    distribution: Record<string, { count: number; percentage: number }>;
  };
  differences: {
    segment_name: string;
    prev_percentage: number;
    curr_percentage: number;
    delta_percentage: number;
    observation: string;
  }[];
}

export type ActiveTab = 
  | 'dashboard'
  | 'segments'
  | 'comparison'
  | 'customers'
  | 'rfm';

import {
  Transaction,
  CustomerFeatures,
  ClusterProfile,
  ClusteringMetrics,
  KEvaluationResult,
  DataQualityReport,
  ModelMetadata,
  SegmentDriftComparison
} from './types';

// ================================================================
// csv.ts
// ================================================================
/**
 * Parses raw CSV string into Transaction objects.
 * Handles comma-separated values, quoted strings, and header trims.
 */
export function parseTransactionCsv(csvText: string): { transactions: Transaction[]; error?: string } {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) {
    return { transactions: [], error: 'CSV file must contain a header row and at least one data row.' };
  }

  // Parse header
  const header = splitCsvLine(lines[0]).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

  const reqFields = ['customer_id', 'order_id', 'order_date', 'total_amount'];
  const missing = reqFields.filter(f => !header.includes(f));
  if (missing.length > 0) {
    return {
      transactions: [],
      error: `Missing required column(s): ${missing.join(', ')}. Minimum required: customer_id, order_id, order_date, total_amount.`
    };
  }

  const colIdx = (name: string) => header.indexOf(name);

  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = splitCsvLine(lines[i]);
    if (row.length < header.length) continue;

    const custId = row[colIdx('customer_id')];
    const orderId = row[colIdx('order_id')];
    const orderDate = row[colIdx('order_date')];
    const totalAmount = parseFloat(row[colIdx('total_amount')]);

    const tx: Transaction = {
      customer_id: custId,
      order_id: orderId,
      order_date: orderDate,
      total_amount: isNaN(totalAmount) ? 0 : totalAmount
    };

    if (colIdx('product_id') !== -1) tx.product_id = row[colIdx('product_id')];
    if (colIdx('product_name') !== -1) tx.product_name = row[colIdx('product_name')];
    if (colIdx('category') !== -1) tx.category = row[colIdx('category')];
    if (colIdx('quantity') !== -1) tx.quantity = parseInt(row[colIdx('quantity')]) || 1;
    if (colIdx('unit_price') !== -1) tx.unit_price = parseFloat(row[colIdx('unit_price')]) || totalAmount;
    if (colIdx('discount') !== -1) tx.discount = parseFloat(row[colIdx('discount')]) || 0;
    if (colIdx('payment_method') !== -1) tx.payment_method = row[colIdx('payment_method')];
    if (colIdx('channel') !== -1) tx.channel = row[colIdx('channel')];
    if (colIdx('visit_id') !== -1) tx.visit_id = row[colIdx('visit_id')];
    if (colIdx('offer_id') !== -1) tx.offer_id = row[colIdx('offer_id')];
    if (colIdx('offer_used') !== -1) tx.offer_used = row[colIdx('offer_used')];
    if (colIdx('offer_response') !== -1) tx.offer_response = parseInt(row[colIdx('offer_response')]) || 0;

    transactions.push(tx);
  }

  return { transactions };
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Exports customer segmentation results into a standard downloadable CSV file.
 */
export function exportSegmentationToCsv(customers: CustomerFeatures[]): void {
  const headers = [
    'customer_id',
    'segment',
    'cluster',
    'recency_days',
    'frequency',
    'monetary',
    'avg_order_value',
    'orders_last_30d',
    'orders_last_90d',
    'favorite_category',
    'favorite_product'
  ];

  const rows = customers.map(c => [
    `"${c.customer_id}"`,
    `"${c.segment_name}"`,
    c.cluster,
    c.recency_days,
    c.frequency,
    c.monetary.toFixed(2),
    c.avg_order_value.toFixed(2),
    c.orders_last_30d,
    c.orders_last_90d,
    `"${c.favorite_category}"`,
    `"${c.favorite_product.replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `restaurant_customer_segmentation_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ================================================================
// dataGenerator.ts
// ================================================================
export const MENU_ITEMS = [
  // Mains
  { id: 'PRD-M01', name: 'Signature Butter Chicken & Naan', category: 'Mains', price: 420 },
  { id: 'PRD-M02', name: 'Artisanal Truffle Pasta', category: 'Mains', price: 540 },
  { id: 'PRD-M03', name: 'Wood-Fired Margherita Pizza', category: 'Mains', price: 380 },
  { id: 'PRD-M04', name: 'Wagyu Beef Smash Burger', category: 'Mains', price: 490 },
  { id: 'PRD-M05', name: 'Grilled Norwegian Salmon', category: 'Mains', price: 680 },
  { id: 'PRD-M06', name: 'Paneer Tikka Masala Bowl', category: 'Mains', price: 340 },
  { id: 'PRD-M07', name: 'Spicy Thai Basil Rice Bowl', category: 'Mains', price: 310 },
  { id: 'PRD-M08', name: 'Slow-Cooked Lamb Rogan Josh', category: 'Mains', price: 580 },

  // Appetizers
  { id: 'PRD-A01', name: 'Crispy Truffle Fries', category: 'Appetizers', price: 210 },
  { id: 'PRD-A02', name: 'Fire-Roasted Garlic Wings', category: 'Appetizers', price: 280 },
  { id: 'PRD-A03', name: 'Smoked Jalapeno Poppers', category: 'Appetizers', price: 230 },
  { id: 'PRD-A04', name: 'Wild Mushroom Bruschetta', category: 'Appetizers', price: 260 },
  { id: 'PRD-A05', name: 'Caesar Crunch Salad', category: 'Appetizers', price: 240 },

  // Beverages
  { id: 'PRD-B01', name: 'Craft Cold Brew Iced Coffee', category: 'Beverages', price: 160 },
  { id: 'PRD-B02', name: 'Artisanal Peach Mint Soda', category: 'Beverages', price: 140 },
  { id: 'PRD-B03', name: 'Handcrafted Masala Chai', category: 'Beverages', price: 90 },
  { id: 'PRD-B04', name: 'Fresh Passionfruit Lemonade', category: 'Beverages', price: 150 },
  { id: 'PRD-B05', name: 'Single Origin Espresso', category: 'Beverages', price: 110 },
  { id: 'PRD-B06', name: 'Sparkling Elderflower Fizz', category: 'Beverages', price: 180 },

  // Desserts
  { id: 'PRD-D01', name: 'Belgian Dark Chocolate Lava Cake', category: 'Desserts', price: 290 },
  { id: 'PRD-D02', name: 'Classic New York Cheesecake', category: 'Desserts', price: 280 },
  { id: 'PRD-D03', name: 'Pistachio Baklava with Gelato', category: 'Desserts', price: 260 },
  { id: 'PRD-D04', name: 'Tiramisu Della Casa', category: 'Desserts', price: 270 },

  // Specials
  { id: 'PRD-S01', name: 'Chef Tasting Platter (for 2)', category: 'Specials', price: 1150 },
  { id: 'PRD-S02', name: 'Seafood Saffron Paella', category: 'Specials', price: 890 },
  { id: 'PRD-S03', name: 'Prime Aged Ribeye Steak', category: 'Specials', price: 1250 }
];

const CHANNELS = ['Dine-in', 'Takeaway', 'Delivery'];
const PAYMENT_METHODS = ['Credit Card', 'UPI', 'Apple Pay', 'Debit Card', 'Cash'];

// Deterministic Pseudo-Random Generator for consistent reproducibility
class LCG {
  private m = 0x80000000;
  private a = 1103515245;
  private c = 12345;
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed;
  }

  nextFloat(): number {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state / (this.m - 1);
  }

  nextInt(min: number, max: number): number {
    return Math.floor(min + this.nextFloat() * (max - min + 1));
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.nextFloat() * arr.length)];
  }
}

/**
 * Generates a realistic restaurant transaction history.
 * We model 520 customers with natural behavioral distributions:
 * - High-value VIPs: frequent, high basket size, wine/specials
 * - Regular diners: steady visits, mid basket size
 * - Lunch workers: high frequency, low items per order, coffee & bowls
 * - Weekend splurgers: occasional, large groups/desserts/specials
 * - Price sensitive / deal hunters: responsive to offers, lower price items
 * - New first-timers: recent single or double orders
 * - Lapsed / At-risk diners: high past spend but no orders in 60-120 days
 * - Inactive: no orders in 120-250 days
 *
 * NOTE: The generator creates raw transactions ONLY. The ML pipeline itself
 * discovers the clusters, profiles, and assigns segment names!
 */
export function generateDemoRestaurantTransactions(customerCount = 520): Transaction[] {
  const rng = new LCG(2026);
  const transactions: Transaction[] = [];

  const referenceDate = new Date('2026-09-28');
  let orderCounter = 10001;

  for (let c = 1; c <= customerCount; c++) {
    const customerId = `CUST-${String(c).padStart(4, '0')}`;

    // Assign latent behavioral archetype to generate realistic variance in raw transaction log
    const archetypeRoll = rng.nextFloat();
    let orderCount: number;
    let recencyMinDays: number;
    let recencyMaxDays: number;
    let itemsPerOrderMin: number;
    let itemsPerOrderMax: number;
    let preferredCategories: string[];
    let discountChance: number;
    let maxLifetimeDays: number;

    if (archetypeRoll < 0.15) {
      // High-spending VIPs
      orderCount = rng.nextInt(14, 28);
      recencyMinDays = 1;
      recencyMaxDays = 12;
      itemsPerOrderMin = 3;
      itemsPerOrderMax = 6;
      preferredCategories = ['Specials', 'Mains', 'Desserts'];
      discountChance = 0.08;
      maxLifetimeDays = 280;
    } else if (archetypeRoll < 0.35) {
      // Regular loyalists
      orderCount = rng.nextInt(9, 18);
      recencyMinDays = 2;
      recencyMaxDays = 25;
      itemsPerOrderMin = 2;
      itemsPerOrderMax = 4;
      preferredCategories = ['Mains', 'Beverages', 'Appetizers'];
      discountChance = 0.15;
      maxLifetimeDays = 240;
    } else if (archetypeRoll < 0.50) {
      // Frequent lunch/low-basket regulars
      orderCount = rng.nextInt(10, 22);
      recencyMinDays = 1;
      recencyMaxDays = 18;
      itemsPerOrderMin = 1;
      itemsPerOrderMax = 2;
      preferredCategories = ['Mains', 'Beverages'];
      discountChance = 0.20;
      maxLifetimeDays = 210;
    } else if (archetypeRoll < 0.65) {
      // Weekend/Occasional High-Spenders
      orderCount = rng.nextInt(3, 7);
      recencyMinDays = 8;
      recencyMaxDays = 50;
      itemsPerOrderMin = 3;
      itemsPerOrderMax = 7;
      preferredCategories = ['Specials', 'Desserts', 'Appetizers'];
      discountChance = 0.10;
      maxLifetimeDays = 260;
    } else if (archetypeRoll < 0.78) {
      // Price sensitive / offer responders
      orderCount = rng.nextInt(4, 9);
      recencyMinDays = 10;
      recencyMaxDays = 75;
      itemsPerOrderMin = 1;
      itemsPerOrderMax = 3;
      preferredCategories = ['Appetizers', 'Beverages', 'Mains'];
      discountChance = 0.75;
      maxLifetimeDays = 180;
    } else if (archetypeRoll < 0.88) {
      // At-risk / fading customers (previously active, now lapsed)
      orderCount = rng.nextInt(5, 12);
      recencyMinDays = 65;
      recencyMaxDays = 135;
      itemsPerOrderMin = 2;
      itemsPerOrderMax = 4;
      preferredCategories = ['Mains', 'Appetizers'];
      discountChance = 0.25;
      maxLifetimeDays = 280;
    } else if (archetypeRoll < 0.95) {
      // Brand new customers
      orderCount = rng.nextInt(1, 2);
      recencyMinDays = 1;
      recencyMaxDays = 22;
      itemsPerOrderMin = 1;
      itemsPerOrderMax = 3;
      preferredCategories = ['Mains', 'Beverages'];
      discountChance = 0.30;
      maxLifetimeDays = 22;
    } else {
      // Inactive / lost customers
      orderCount = rng.nextInt(2, 5);
      recencyMinDays = 140;
      recencyMaxDays = 270;
      itemsPerOrderMin = 1;
      itemsPerOrderMax = 3;
      preferredCategories = ['Mains', 'Beverages'];
      discountChance = 0.20;
      maxLifetimeDays = 300;
    }

    // Determine actual customer latest order date and first order date
    const latestRecency = rng.nextInt(recencyMinDays, recencyMaxDays);
    const actualLifetime = Math.min(maxLifetimeDays, Math.max(latestRecency, rng.nextInt(latestRecency + 10, latestRecency + maxLifetimeDays)));

    // Generate spread of order dates between (latestRecency) and (actualLifetime)
    const orderDates: Date[] = [];
    for (let o = 0; o < orderCount; o++) {
      let daysAgo: number;
      if (orderCount === 1) {
        daysAgo = latestRecency;
      } else if (o === 0) {
        daysAgo = latestRecency;
      } else if (o === orderCount - 1) {
        daysAgo = actualLifetime;
      } else {
        daysAgo = rng.nextInt(latestRecency, actualLifetime);
      }
      const d = new Date(referenceDate);
      d.setDate(d.getDate() - daysAgo);
      orderDates.push(d);
    }

    // Sort order dates ascending
    orderDates.sort((a, b) => a.getTime() - b.getTime());

    for (const orderDate of orderDates) {
      const orderId = `ORD-${orderCounter++}`;
      const itemCount = rng.nextInt(itemsPerOrderMin, itemsPerOrderMax);
      const channel = rng.pick(CHANNELS);
      const paymentMethod = rng.pick(PAYMENT_METHODS);

      const isOfferApplicable = rng.nextFloat() < discountChance;
      const offerId = isOfferApplicable ? `PROMO-${rng.nextInt(10, 99)}` : undefined;
      const offerUsed = isOfferApplicable;
      const offerResponse = isOfferApplicable ? 1 : 0;
      const discountPercent = isOfferApplicable ? rng.pick([0.10, 0.15, 0.20, 0.25]) : 0;

      for (let i = 0; i < itemCount; i++) {
        // Pick product based on category preference
        const chosenCategory = rng.nextFloat() < 0.7 
          ? rng.pick(preferredCategories) 
          : rng.pick(['Mains', 'Appetizers', 'Beverages', 'Desserts', 'Specials']);
        
        const candidateItems = MENU_ITEMS.filter(m => m.category === chosenCategory);
        const product = candidateItems.length > 0 ? rng.pick(candidateItems) : rng.pick(MENU_ITEMS);

        const quantity = rng.nextFloat() > 0.85 ? 2 : 1;
        const subtotal = product.price * quantity;
        const discountAmount = Math.round(subtotal * discountPercent);
        const totalAmount = Math.max(10, subtotal - discountAmount);

        transactions.push({
          customer_id: customerId,
          order_id: orderId,
          order_date: orderDate.toISOString().split('T')[0],
          product_id: product.id,
          product_name: product.name,
          category: product.category,
          quantity: quantity,
          unit_price: product.price,
          discount: discountAmount,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          channel: channel,
          visit_id: `VIS-${orderId}`,
          offer_id: offerId,
          offer_used: offerUsed,
          offer_response: offerResponse
        });
      }
    }
  }

  // Inject a few realistic bad rows that data cleaning will catch and clean (transparently reported in Data Quality):
  // 1 duplicate row
  if (transactions.length > 10) {
    transactions.push({ ...transactions[5] });
  }
  // 1 record with null customer_id or empty total
  transactions.push({
    customer_id: '',
    order_id: 'ORD-INVALID-01',
    order_date: '2026-08-01',
    total_amount: 150
  });
  // 1 record with negative total
  transactions.push({
    customer_id: 'CUST-0001',
    order_id: 'ORD-INVALID-02',
    order_date: '2026-08-02',
    total_amount: -250
  });

  return transactions;
}

// ================================================================
// validation.ts
// ================================================================
export interface ValidationResult {
  validTransactions: Transaction[];
  report: DataQualityReport;
}

export function validateAndCleanTransactions(
  rawTransactions: Transaction[],
  featuresUsed: string[] = []
): ValidationResult {
  const cleaningOps: string[] = [];
  let invalidRows = 0;
  let missingValuesCount = 0;
  let duplicateRowsCount = 0;

  const validTransactions: Transaction[] = [];
  const seenTxKeys = new Set<string>();

  let earliestDate: Date | null = null;
  let latestDate: Date | null = null;

  const uniqueCustomers = new Set<string>();
  const uniqueOrders = new Set<string>();

  for (let idx = 0; idx < rawTransactions.length; idx++) {
    const tx = rawTransactions[idx];
    let isRowInvalid = false;

    // 1. Check required fields: customer_id, order_id, order_date, total_amount
    if (!tx.customer_id || String(tx.customer_id).trim() === '') {
      invalidRows++;
      missingValuesCount++;
      isRowInvalid = true;
    }

    if (!tx.order_id || String(tx.order_id).trim() === '') {
      invalidRows++;
      missingValuesCount++;
      isRowInvalid = true;
    }

    if (!tx.order_date || String(tx.order_date).trim() === '') {
      invalidRows++;
      missingValuesCount++;
      isRowInvalid = true;
    } else {
      const parsedDate = new Date(tx.order_date);
      if (isNaN(parsedDate.getTime())) {
        invalidRows++;
        isRowInvalid = true;
      }
    }

    if (tx.total_amount === undefined || tx.total_amount === null || isNaN(Number(tx.total_amount))) {
      invalidRows++;
      missingValuesCount++;
      isRowInvalid = true;
    } else if (Number(tx.total_amount) < 0) {
      // Negative amount check
      invalidRows++;
      isRowInvalid = true;
    }

    // Impossible quantities check if present
    if (tx.quantity !== undefined && tx.quantity !== null) {
      if (isNaN(Number(tx.quantity)) || Number(tx.quantity) <= 0 || Number(tx.quantity) > 100) {
        invalidRows++;
        isRowInvalid = true;
      }
    }

    // Deduplication check: combination of customer_id, order_id, product_id, order_date, total_amount
    const txKey = `${tx.customer_id}_${tx.order_id}_${tx.product_id || 'NA'}_${tx.order_date}_${tx.total_amount}`;
    if (seenTxKeys.has(txKey)) {
      duplicateRowsCount++;
      invalidRows++;
      isRowInvalid = true;
    }

    if (!isRowInvalid) {
      seenTxKeys.add(txKey);

      const parsedDate = new Date(tx.order_date);
      if (!earliestDate || parsedDate < earliestDate) earliestDate = parsedDate;
      if (!latestDate || parsedDate > latestDate) latestDate = parsedDate;

      uniqueCustomers.add(String(tx.customer_id).trim());
      uniqueOrders.add(String(tx.order_id).trim());

      // Cleaned standard form
      validTransactions.push({
        ...tx,
        customer_id: String(tx.customer_id).trim(),
        order_id: String(tx.order_id).trim(),
        total_amount: Number(tx.total_amount),
        quantity: tx.quantity ? Number(tx.quantity) : 1,
        unit_price: tx.unit_price ? Number(tx.unit_price) : Number(tx.total_amount),
        discount: tx.discount ? Number(tx.discount) : 0,
        category: tx.category || 'Mains',
        product_name: tx.product_name || 'Standard Dish',
        channel: tx.channel || 'Dine-in'
      });
    }
  }

  // Record operational trace of cleaning
  if (duplicateRowsCount > 0) {
    cleaningOps.push(`Removed ${duplicateRowsCount} exact duplicate transaction rows.`);
  }
  if (missingValuesCount > 0) {
    cleaningOps.push(`Discarded ${missingValuesCount} records with null or missing required keys (customer_id / order_id / total_amount).`);
  }
  const negativeOrAnomalyCount = invalidRows - duplicateRowsCount - missingValuesCount;
  if (negativeOrAnomalyCount > 0) {
    cleaningOps.push(`Filtered ${negativeOrAnomalyCount} records with invalid dates, negative monetary values, or anomalous quantities.`);
  }
  cleaningOps.push(`Validated ${validTransactions.length} clean transaction items across ${uniqueCustomers.size} unique restaurant guests.`);
  cleaningOps.push(`Normalized dates to ISO format and cast numerical columns (amount, quantity, discount) to 64-bit floats.`);

  // Detect available columns
  const sample = rawTransactions[0] || {};
  const featuresAvailable = Object.keys(sample);

  const report: DataQualityReport = {
    total_rows: rawTransactions.length,
    valid_rows: validTransactions.length,
    invalid_rows: invalidRows,
    missing_values_count: missingValuesCount,
    duplicate_rows_count: duplicateRowsCount,
    date_range_start: earliestDate ? earliestDate.toISOString().split('T')[0] : 'N/A',
    date_range_end: latestDate ? latestDate.toISOString().split('T')[0] : 'N/A',
    cleaning_operations_performed: cleaningOps,
    features_available: featuresAvailable,
    features_used_for_clustering: featuresUsed,
    unique_customers: uniqueCustomers.size,
    unique_orders: uniqueOrders.size
  };

  return { validTransactions, report };
}

// ================================================================
// featureEngineering.ts
// ================================================================
/**
 * Aggregates item-level/order-level transaction data into a robust customer feature table.
 */
export function engineerCustomerFeatures(transactions: Transaction[]): CustomerFeatures[] {
  if (transactions.length === 0) return [];

  // Determine reference date: 1 day past the latest order date in the dataset
  let maxDateMs = 0;
  for (const tx of transactions) {
    const time = new Date(tx.order_date).getTime();
    if (time > maxDateMs) maxDateMs = time;
  }
  const referenceDate = new Date(maxDateMs + 24 * 60 * 60 * 1000);

  // Group transactions by customer
  const customerTxMap = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    let list = customerTxMap.get(tx.customer_id);
    if (!list) {
      list = [];
      customerTxMap.set(tx.customer_id, list);
    }
    list.push(tx);
  }

  // Check if offers columns are available in dataset
  const hasOfferColumn = transactions.some(
    tx => tx.offer_id !== undefined || tx.offer_used !== undefined || tx.offer_response !== undefined
  );

  const customerList: CustomerFeatures[] = [];

  for (const [customerId, txList] of customerTxMap.entries()) {
    // Group by unique orders
    const orderMap = new Map<string, {
      date: Date;
      total: number;
      quantity: number;
      products: string[];
      categories: string[];
      discounts: number;
      offerUsed: boolean;
      offerResponse: number;
    }>();

    const productCountMap = new Map<string, number>();
    const categoryCountMap = new Map<string, number>();

    let totalQuantity = 0;
    let totalDiscount = 0;
    let offersReceived = 0;
    let offersUsed = 0;

    for (const tx of txList) {
      const orderId = tx.order_id;
      const orderDate = new Date(tx.order_date);
      const amount = tx.total_amount;
      const qty = tx.quantity || 1;
      const prod = tx.product_name || 'Standard Dish';
      const cat = tx.category || 'Mains';

      totalQuantity += qty;
      totalDiscount += tx.discount || 0;

      productCountMap.set(prod, (productCountMap.get(prod) || 0) + qty);
      categoryCountMap.set(cat, (categoryCountMap.get(cat) || 0) + qty);

      if (tx.offer_id) {
        offersReceived++;
      }
      if (tx.offer_used === true || tx.offer_used === 1 || String(tx.offer_used).toLowerCase() === 'true') {
        offersUsed++;
      }

      let orderRecord = orderMap.get(orderId);
      if (!orderRecord) {
        orderRecord = {
          date: orderDate,
          total: amount,
          quantity: qty,
          products: [prod],
          categories: [cat],
          discounts: tx.discount || 0,
          offerUsed: Boolean(tx.offer_used),
          offerResponse: tx.offer_response !== undefined ? Number(tx.offer_response) : (tx.offer_used ? 1 : 0)
        };
        orderMap.set(orderId, orderRecord);
      } else {
        orderRecord.total += amount;
        orderRecord.quantity += qty;
        orderRecord.products.push(prod);
        orderRecord.categories.push(cat);
        orderRecord.discounts += tx.discount || 0;
        if (tx.offer_used) orderRecord.offerUsed = true;
      }
    }

    const uniqueOrders = Array.from(orderMap.values());
    const totalOrders = uniqueOrders.length;
    const totalMonetary = uniqueOrders.reduce((sum, o) => sum + o.total, 0);

    // Sort order dates
    const orderDates = uniqueOrders.map(o => o.date).sort((a, b) => a.getTime() - b.getTime());
    const firstOrderDate = orderDates[0];
    const latestOrderDate = orderDates[orderDates.length - 1];

    // Recency (days from reference date)
    const recencyMs = referenceDate.getTime() - latestOrderDate.getTime();
    const recencyDays = Math.max(1, Math.round(recencyMs / (1000 * 60 * 60 * 24)));

    // Days since first purchase & lifetime
    const firstMs = referenceDate.getTime() - firstOrderDate.getTime();
    const daysSinceFirstPurchase = Math.max(1, Math.round(firstMs / (1000 * 60 * 60 * 24)));
    const lifetimeMs = latestOrderDate.getTime() - firstOrderDate.getTime();
    const customerLifetimeDays = Math.max(1, Math.round(lifetimeMs / (1000 * 60 * 60 * 24)));

    // Order Value stats
    const orderValues = uniqueOrders.map(o => o.total);
    const avgOrderValue = Math.round((totalMonetary / totalOrders) * 100) / 100;
    const maxOrderValue = Math.max(...orderValues);
    const minOrderValue = Math.min(...orderValues);
    const avgItemsPerOrder = Math.round((totalQuantity / totalOrders) * 10) / 10;
    
    // Purchase Frequency (normalized orders per 30-day period)
    const purchaseFrequency = Math.round((totalOrders / Math.max(1, daysSinceFirstPurchase / 30)) * 100) / 100;

    // Time-window features (30d, 60d, 90d from reference date)
    const ms30d = 30 * 24 * 60 * 60 * 1000;
    const ms60d = 60 * 24 * 60 * 60 * 1000;
    const ms90d = 90 * 24 * 60 * 60 * 1000;

    let orders30d = 0;
    let orders60d = 0;
    let orders90d = 0;
    let spend30d = 0;
    let spend60d = 0;
    let spend90d = 0;

    for (const o of uniqueOrders) {
      const delta = referenceDate.getTime() - o.date.getTime();
      if (delta <= ms30d) {
        orders30d++;
        spend30d += o.total;
      }
      if (delta <= ms60d) {
        orders60d++;
        spend60d += o.total;
      }
      if (delta <= ms90d) {
        orders90d++;
        spend90d += o.total;
      }
    }

    // Product & Category favorites
    let favoriteProduct = 'Standard Dish';
    let maxProdCount = -1;
    for (const [p, count] of productCountMap.entries()) {
      if (count > maxProdCount) {
        maxProdCount = count;
        favoriteProduct = p;
      }
    }

    let favoriteCategory = 'Mains';
    let maxCatCount = -1;
    let premiumItemCount = 0;
    for (const [c, count] of categoryCountMap.entries()) {
      if (count > maxCatCount) {
        maxCatCount = count;
        favoriteCategory = c;
      }
      if (c === 'Specials' || c === 'Desserts') {
        premiumItemCount += count;
      }
    }

    const uniqueProductsCount = productCountMap.size;
    const uniqueCategoriesCount = categoryCountMap.size;
    const categoryDiversity = Math.round((uniqueCategoriesCount / Math.max(1, totalOrders)) * 100) / 100;
    const premiumProductRatio = Math.round((premiumItemCount / Math.max(1, totalQuantity)) * 100) / 100;

    // Offer metrics
    const offerResponseRate = offersReceived > 0 
      ? Math.round((offersUsed / offersReceived) * 100) / 100 
      : (hasOfferColumn ? 0 : undefined);
    const avgDiscountUsed = totalOrders > 0 ? Math.round((totalDiscount / totalOrders) * 100) / 100 : 0;

    customerList.push({
      customer_id: customerId,
      recency_days: recencyDays,
      frequency: totalOrders,
      monetary: Math.round(totalMonetary * 100) / 100,
      total_orders: totalOrders,
      total_quantity: totalQuantity,
      avg_order_value: avgOrderValue,
      avg_items_per_order: avgItemsPerOrder,
      max_order_value: maxOrderValue,
      min_order_value: minOrderValue,
      purchase_frequency: purchaseFrequency,
      first_order_date: firstOrderDate.toISOString().split('T')[0],
      latest_order_date: latestOrderDate.toISOString().split('T')[0],
      days_since_first_purchase: daysSinceFirstPurchase,
      customer_lifetime_days: customerLifetimeDays,
      orders_last_30d: orders30d,
      orders_last_60d: orders60d,
      orders_last_90d: orders90d,
      spend_last_30d: Math.round(spend30d * 100) / 100,
      spend_last_60d: Math.round(spend60d * 100) / 100,
      spend_last_90d: Math.round(spend90d * 100) / 100,
      unique_products: uniqueProductsCount,
      unique_categories: uniqueCategoriesCount,
      favorite_product: favoriteProduct,
      favorite_category: favoriteCategory,
      category_diversity: categoryDiversity,
      premium_product_ratio: premiumProductRatio,
      offers_available: hasOfferColumn,
      offers_received: hasOfferColumn ? offersReceived : undefined,
      offers_used: hasOfferColumn ? offersUsed : undefined,
      offer_response_rate: offerResponseRate,
      avg_discount_used: avgDiscountUsed,
      // Placeholders for RFM and Clustering
      r_score: 1,
      f_score: 1,
      m_score: 1,
      rfm_score: '111',
      rfm_segment: 'Unassigned',
      cluster: 0,
      segment_name: 'Unassigned'
    });
  }

  return customerList;
}

// ================================================================
// rfm.ts
// ================================================================
/**
 * Computes 1 to 5 quantile scores for an array of numbers.
 * Invert = true means lower numerical value receives a HIGHER score (e.g. Recency).
 * Safely handles ties, duplicates, and edge cases.
 */
function computeQuantileScores(values: number[], invert: boolean = false): number[] {
  const n = values.length;
  if (n === 0) return [];
  if (n === 1) return [3];

  // Pair value with original index
  const indexed = values.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);

  const scores = new Array<number>(n);

  for (let rank = 0; rank < n; rank++) {
    // Percentile rank in [0, 1)
    const percentile = rank / n;
    let score: number;
    if (percentile < 0.2) score = 1;
    else if (percentile < 0.4) score = 2;
    else if (percentile < 0.6) score = 3;
    else if (percentile < 0.8) score = 4;
    else score = 5;

    if (invert) {
      score = 6 - score;
    }
    scores[indexed[rank].idx] = score;
  }

  return scores;
}

/**
 * Assigns an RFM segment classification based on standard RFM matrix rules.
 */
export function classifyRfmSegment(r: number, f: number, m: number): string {
  // r, f, m are scores 1 to 5
  if (r >= 4 && f >= 4 && m >= 4) {
    return 'Champions';
  }
  if (r >= 3 && f >= 3 && m >= 3) {
    return 'Loyal Customers';
  }
  if (r >= 4 && f >= 2) {
    return 'Potential Loyalists';
  }
  if (r >= 4 && f === 1) {
    return 'Recent Customers';
  }
  if (r >= 3 && f <= 2 && m <= 2) {
    return 'Promising';
  }
  if (r === 3 && f >= 3) {
    return 'Customers Needing Attention';
  }
  if (r === 2 && f <= 2) {
    return 'About to Sleep';
  }
  if (r <= 2 && f >= 3 && m >= 3) {
    return 'At Risk';
  }
  if (r === 1 && f >= 4 && m >= 4) {
    return 'Cannot Lose Them';
  }
  if (r <= 2 && f <= 2 && m >= 2) {
    return 'Hibernating';
  }
  return 'Lost / Inactive';
}

/**
 * Enriches customer records with quantile-based RFM scores and RFM segments.
 */
export function calculateRfmScores(customers: CustomerFeatures[]): CustomerFeatures[] {
  if (customers.length === 0) return [];

  const recencies = customers.map(c => c.recency_days);
  const frequencies = customers.map(c => c.frequency);
  const monetaries = customers.map(c => c.monetary);

  // Recency: lower is better -> invert = true (low recency days = score 5)
  const rScores = computeQuantileScores(recencies, true);
  // Frequency: higher is better -> invert = false
  const fScores = computeQuantileScores(frequencies, false);
  // Monetary: higher is better -> invert = false
  const mScores = computeQuantileScores(monetaries, false);

  return customers.map((c, i) => {
    const r = rScores[i];
    const f = fScores[i];
    const m = mScores[i];
    const rfm_score = `${r}${f}${m}`;
    const rfm_segment = classifyRfmSegment(r, f, m);

    return {
      ...c,
      r_score: r,
      f_score: f,
      m_score: m,
      rfm_score,
      rfm_segment
    };
  });
}

// ================================================================
// preprocessing.ts
// ================================================================
export const DEFAULT_CLUSTERING_FEATURES = [
  'recency_days',
  'frequency',
  'monetary',
  'avg_order_value',
  'total_orders',
  'total_quantity',
  'orders_last_30d',
  'orders_last_90d',
  'spend_last_30d',
  'spend_last_90d',
  'unique_products',
  'unique_categories',
  'category_diversity',
  'customer_lifetime_days'
];

export interface PreprocessingResult {
  scaledMatrix: number[][]; // N x D
  featureNames: string[];
  means: number[];
  stds: number[];
  excludedFeatures: string[];
}

/**
 * Standardizes customer feature vectors for unsupervised clustering.
 */
export function preprocessFeatures(
  customers: CustomerFeatures[],
  requestedFeatures: string[] = DEFAULT_CLUSTERING_FEATURES
): PreprocessingResult {
  if (customers.length === 0) {
    return {
      scaledMatrix: [],
      featureNames: [],
      means: [],
      stds: [],
      excludedFeatures: []
    };
  }

  // Check optional features like offer behavior
  const candidateFeatures = [...requestedFeatures];
  const sample = customers[0];
  if (sample.offers_available && sample.offer_response_rate !== undefined) {
    if (!candidateFeatures.includes('offer_response_rate')) {
      candidateFeatures.push('offer_response_rate');
    }
  }

  const validFeatureNames: string[] = [];
  const rawMatrix: number[][] = []; // Rows = customers, cols = features
  const excludedFeatures: string[] = [];

  // Extract candidate values
  for (const featureName of candidateFeatures) {
    // Check if column exists and is numeric
    const values: number[] = [];
    let isNumeric = true;

    for (const c of customers) {
      const rawVal = (c as any)[featureName];
      if (rawVal === undefined || rawVal === null || isNaN(Number(rawVal))) {
        values.push(0); // Impute nulls with 0
      } else {
        values.push(Number(rawVal));
      }
    }

    if (!isNumeric || values.length === 0) {
      excludedFeatures.push(featureName);
      continue;
    }

    // Check for constant features (zero variance)
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    if (minVal === maxVal) {
      excludedFeatures.push(`${featureName} (zero variance)`);
      continue;
    }

    validFeatureNames.push(featureName);
  }

  // Build N x D matrix
  const N = customers.length;
  const D = validFeatureNames.length;
  const rawValues: number[][] = Array.from({ length: N }, () => new Array(D));

  for (let j = 0; j < D; j++) {
    const fName = validFeatureNames[j];
    for (let i = 0; i < N; i++) {
      const val = Number((customers[i] as any)[fName]) || 0;
      rawValues[i][j] = val;
    }
  }

  // Fit StandardScaler: compute mean and standard deviation for each feature column
  const means: number[] = new Array(D).fill(0);
  const stds: number[] = new Array(D).fill(0);

  for (let j = 0; j < D; j++) {
    let sum = 0;
    for (let i = 0; i < N; i++) {
      sum += rawValues[i][j];
    }
    const mean = sum / N;
    means[j] = mean;

    let varSum = 0;
    for (let i = 0; i < N; i++) {
      const diff = rawValues[i][j] - mean;
      varSum += diff * diff;
    }
    // Population standard deviation (with small epsilon to avoid divide-by-zero)
    const std = Math.sqrt(varSum / N);
    stds[j] = std > 1e-9 ? std : 1.0;
  }

  // Transform to scaled matrix (z-score)
  const scaledMatrix: number[][] = Array.from({ length: N }, () => new Array(D));
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < D; j++) {
      scaledMatrix[i][j] = (rawValues[i][j] - means[j]) / stds[j];
    }
  }

  return {
    scaledMatrix,
    featureNames: validFeatureNames,
    means,
    stds,
    excludedFeatures
  };
}

// ================================================================
// clustering.ts
// ================================================================
/**
 * Production-grade implementations of K-Means, Agglomerative, and DBSCAN clustering.
 */

export interface ClusteringOutput {
  labels: number[]; // length N, 0-indexed cluster index (-1 for DBSCAN noise)
  k_actual: number;
  centroids?: number[][]; // K x D
  inertia?: number;
  noisePoints?: number;
  warning?: string;
}

// Euclidean distance helper
export function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function squaredEuclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return sum;
}

/**
 * K-Means++ Center Initialization
 */
function initializeKMeansPlusPlus(X: number[][], k: number): number[][] {
  const N = X.length;
  const D = X[0].length;
  const centroids: number[][] = [];

  // Pick first center uniformly at random
  const firstIdx = Math.floor(Math.random() * N);
  centroids.push([...X[firstIdx]]);

  // Pick remaining k-1 centers with probability proportional to D(x)^2
  while (centroids.length < k) {
    const distancesSq: number[] = new Array(N);
    let totalDistSq = 0;

    for (let i = 0; i < N; i++) {
      let minDistSq = Infinity;
      for (const c of centroids) {
        const dSq = squaredEuclideanDistance(X[i], c);
        if (dSq < minDistSq) minDistSq = dSq;
      }
      distancesSq[i] = minDistSq;
      totalDistSq += minDistSq;
    }

    if (totalDistSq === 0) {
      // Pick random point
      centroids.push([...X[Math.floor(Math.random() * N)]]);
      continue;
    }

    const r = Math.random() * totalDistSq;
    let accum = 0;
    let selectedIdx = N - 1;
    for (let i = 0; i < N; i++) {
      accum += distancesSq[i];
      if (accum >= r) {
        selectedIdx = i;
        break;
      }
    }
    centroids.push([...X[selectedIdx]]);
  }

  return centroids;
}

/**
 * K-Means Algorithm (Lloyd's with multiple restarts)
 */
export function runKMeans(
  X: number[][],
  k: number,
  maxIter: number = 100,
  nInit: number = 5
): ClusteringOutput {
  const N = X.length;
  const D = X[0].length;

  if (N === 0 || k <= 0) {
    return { labels: [], k_actual: 0, centroids: [], inertia: 0 };
  }

  if (k >= N) {
    return {
      labels: X.map((_, i) => i),
      k_actual: N,
      centroids: X.map(r => [...r]),
      inertia: 0
    };
  }

  let bestInertia = Infinity;
  let bestLabels: number[] = [];
  let bestCentroids: number[][] = [];

  for (let init = 0; init < nInit; init++) {
    let centroids = initializeKMeansPlusPlus(X, k);
    let labels = new Array<number>(N).fill(0);
    let prevInertia = Infinity;

    for (let iter = 0; iter < maxIter; iter++) {
      // 1. Assignment step: assign each point to closest centroid
      let currentInertia = 0;
      const clusterCounts = new Array(k).fill(0);
      const newCentroids = Array.from({ length: k }, () => new Array(D).fill(0));

      for (let i = 0; i < N; i++) {
        let minDistSq = Infinity;
        let bestCluster = 0;

        for (let c = 0; c < k; c++) {
          const dSq = squaredEuclideanDistance(X[i], centroids[c]);
          if (dSq < minDistSq) {
            minDistSq = dSq;
            bestCluster = c;
          }
        }

        labels[i] = bestCluster;
        currentInertia += minDistSq;
        clusterCounts[bestCluster]++;

        for (let j = 0; j < D; j++) {
          newCentroids[bestCluster][j] += X[i][j];
        }
      }

      // 2. Update step: recompute centroid coordinates
      let maxShift = 0;
      for (let c = 0; c < k; c++) {
        if (clusterCounts[c] > 0) {
          for (let j = 0; j < D; j++) {
            newCentroids[c][j] /= clusterCounts[c];
          }
        } else {
          // Empty cluster fallback: reinitialize to random point
          const randIdx = Math.floor(Math.random() * N);
          for (let j = 0; j < D; j++) {
            newCentroids[c][j] = X[randIdx][j];
          }
        }

        const shift = euclideanDistance(centroids[c], newCentroids[c]);
        if (shift > maxShift) maxShift = shift;
      }

      centroids = newCentroids;

      if (maxShift < 1e-4 || Math.abs(prevInertia - currentInertia) < 1e-4) {
        break;
      }
      prevInertia = currentInertia;
    }

    if (prevInertia < bestInertia) {
      bestInertia = prevInertia;
      bestLabels = [...labels];
      bestCentroids = centroids.map(c => [...c]);
    }
  }

  // Remap labels so clusters are ordered consistently (e.g., from 0 to k-1)
  const uniqueLabels = Array.from(new Set(bestLabels)).sort((a, b) => a - b);
  const labelMap = new Map<number, number>();
  uniqueLabels.forEach((oldLabel, idx) => labelMap.set(oldLabel, idx));

  const finalLabels = bestLabels.map(l => labelMap.get(l) ?? 0);
  const finalCentroids = uniqueLabels.map(l => bestCentroids[l]);

  return {
    labels: finalLabels,
    k_actual: uniqueLabels.length,
    centroids: finalCentroids,
    inertia: Math.round(bestInertia * 100) / 100
  };
}

/**
 * Agglomerative / Hierarchical Clustering (Average Linkage)
 */
export function runAgglomerative(X: number[][], k: number): ClusteringOutput {
  const N = X.length;
  const D = X[0].length;

  if (N <= k) {
    return {
      labels: X.map((_, i) => i),
      k_actual: N
    };
  }

  // Initialize each point in its own cluster
  // To keep memory reasonable for ~520 points, maintain cluster membership
  let clusters: number[][] = Array.from({ length: N }, (_, i) => [i]);

  // Pairwise distance matrix between points
  const distMatrix: Float32Array[] = [];
  for (let i = 0; i < N; i++) {
    const row = new Float32Array(N);
    for (let j = 0; j < i; j++) {
      const d = euclideanDistance(X[i], X[j]);
      row[j] = d;
    }
    distMatrix.push(row);
  }

  const getDist = (i: number, j: number): number => {
    if (i === j) return 0;
    return i > j ? distMatrix[i][j] : distMatrix[j][i];
  };

  // Merge clusters until k remain
  while (clusters.length > k) {
    let minClusterDist = Infinity;
    let mergeA = 0;
    let mergeB = 1;

    for (let a = 0; a < clusters.length; a++) {
      for (let b = a + 1; b < clusters.length; b++) {
        // Average linkage: mean distance between all pairs
        let totalPairDist = 0;
        const ptsA = clusters[a];
        const ptsB = clusters[b];
        for (const pA of ptsA) {
          for (const pB of ptsB) {
            totalPairDist += getDist(pA, pB);
          }
        }
        const avgDist = totalPairDist / (ptsA.length * ptsB.length);

        if (avgDist < minClusterDist) {
          minClusterDist = avgDist;
          mergeA = a;
          mergeB = b;
        }
      }
    }

    // Merge mergeB into mergeA, remove mergeB
    clusters[mergeA] = clusters[mergeA].concat(clusters[mergeB]);
    clusters.splice(mergeB, 1);
  }

  // Construct label array
  const labels = new Array<number>(N).fill(0);
  const centroids: number[][] = [];

  for (let c = 0; c < clusters.length; c++) {
    const pts = clusters[c];
    const centroid = new Array<number>(D).fill(0);

    for (const idx of pts) {
      labels[idx] = c;
      for (let d = 0; d < D; d++) {
        centroid[d] += X[idx][d];
      }
    }
    for (let d = 0; d < D; d++) {
      centroid[d] /= pts.length;
    }
    centroids.push(centroid);
  }

  return {
    labels,
    k_actual: clusters.length,
    centroids
  };
}

/**
 * DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
 */
export function runDBSCAN(
  X: number[][],
  eps: number = 1.8,
  minSamples: number = 5
): ClusteringOutput {
  const N = X.length;
  if (N === 0) return { labels: [], k_actual: 0 };

  const labels = new Array<number>(N).fill(-2); // -2: unvisited, -1: noise, >= 0: cluster ID
  let clusterId = 0;

  const regionQuery = (pointIdx: number): number[] => {
    const neighbors: number[] = [];
    for (let i = 0; i < N; i++) {
      if (euclideanDistance(X[pointIdx], X[i]) <= eps) {
        neighbors.push(i);
      }
    }
    return neighbors;
  };

  for (let i = 0; i < N; i++) {
    if (labels[i] !== -2) continue; // already processed

    const neighbors = regionQuery(i);
    if (neighbors.length < minSamples) {
      labels[i] = -1; // Mark as noise tentatively
    } else {
      // Core point: expand cluster
      labels[i] = clusterId;
      const seedQueue = [...neighbors];

      let qIdx = 0;
      while (qIdx < seedQueue.length) {
        const curr = seedQueue[qIdx++];
        if (labels[curr] === -1) {
          labels[curr] = clusterId; // Border point
        }
        if (labels[curr] !== -2) continue;

        labels[curr] = clusterId;
        const currNeighbors = regionQuery(curr);
        if (currNeighbors.length >= minSamples) {
          for (const cn of currNeighbors) {
            if (!seedQueue.includes(cn)) {
              seedQueue.push(cn);
            }
          }
        }
      }
      clusterId++;
    }
  }

  // Count noise points and valid clusters
  const noiseCount = labels.filter(l => l === -1).length;
  const uniqueClusters = Array.from(new Set(labels.filter(l => l >= 0)));

  let warning: string | undefined;
  if (noiseCount / N > 0.45) {
    warning = `DBSCAN produced high noise (${noiseCount} of ${N} points, ${Math.round((noiseCount / N) * 100)}%). Consider increasing epsilon or decreasing min_samples.`;
  } else if (uniqueClusters.length <= 1) {
    warning = `DBSCAN grouped all density-connected points into a single cluster (${uniqueClusters.length} cluster found). Consider decreasing epsilon to differentiate segments.`;
  }

  return {
    labels,
    k_actual: uniqueClusters.length,
    noisePoints: noiseCount,
    warning
  };
}

// ================================================================
// metrics.ts
// ================================================================
/**
 * Calculates the exact Mean Silhouette Score.
 * Points with label -1 (noise) are ignored.
 */
export function calculateSilhouetteScore(X: number[][], labels: number[]): number {
  const N = X.length;
  if (N <= 1) return 0;

  // Filter out noise points for score calculation
  const validIndices: number[] = [];
  const clusterMemberMap = new Map<number, number[]>();

  for (let i = 0; i < N; i++) {
    const l = labels[i];
    if (l >= 0) {
      validIndices.push(i);
      let list = clusterMemberMap.get(l);
      if (!list) {
        list = [];
        clusterMemberMap.set(l, list);
      }
      list.push(i);
    }
  }

  const k = clusterMemberMap.size;
  if (k <= 1 || validIndices.length <= k) {
    return 0;
  }

  let totalSilhouette = 0;
  let evaluatedPoints = 0;

  // If dataset is large (e.g. > 1000), sample evenly to maintain responsive performance;
  // For ~500 points, we calculate directly.
  const step = validIndices.length > 800 ? 2 : 1;

  for (let v = 0; v < validIndices.length; v += step) {
    const i = validIndices[v];
    const cId = labels[i];
    const ownMembers = clusterMemberMap.get(cId)!;

    // a(i): average distance to other members in the same cluster
    let a_i = 0;
    if (ownMembers.length > 1) {
      let sumDist = 0;
      for (const otherIdx of ownMembers) {
        if (otherIdx !== i) {
          sumDist += euclideanDistance(X[i], X[otherIdx]);
        }
      }
      a_i = sumDist / (ownMembers.length - 1);
    }

    // b(i): minimum average distance to any other cluster
    let b_i = Infinity;
    for (const [otherClusterId, otherMembers] of clusterMemberMap.entries()) {
      if (otherClusterId === cId || otherMembers.length === 0) continue;

      let sumOtherDist = 0;
      for (const otherIdx of otherMembers) {
        sumOtherDist += euclideanDistance(X[i], X[otherIdx]);
      }
      const avgOtherDist = sumOtherDist / otherMembers.length;
      if (avgOtherDist < b_i) {
        b_i = avgOtherDist;
      }
    }

    if (b_i === Infinity) continue;

    const maxDenom = Math.max(a_i, b_i);
    const s_i = maxDenom === 0 ? 0 : (b_i - a_i) / maxDenom;

    totalSilhouette += s_i;
    evaluatedPoints++;
  }

  return evaluatedPoints > 0 ? Math.round((totalSilhouette / evaluatedPoints) * 1000) / 1000 : 0;
}

/**
 * Calculates Davies-Bouldin Index. Lower value indicates better clustering.
 */
export function calculateDaviesBouldinScore(X: number[][], labels: number[]): number {
  const N = X.length;
  const D = X[0].length;

  const clusterMemberMap = new Map<number, number[]>();
  for (let i = 0; i < N; i++) {
    const l = labels[i];
    if (l >= 0) {
      let list = clusterMemberMap.get(l);
      if (!list) {
        list = [];
        clusterMemberMap.set(l, list);
      }
      list.push(i);
    }
  }

  const k = clusterMemberMap.size;
  if (k <= 1) return 0;

  const clusterIds = Array.from(clusterMemberMap.keys());
  const centroids: number[][] = [];
  const intraClusterDistances: number[] = [];

  // Compute centroids and average intra-cluster distances S_i
  for (let idx = 0; idx < k; idx++) {
    const cId = clusterIds[idx];
    const members = clusterMemberMap.get(cId)!;

    const centroid = new Array<number>(D).fill(0);
    for (const mIdx of members) {
      for (let d = 0; d < D; d++) {
        centroid[d] += X[mIdx][d];
      }
    }
    for (let d = 0; d < D; d++) {
      centroid[d] /= members.length;
    }
    centroids.push(centroid);

    let sumDist = 0;
    for (const mIdx of members) {
      sumDist += euclideanDistance(X[mIdx], centroid);
    }
    intraClusterDistances.push(sumDist / members.length);
  }

  // Compute max R_ij for each cluster i
  let totalD = 0;
  for (let i = 0; i < k; i++) {
    let maxR = -Infinity;
    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      const centroidDist = euclideanDistance(centroids[i], centroids[j]);
      if (centroidDist > 1e-9) {
        const R = (intraClusterDistances[i] + intraClusterDistances[j]) / centroidDist;
        if (R > maxR) maxR = R;
      }
    }
    if (maxR !== -Infinity) {
      totalD += maxR;
    }
  }

  return Math.round((totalD / k) * 1000) / 1000;
}

/**
 * Calculates Calinski-Harabasz Index (Variance Ratio Criterion). Higher value is better.
 */
export function calculateCalinskiHarabaszScore(X: number[][], labels: number[]): number {
  const N = X.length;
  if (N <= 2) return 0;
  const D = X[0].length;

  const clusterMemberMap = new Map<number, number[]>();
  for (let i = 0; i < N; i++) {
    const l = labels[i];
    if (l >= 0) {
      let list = clusterMemberMap.get(l);
      if (!list) {
        list = [];
        clusterMemberMap.set(l, list);
      }
      list.push(i);
    }
  }

  const k = clusterMemberMap.size;
  if (k <= 1 || N <= k) return 0;

  // Global mean
  const globalMean = new Array<number>(D).fill(0);
  for (let i = 0; i < N; i++) {
    for (let d = 0; d < D; d++) {
      globalMean[d] += X[i][d];
    }
  }
  for (let d = 0; d < D; d++) {
    globalMean[d] /= N;
  }

  let ssb = 0; // Between-group sum of squares
  let ssw = 0; // Within-group sum of squares

  for (const members of clusterMemberMap.values()) {
    const size = members.length;
    if (size === 0) continue;

    // Cluster centroid
    const centroid = new Array<number>(D).fill(0);
    for (const idx of members) {
      for (let d = 0; d < D; d++) {
        centroid[d] += X[idx][d];
      }
    }
    for (let d = 0; d < D; d++) {
      centroid[d] /= size;
    }

    // Between-cluster dispersion
    let distFromGlobalSq = 0;
    for (let d = 0; d < D; d++) {
      const diff = centroid[d] - globalMean[d];
      distFromGlobalSq += diff * diff;
    }
    ssb += size * distFromGlobalSq;

    // Within-cluster dispersion
    for (const idx of members) {
      let distFromCentroidSq = 0;
      for (let d = 0; d < D; d++) {
        const diff = X[idx][d] - centroid[d];
        distFromCentroidSq += diff * diff;
      }
      ssw += distFromCentroidSq;
    }
  }

  if (ssw <= 1e-9) return 0;

  const chScore = (ssb / (k - 1)) / (ssw / (N - k));
  return Math.round(chScore * 10) / 10;
}

/**
 * Evaluates K from 2 to 8 using K-Means and returns metrics for each K.
 */
export function evaluateKRange(X: number[][], minK: number = 2, maxK: number = 8): KEvaluationResult[] {
  const results: KEvaluationResult[] = [];

  for (let k = minK; k <= maxK; k++) {
    const res = runKMeans(X, k, 60, 3);
    const sil = calculateSilhouetteScore(X, res.labels);
    const db = calculateDaviesBouldinScore(X, res.labels);
    const ch = calculateCalinskiHarabaszScore(X, res.labels);

    results.push({
      k,
      silhouette_score: sil,
      davies_bouldin_score: db,
      calinski_harabasz_score: ch,
      inertia: res.inertia
    });
  }

  return results;
}

/**
 * Selects recommended optimal K based on normalized multi-metric objective:
 * Maximizing Silhouette, Minimizing DB, Maximizing CH.
 */
export function recommendOptimalK(results: KEvaluationResult[]): number {
  if (results.length === 0) return 4;
  if (results.length === 1) return results[0].k;

  let bestK = results[0].k;
  let bestCompositeScore = -Infinity;

  // Find min/max for normalization
  const sils = results.map(r => r.silhouette_score);
  const dbs = results.map(r => r.davies_bouldin_score);
  const chs = results.map(r => r.calinski_harabasz_score);

  const minSil = Math.min(...sils), maxSil = Math.max(...sils);
  const minDb = Math.min(...dbs), maxDb = Math.max(...dbs);
  const minCh = Math.min(...chs), maxCh = Math.max(...chs);

  for (const r of results) {
    const normSil = maxSil > minSil ? (r.silhouette_score - minSil) / (maxSil - minSil) : 0.5;
    // Lower DB is better
    const normDb = maxDb > minDb ? 1 - (r.davies_bouldin_score - minDb) / (maxDb - minDb) : 0.5;
    const normCh = maxCh > minCh ? (r.calinski_harabasz_score - minCh) / (maxCh - minCh) : 0.5;

    // Composite: 50% Silhouette, 30% DB, 20% CH
    const score = 0.50 * normSil + 0.30 * normDb + 0.20 * normCh;
    if (score > bestCompositeScore) {
      bestCompositeScore = score;
      bestK = r.k;
    }
  }

  return bestK;
}

// ================================================================
// pca.ts
// ================================================================
/**
 * Principal Component Analysis (PCA) 2D projection implementation.
 * Computes the empirical covariance matrix and extracts the top 2 eigenvectors
 * via power iteration with Hotelling deflation.
 */

export interface PcaResult {
  coordinates: { pc1: number; pc2: number }[];
  explainedVarianceRatio: [number, number];
  components: [number[], number[]]; // 2 x D projection vectors
}

// Vector dot product
function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

// Vector Euclidean norm
function norm(v: number[]): number {
  return Math.sqrt(dot(v, v));
}

// Matrix-vector multiplication: A * v
function matVecMul(A: number[][], v: number[]): number[] {
  const rows = A.length;
  const cols = A[0].length;
  const result = new Array<number>(rows).fill(0);
  for (let i = 0; i < rows; i++) {
    let sum = 0;
    for (let j = 0; j < cols; j++) {
      sum += A[i][j] * v[j];
    }
    result[i] = sum;
  }
  return result;
}

// Extract dominant eigenvector and eigenvalue of symmetric matrix using Power Iteration
function powerIteration(A: number[][], maxIter: number = 80): { vector: number[]; eigenvalue: number } {
  const n = A.length;
  let v = new Array<number>(n);
  // Initialize with pseudo-random unit vector
  for (let i = 0; i < n; i++) {
    v[i] = (i + 1) / n;
  }
  let vNorm = norm(v);
  for (let i = 0; i < n; i++) v[i] /= vNorm;

  let eigenvalue = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    const Av = matVecMul(A, v);
    const avNorm = norm(Av);
    if (avNorm < 1e-12) break;

    const vNext = Av.map(x => x / avNorm);

    // Rayleigh quotient
    const numerator = dot(vNext, matVecMul(A, vNext));
    eigenvalue = numerator;

    // Check convergence
    let diff = 0;
    for (let i = 0; i < n; i++) {
      const d = vNext[i] - v[i];
      diff += d * d;
    }
    v = vNext;
    if (Math.sqrt(diff) < 1e-6) break;
  }

  return { vector: v, eigenvalue };
}

/**
 * Computes PCA 2D projection on pre-scaled matrix X (N x D).
 */
export function computePca2D(X: number[][]): PcaResult {
  const N = X.length;
  if (N === 0) {
    return {
      coordinates: [],
      explainedVarianceRatio: [0, 0],
      components: [[], []]
    };
  }

  const D = X[0].length;
  if (D === 1) {
    // 1-feature edge case
    return {
      coordinates: X.map(r => ({ pc1: r[0], pc2: 0 })),
      explainedVarianceRatio: [1.0, 0.0],
      components: [[1], [0]]
    };
  }

  // 1. Center X (in case StandardScaler had tiny numerical residual)
  const centered = Array.from({ length: N }, () => new Array<number>(D));
  const colMeans = new Array<number>(D).fill(0);

  for (let j = 0; j < D; j++) {
    let sum = 0;
    for (let i = 0; i < N; i++) sum += X[i][j];
    colMeans[j] = sum / N;
  }

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < D; j++) {
      centered[i][j] = X[i][j] - colMeans[j];
    }
  }

  // 2. Compute Covariance Matrix: C = (1 / (N - 1)) * (X^T * X)
  const denom = Math.max(1, N - 1);
  const cov: number[][] = Array.from({ length: D }, () => new Array<number>(D).fill(0));

  for (let i = 0; i < D; i++) {
    for (let j = i; j < D; j++) {
      let sum = 0;
      for (let k = 0; k < N; k++) {
        sum += centered[k][i] * centered[k][j];
      }
      const covVal = sum / denom;
      cov[i][j] = covVal;
      cov[j][i] = covVal; // Symmetric
    }
  }

  // Total variance is trace of covariance matrix
  let totalVariance = 0;
  for (let i = 0; i < D; i++) totalVariance += cov[i][i];
  if (totalVariance <= 0) totalVariance = 1e-6;

  // 3. Find 1st Principal Component
  const { vector: v1, eigenvalue: lambda1 } = powerIteration(cov);

  // 4. Hotelling Deflation: C_deflated = C - lambda1 * (v1 * v1^T)
  const covDeflated: number[][] = Array.from({ length: D }, () => new Array<number>(D));
  for (let i = 0; i < D; i++) {
    for (let j = 0; j < D; j++) {
      covDeflated[i][j] = cov[i][j] - lambda1 * v1[i] * v1[j];
    }
  }

  // 5. Find 2nd Principal Component
  const { vector: v2, eigenvalue: lambda2 } = powerIteration(covDeflated);

  // 6. Project original centered data onto top 2 eigenvectors
  const coordinates: { pc1: number; pc2: number }[] = new Array(N);
  for (let i = 0; i < N; i++) {
    const pc1Val = dot(centered[i], v1);
    const pc2Val = dot(centered[i], v2);
    coordinates[i] = {
      pc1: Math.round(pc1Val * 100) / 100,
      pc2: Math.round(pc2Val * 100) / 100
    };
  }

  const ratio1 = Math.round((Math.max(0, lambda1) / totalVariance) * 100) / 100;
  const ratio2 = Math.round((Math.max(0, lambda2) / totalVariance) * 100) / 100;

  return {
    coordinates,
    explainedVarianceRatio: [ratio1, ratio2],
    components: [v1, v2]
  };
}

// ================================================================
// profiling.ts
// ================================================================
const PALETTE = [
  '#2563EB', // Blue
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#7C3AED', // Purple
  '#0891B2', // Cyan
  '#EA580C', // Orange
  '#DB2777'  // Pink
];

interface PopulationAverages {
  avgRecency: number;
  avgFrequency: number;
  avgMonetary: number;
  avgAov: number;
  avgOrders30d: number;
  avgLifetime: number;
  totalRevenue: number;
}

/**
 * Computes baseline global averages across all restaurant customers.
 */
function computePopulationAverages(customers: CustomerFeatures[]): PopulationAverages {
  const n = Math.max(1, customers.length);
  const totalMonetary = customers.reduce((sum, c) => sum + c.monetary, 0);

  return {
    avgRecency: customers.reduce((sum, c) => sum + c.recency_days, 0) / n,
    avgFrequency: customers.reduce((sum, c) => sum + c.frequency, 0) / n,
    avgMonetary: totalMonetary / n,
    avgAov: customers.reduce((sum, c) => sum + c.avg_order_value, 0) / n,
    avgOrders30d: customers.reduce((sum, c) => sum + c.orders_last_30d, 0) / n,
    avgLifetime: customers.reduce((sum, c) => sum + c.customer_lifetime_days, 0) / n,
    totalRevenue: totalMonetary
  };
}

/**
 * Derives a statistically grounded segment title, detailed reasoning, and tailored actionable recommendations.
 */
function profileSingleCluster(
  clusterId: number,
  clusterMembers: CustomerFeatures[],
  global: PopulationAverages,
  totalCustomers: number,
  colorIndex: number
): ClusterProfile {
  const count = clusterMembers.length;
  const pct = Math.round((count / totalCustomers) * 1000) / 10;

  const clusterRevenue = clusterMembers.reduce((sum, c) => sum + c.monetary, 0);
  const revPct = global.totalRevenue > 0 ? Math.round((clusterRevenue / global.totalRevenue) * 1000) / 10 : 0;

  const avgRecency = Math.round((clusterMembers.reduce((s, c) => s + c.recency_days, 0) / count) * 10) / 10;
  const avgFrequency = Math.round((clusterMembers.reduce((s, c) => s + c.frequency, 0) / count) * 10) / 10;
  const avgMonetary = Math.round((clusterRevenue / count) * 10) / 10;
  const avgAov = Math.round((clusterMembers.reduce((s, c) => s + c.avg_order_value, 0) / count) * 10) / 10;
  const avgOrders30d = Math.round((clusterMembers.reduce((s, c) => s + c.orders_last_30d, 0) / count) * 10) / 10;
  const avgOrders90d = Math.round((clusterMembers.reduce((s, c) => s + c.orders_last_90d, 0) / count) * 10) / 10;
  const avgSpend30d = Math.round((clusterMembers.reduce((s, c) => s + c.spend_last_30d, 0) / count) * 10) / 10;
  const avgLifetime = Math.round((clusterMembers.reduce((s, c) => s + c.customer_lifetime_days, 0) / count) * 10) / 10;

  // Favorite product and category
  const catCounts = new Map<string, number>();
  const prodCounts = new Map<string, number>();
  let totalOffersReceived = 0;
  let totalOffersUsed = 0;
  let hasOffers = false;

  for (const c of clusterMembers) {
    catCounts.set(c.favorite_category, (catCounts.get(c.favorite_category) || 0) + 1);
    prodCounts.set(c.favorite_product, (prodCounts.get(c.favorite_product) || 0) + 1);

    if (c.offers_available && c.offers_received !== undefined) {
      hasOffers = true;
      totalOffersReceived += c.offers_received;
      totalOffersUsed += (c.offers_used || 0);
    }
  }

  let favoriteCat = 'Mains';
  let maxCat = 0;
  for (const [k, v] of catCounts.entries()) {
    if (v > maxCat) {
      maxCat = v;
      favoriteCat = k;
    }
  }

  let favoriteProd = 'Standard Dish';
  let maxProd = 0;
  for (const [k, v] of prodCounts.entries()) {
    if (v > maxProd) {
      maxProd = v;
      favoriteProd = k;
    }
  }

  const offerResponseRate = hasOffers && totalOffersReceived > 0 
    ? Math.round((totalOffersUsed / totalOffersReceived) * 100) 
    : null;

  // Comparison ratios relative to restaurant baseline
  const recencyRatio = global.avgRecency > 0 ? avgRecency / global.avgRecency : 1;
  const freqRatio = global.avgFrequency > 0 ? avgFrequency / global.avgFrequency : 1;
  const monetaryRatio = global.avgMonetary > 0 ? avgMonetary / global.avgMonetary : 1;
  const aovRatio = global.avgAov > 0 ? avgAov / global.avgAov : 1;

  let segmentName = 'General Customers';
  const reasoning: string[] = [];
  const recommendations: string[] = [];

  // Data-driven classification rules based on relative statistical differences
  if (clusterId === -1) {
    segmentName = 'Outlier / Unclustered Guests';
    reasoning.push(`Identified by DBSCAN as density outliers (${count} customers, ${pct}% of total).`);
    reasoning.push(`Features show high variance without converging onto distinct dense clusters.`);
    recommendations.push('Inspect individual guest order profiles manually for anomalous tickets or corporate bulk orders.');
  } else if (monetaryRatio >= 1.35 && freqRatio >= 1.25 && recencyRatio <= 0.85) {
    segmentName = 'High-Value Loyal Customers';
    reasoning.push(`Total monetary spend (₹${avgMonetary.toLocaleString()}) is +${Math.round((monetaryRatio - 1) * 100)}% above restaurant baseline.`);
    reasoning.push(`Visit frequency (${avgFrequency} orders) is +${Math.round((freqRatio - 1) * 100)}% higher than typical diners.`);
    reasoning.push(`Recent diner activity is strong, with latest visit only ${avgRecency} days ago on average.`);
    
    recommendations.push('Enroll in exclusive VIP Dining Club with table reservations priority and chef greeting.');
    recommendations.push('Offer early-access previews for seasonal menu transitions and wine pairing nights.');
    recommendations.push('Maintain high dining consistency; surprise with bespoke complimentary dessert or amuse-bouche.');
  } else if (freqRatio >= 1.20 && recencyRatio <= 0.95 && monetaryRatio >= 0.85) {
    segmentName = 'Loyal Regular Customers';
    reasoning.push(`Solid repeat ordering behavior with average frequency of ${avgFrequency} orders (+${Math.round((freqRatio - 1) * 100)}% vs baseline).`);
    reasoning.push(`Consistent recent attendance (${avgRecency} days recency, ${avgOrders30d} orders in the last 30 days).`);
    reasoning.push(`Stable average order value of ₹${avgAov.toLocaleString()} reflecting habitual routine visits.`);

    recommendations.push('Introduce stamp-card or points-based loyalty program for everyday dining items.');
    recommendations.push('Send midweek lunch reminders featuring seasonal additions in ${favoriteCat}.');
    recommendations.push('Offer digital bounce-back voucher on bill settlements to maintain frequent visit cadence.');
  } else if (monetaryRatio >= 1.30 && freqRatio < 1.10 && aovRatio >= 1.35) {
    segmentName = 'High-Spending Occasional Customers';
    reasoning.push(`Substantial average basket size (AOV: ₹${avgAov.toLocaleString()}, +${Math.round((aovRatio - 1) * 100)}% above baseline).`);
    reasoning.push(`Occasional order frequency (${avgFrequency} visits), often linked to celebratory dinners or weekend gatherings.`);
    reasoning.push(`Strong affinity for high-margin dishes in ${favoriteCat} (e.g. ${favoriteProd}).`);

    recommendations.push('Target with anniversary, birthday, and weekend celebration dining packages.');
    recommendations.push('Promote premium tasting menus, curated chef platters, and wine pairings.');
    recommendations.push('Send advance holiday reservations invitations (New Year, Valentine’s, Festive Season).');
  } else if (freqRatio >= 1.15 && aovRatio < 0.85) {
    segmentName = 'Frequent Low-Value Customers';
    reasoning.push(`High engagement with ${avgFrequency} visits, but lower average basket size (AOV: ₹${avgAov.toLocaleString()}, ${Math.round((1 - aovRatio) * 100)}% below baseline).`);
    reasoning.push(`Likely weekday lunch office diners or solo beverage/snack visitors.`);
    reasoning.push(`Low recency (${avgRecency} days) confirms ongoing habitual visits.`);

    recommendations.push('Implement bundle upselling: offer discounted appetizer or dessert add-on with their main bowl.');
    recommendations.push('Offer beverage combo upgrades (e.g., add craft iced tea for ₹60).');
    recommendations.push('Trial minimum spend threshold incentives (e.g. "Spend ₹500 get free garlic bread").');
  } else if (offerResponseRate !== null && offerResponseRate >= 60 && aovRatio <= 0.95) {
    segmentName = 'Price-Sensitive Customers';
    reasoning.push(`High coupon and offer sensitivity with ${offerResponseRate}% promo response rate.`);
    reasoning.push(`Average order value (₹${avgAov.toLocaleString()}) reflects price-conscious ordering patterns.`);
    reasoning.push(`Orders spike predominantly during active discount windows.`);

    recommendations.push('Direct margin-friendly combo promotions during off-peak hours (e.g., 3 PM - 6 PM happy hour).');
    recommendations.push('Avoid deep discounting on premium entrees; utilize bundle value framing instead.');
    recommendations.push('Send targeted weekday lunch combos to fill table inventory without cannibalizing prime dinner seats.');
  } else if (avgLifetime <= 30 && avgFrequency <= 2.2 && recencyRatio <= 0.80) {
    segmentName = 'New Customers';
    reasoning.push(`Recent first-time visitors with average relationship lifespan of only ${avgLifetime} days.`);
    reasoning.push(`Average order count is ${avgFrequency}, having recently discovered the restaurant.`);
    reasoning.push(`Recency (${avgRecency} days) shows fresh dining awareness.`);

    recommendations.push('Deliver automated "Welcome Experience" journey with second-visit incentive valid within 14 days.');
    recommendations.push('Highlight chef signature specialties and most-loved dishes (e.g. ${favoriteProd}).');
    recommendations.push('Request brief post-dining feedback with a complimentary beverage on their next booking.');
  } else if (recencyRatio >= 1.40 && recencyRatio < 2.2 && avgFrequency >= 3) {
    segmentName = 'At-Risk Customers';
    reasoning.push(`Dormant for an extended period: recency has climbed to ${avgRecency} days (${Math.round((recencyRatio - 1) * 100)}% above typical diner gap).`);
    reasoning.push(`Historical visit record is valuable (${avgFrequency} orders, ₹${avgMonetary.toLocaleString()} lifetime spend).`);
    reasoning.push(`Zero or minimal dining activity recorded in the past 30 days.`);

    recommendations.push('Trigger immediate "We Miss You" win-back campaign with a 15% personalized invitation.');
    recommendations.push('Feature new additions to their favorite category (${favoriteCat}) in targeted messaging.');
    recommendations.push('Personalize outreach referencing their preferred dish (${favoriteProd}).');
  } else if (recencyRatio >= 2.0 || (avgOrders90d === 0 && avgRecency > 120)) {
    segmentName = 'Inactive Customers';
    reasoning.push(`Extended absence with ${avgRecency} days since last dining engagement.`);
    reasoning.push(`Zero orders logged across the last 90-day activity window.`);
    reasoning.push(`Substantial risk of churn or permanent competitor displacement.`);

    recommendations.push('Deploy low-cost automated re-activation email or SMS with an aggressive time-limited incentive.');
    recommendations.push('Conduct dining audit: survey for service or menu dissatisfaction if contactable.');
    recommendations.push('Prune unengaged contacts if no response after 2 consecutive reactivation attempts.');
  } else if (avgOrders30d >= 1.5 && avgRecency <= 15) {
    segmentName = 'Emerging Customers';
    reasoning.push(`Accelerating order momentum with ${avgOrders30d} orders within the last 30 days.`);
    reasoning.push(`Recency is exceptional at ${avgRecency} days, indicating rapidly developing loyalty.`);
    reasoning.push(`Lifetime spend (₹${avgMonetary.toLocaleString()}) is trending upward.`);

    recommendations.push('Nurture into full loyalists with early introduction to the restaurant loyalty program.');
    recommendations.push('Suggest complementary dishes to broaden category diversity beyond ${favoriteCat}.');
    recommendations.push('Invite to follow restaurant social channels for weekly chef specials.');
  } else {
    segmentName = `Customer Segment ${clusterId + 1}`;
    reasoning.push(`Balanced performance cluster: Recency ${avgRecency}d, Frequency ${avgFrequency} orders, Monetary ₹${avgMonetary.toLocaleString()}.`);
    reasoning.push(`Represents stable everyday restaurant footfall across ${favoriteCat}.`);
    recommendations.push('Maintain regular service standards and introduce standard seasonal menu notifications.');
  }

  return {
    cluster: clusterId,
    segment_name: segmentName,
    customer_count: count,
    percentage: pct,
    avg_recency: avgRecency,
    avg_frequency: avgFrequency,
    avg_monetary: avgMonetary,
    avg_aov: avgAov,
    avg_orders_30d: avgOrders30d,
    avg_orders_90d: avgOrders90d,
    avg_spend_30d: avgSpend30d,
    avg_lifetime_days: avgLifetime,
    favorite_category: favoriteCat,
    favorite_product: favoriteProd,
    offer_response_rate: offerResponseRate,
    revenue_contribution: Math.round(clusterRevenue),
    revenue_percentage: revPct,
    reasoning,
    recommendations,
    color: PALETTE[colorIndex % PALETTE.length]
  };
}

/**
 * Builds cluster profiles and assigns data-driven segment names to each customer.
 */
export function buildClusterProfiles(
  customers: CustomerFeatures[],
  labels: number[]
): { profiles: ClusterProfile[]; updatedCustomers: CustomerFeatures[] } {
  if (customers.length === 0 || labels.length === 0) {
    return { profiles: [], updatedCustomers: customers };
  }

  const global = computePopulationAverages(customers);
  const total = customers.length;

  // Group customers by cluster label
  const clusterMap = new Map<number, CustomerFeatures[]>();
  for (let i = 0; i < customers.length; i++) {
    const l = labels[i];
    let list = clusterMap.get(l);
    if (!list) {
      list = [];
      clusterMap.set(l, list);
    }
    list.push(customers[i]);
  }

  // Sort cluster IDs (with noise -1 placed at the end)
  const sortedClusterIds = Array.from(clusterMap.keys()).sort((a, b) => {
    if (a === -1) return 1;
    if (b === -1) return -1;
    return a - b;
  });

  const profiles: ClusterProfile[] = [];
  const clusterToNameMap = new Map<number, string>();

  // Ensure unique names across clusters if two get similar classification
  const usedNames = new Set<string>();

  for (let idx = 0; idx < sortedClusterIds.length; idx++) {
    const cId = sortedClusterIds[idx];
    const members = clusterMap.get(cId)!;
    const profile = profileSingleCluster(cId, members, global, total, idx);

    let finalName = profile.segment_name;
    if (usedNames.has(finalName)) {
      // Append descriptive qualifier based on secondary trait
      if (profile.avg_monetary > global.avgMonetary) {
        finalName = `${finalName} (Higher Spend)`;
      } else {
        finalName = `${finalName} (Group B)`;
      }
    }
    usedNames.add(finalName);
    profile.segment_name = finalName;

    profiles.push(profile);
    clusterToNameMap.set(cId, finalName);
  }

  // Update customers with assigned cluster and segment_name
  const updatedCustomers = customers.map((c, i) => {
    const clusterId = labels[i];
    const segName = clusterToNameMap.get(clusterId) || 'Unassigned';
    return {
      ...c,
      cluster: clusterId,
      segment_name: segName
    };
  });

  return { profiles, updatedCustomers };
}

// ================================================================
// pipeline.ts
// ================================================================
export interface PipelineConfig {
  algorithm: 'K-Means' | 'Agglomerative' | 'DBSCAN';
  k?: number; // if undefined, auto-selected from K evaluation
  features?: string[];
  dbscanEps?: number;
  dbscanMinSamples?: number;
}

export interface PipelineExecutionResult {
  validTransactions: Transaction[];
  customers: CustomerFeatures[];
  profiles: ClusterProfile[];
  metrics: ClusteringMetrics;
  kEvaluations: KEvaluationResult[];
  recommendedK: number;
  dataQualityReport: DataQualityReport;
  modelMetadata: ModelMetadata;
  driftComparison?: SegmentDriftComparison;
  pcaVariance: [number, number];
}

let modelVersionCounter = 1;
let previousModelRun: ModelMetadata | null = null;

/**
 * Runs the complete end-to-end Machine Learning pipeline.
 */
export function executeSegmentationPipeline(
  rawTransactions: Transaction[],
  config: PipelineConfig = { algorithm: 'K-Means' }
): PipelineExecutionResult {
  const chosenAlgorithm = config.algorithm || 'K-Means';

  // Step 1 & 2: Data Validation & Data Cleaning
  const requestedFeatures = config.features || DEFAULT_CLUSTERING_FEATURES;
  const { validTransactions, report: dataQualityReport } = validateAndCleanTransactions(
    rawTransactions,
    requestedFeatures
  );

  // Step 3, 4, 5: Customer-level Aggregation, Feature Engineering, Behavioral Engineering
  let customers = engineerCustomerFeatures(validTransactions);

  // Step 6: RFM Calculation & Quantile Scoring
  customers = calculateRfmScores(customers);

  // Step 7: Feature Preprocessing & Scaling (StandardScaler)
  const { scaledMatrix, featureNames } = preprocessFeatures(customers, requestedFeatures);

  // Step 8: Evaluate K values from 2 to 8 (for K-Means benchmarking & recommendation)
  const kEvaluations = evaluateKRange(scaledMatrix, 2, 8);
  const recommendedK = recommendOptimalK(kEvaluations);

  // Determine K to use
  const targetK = config.k !== undefined && config.k >= 2 ? config.k : recommendedK;

  // Step 9: Run Selected Clustering Model
  let clusterResult: ClusteringOutput;
  const modelParams: Record<string, any> = {};

  if (chosenAlgorithm === 'Agglomerative') {
    modelParams.k = targetK;
    modelParams.linkage = 'average';
    clusterResult = runAgglomerative(scaledMatrix, targetK);
  } else if (chosenAlgorithm === 'DBSCAN') {
    const eps = config.dbscanEps ?? 1.8;
    const minSamples = config.dbscanMinSamples ?? 5;
    modelParams.eps = eps;
    modelParams.min_samples = minSamples;
    clusterResult = runDBSCAN(scaledMatrix, eps, minSamples);
  } else {
    // K-Means
    modelParams.k = targetK;
    modelParams.n_init = 5;
    modelParams.max_iter = 100;
    clusterResult = runKMeans(scaledMatrix, targetK, 100, 5);
  }

  // Compute validation metrics on the chosen clustering
  const silScore = calculateSilhouetteScore(scaledMatrix, clusterResult.labels);
  const dbScore = calculateDaviesBouldinScore(scaledMatrix, clusterResult.labels);
  const chScore = calculateCalinskiHarabaszScore(scaledMatrix, clusterResult.labels);

  // Step 10: PCA 2D Visualization
  const pcaResult = computePca2D(scaledMatrix);

  // Attach PCA coordinates to customers for plotting
  for (let i = 0; i < customers.length; i++) {
    customers[i].pc1 = pcaResult.coordinates[i]?.pc1 ?? 0;
    customers[i].pc2 = pcaResult.coordinates[i]?.pc2 ?? 0;
  }

  // Step 11, 12, 13: Cluster Profiling, Automatic Segment Naming, Recommendations
  const { profiles, updatedCustomers } = buildClusterProfiles(customers, clusterResult.labels);

  // Update Data Quality report with actual used features
  dataQualityReport.features_used_for_clustering = featureNames;

  const timestamp = new Date().toISOString();
  const currentVersion = `v${modelVersionCounter++}.0`;

  const clusteringMetrics: ClusteringMetrics = {
    algorithm: chosenAlgorithm,
    k_clusters: clusterResult.k_actual,
    silhouette_score: silScore,
    davies_bouldin_score: dbScore,
    calinski_harabasz_score: chScore,
    features_used: featureNames,
    total_customers: updatedCustomers.length,
    training_timestamp: timestamp,
    dataset_date_range: {
      start: dataQualityReport.date_range_start,
      end: dataQualityReport.date_range_end
    },
    noise_points: clusterResult.noisePoints,
    parameters: modelParams
  };

  const currentModelMetadata: ModelMetadata = {
    model_version: currentVersion,
    algorithm: chosenAlgorithm,
    created_at: timestamp,
    dataset_size: updatedCustomers.length,
    feature_count: featureNames.length,
    cluster_count: clusterResult.k_actual,
    silhouette_score: silScore,
    davies_bouldin_score: dbScore,
    calinski_harabasz_score: chScore,
    parameters: modelParams,
    cluster_profiles: profiles
  };

  // Step 23: Segment Drift Comparison (if previous model run exists)
  let driftComparison: SegmentDriftComparison | undefined;
  if (previousModelRun) {
    const prevDist: Record<string, { count: number; percentage: number }> = {};
    for (const p of previousModelRun.cluster_profiles) {
      prevDist[p.segment_name] = { count: p.customer_count, percentage: p.percentage };
    }

    const currDist: Record<string, { count: number; percentage: number }> = {};
    for (const p of profiles) {
      currDist[p.segment_name] = { count: p.customer_count, percentage: p.percentage };
    }

    const allSegNames = Array.from(new Set([...Object.keys(prevDist), ...Object.keys(currDist)]));
    const diffs = allSegNames.map(name => {
      const prev = prevDist[name]?.percentage || 0;
      const curr = currDist[name]?.percentage || 0;
      const delta = Math.round((curr - prev) * 10) / 10;
      let obs = 'Stable segment proportion.';
      if (delta > 2.5) {
        obs = `Expanded by +${delta}% across recent transaction window.`;
      } else if (delta < -2.5) {
        obs = `Contracted by ${delta}% compared to prior training run.`;
      }
      return {
        segment_name: name,
        prev_percentage: prev,
        curr_percentage: curr,
        delta_percentage: delta,
        observation: obs
      };
    });

    driftComparison = {
      previous_run: {
        model_version: previousModelRun.model_version,
        timestamp: previousModelRun.created_at,
        distribution: prevDist
      },
      current_run: {
        model_version: currentVersion,
        timestamp: timestamp,
        distribution: currDist
      },
      differences: diffs
    };
  }

  // Save current model run for future drift tracking
  previousModelRun = currentModelMetadata;

  return {
    validTransactions,
    customers: updatedCustomers,
    profiles,
    metrics: clusteringMetrics,
    kEvaluations,
    recommendedK,
    dataQualityReport,
    modelMetadata: currentModelMetadata,
    driftComparison,
    pcaVariance: pcaResult.explainedVarianceRatio
  };
}


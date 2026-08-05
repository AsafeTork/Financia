export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  method: string;
  category: string;
  items?: string;
  registered_by?: string;
  updated_at: string;
  _synced: number;
  _deleted: number;
  _updated_at?: string;
  _version?: number;
  _conflict?: number;
  _field_versions?: Record<string, number>;
  created_at?: string;
}

export interface TransactionInput {
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  method: string;
  category: string;
  items?: string;
}

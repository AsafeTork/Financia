export interface Product {
  id: string;
  user_id: string;
  name: string;
  category: string;
  price: number;
  cost?: number;
  stock: number;
  registered_by?: string;
  updated_at: string;
  _synced: number;
  _deleted: number;
  _updated_at?: string;
  _version?: number;
  created_at?: string;
}

export interface ProductInput {
  name: string;
  category: string;
  price: number;
  cost?: number;
  stock: number;
}

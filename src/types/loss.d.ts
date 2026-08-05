export interface Loss {
  id: string;
  user_id: string;
  description: string;
  qty: number;
  reason: string;
  date: string;
  registered_by?: string;
  updated_at: string;
  _synced: number;
  _deleted: number;
  _updated_at?: string;
  _version?: number;
  created_at?: string;
}

export interface LossInput {
  description: string;
  qty: number;
  reason: string;
  date: string;
}

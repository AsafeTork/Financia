export interface Profile {
  user_id: string;
  name?: string;
  logo?: string;
  color?: string;
  color_secondary?: string;
  color_accent?: string;
  theme?: string;
  logo_url?: string;
  white_label?: boolean;
  phone?: string;
  niche?: string;
  custom_palette?: boolean;
  visual_version?: string;
  brand_config?: string | Record<string, unknown>;
  plan?: string;
  plan_expires_at?: string;
  plan_activated_by?: string;
  segment?: string;
  updated_at: string;
  _synced: number;
  _updated_at?: string;
  created_at?: string;
}

export interface ProfileInput {
  name?: string;
  logo?: string;
  color?: string;
  color_secondary?: string;
  color_accent?: string;
  theme?: string;
  logo_url?: string;
  white_label?: boolean;
  phone?: string;
  niche?: string;
  custom_palette?: boolean;
  visual_version?: string;
  brand_config?: string | Record<string, unknown>;
}

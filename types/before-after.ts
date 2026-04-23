import type { Database } from './supabase';

export type BeforeAfterRow = Database['public']['Tables']['before_after']['Row'];
export type BeforeAfterInsert = Database['public']['Tables']['before_after']['Insert'];
export type BeforeAfterUpdate = Database['public']['Tables']['before_after']['Update'];

export interface BeforeAfterItem {
  id: string;
  titulo: string;
  imagem_antes: string;
  imagem_depois: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

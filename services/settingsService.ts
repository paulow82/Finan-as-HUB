
import { supabase } from '../lib/supabaseClient';
import { AppSettings } from '../types';

export interface UserPreferences {
  settings: AppSettings;
  layouts: any;
  cardColors: Record<string, string>;
  cardTitles?: Record<string, string>; // Adicionado para salvar os títulos
}

export const settingsService = {
  // Busca as preferências. Se não existirem, retorna null.
  async fetchPreferences(): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('settings') 
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Erro ao buscar configurações:', JSON.stringify(error, null, 2));
      return null;
    }

    return data?.settings as UserPreferences;
  },

  // Salva as preferências. Faz um "Upsert" (atualiza se existir, cria se não).
  async savePreferences(prefs: UserPreferences): Promise<void> {
    const { data: existing, error: fetchError } = await supabase
      .from('app_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (fetchError) {
        console.error('Erro ao verificar configurações existentes:', JSON.stringify(fetchError, null, 2));
        return;
    }

    if (existing) {
      const { error } = await supabase
        .from('app_settings')
        .update({ 
            settings: prefs,
            updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) console.error('Erro ao atualizar configurações:', JSON.stringify(error, null, 2));
    } else {
      const { error } = await supabase
        .from('app_settings')
        .insert([{ settings: prefs }]);

      if (error) console.error('Erro ao criar configurações:', JSON.stringify(error, null, 2));
    }
  }
};

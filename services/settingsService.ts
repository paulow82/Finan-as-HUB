
import { supabase } from '../lib/supabaseClient';
import { AppSettings } from '../types';

export interface UserPreferences {
  settings: AppSettings;
  layouts: any;
  cardColors: Record<string, string>;
  cardTitles?: Record<string, string>;
}

export const settingsService = {
  // Busca as preferências. Se não existirem, retorna null.
  async fetchPreferences(): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('settings') 
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Erro ao buscar configurações:', error.message);
      return null;
    }

    return data?.settings as UserPreferences;
  },

  // Salva as preferências. Faz um "Upsert" (atualiza se existir, cria se não).
  async savePreferences(prefs: UserPreferences): Promise<void> {
    try {
        const { data: existing, error: fetchError } = await supabase
          .from('app_settings')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (fetchError) {
            throw fetchError;
        }

        if (existing) {
          const { error } = await supabase
            .from('app_settings')
            .update({ 
                settings: prefs,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('app_settings')
            .insert([{ settings: prefs }]);

          if (error) throw error;
        }
    } catch (error: any) {
        // Se for erro de fetch (rede), apenas avisa, não explode o console
        if (error.message && error.message.includes('Failed to fetch')) {
             console.warn('Auto-save: Falha na conexão ao salvar configurações. Tentando novamente na próxima alteração.');
        } else {
             console.error('Erro ao salvar configurações:', error.message || error);
        }
    }
  }
};
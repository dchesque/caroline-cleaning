import { createStaticClient } from '@/lib/supabase/static'
import {
    BusinessSettings,
    DEFAULT_SETTINGS,
    mapDbToSettings
} from './business-config'

export async function getBusinessSettingsServer(): Promise<BusinessSettings> {
    try {
        const supabase = createStaticClient();
        const { data } = await supabase
            .from('configuracoes')
            .select('chave, valor');

        if (!data) return DEFAULT_SETTINGS;
        return mapDbToSettings(data);
    } catch (error) {
        console.error('Error fetching settings on server:', error);
        return DEFAULT_SETTINGS;
    }
}

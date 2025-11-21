
import { supabase } from '../lib/supabaseClient';
import { InvestmentBox } from '../types';

const mapBoxFromDb = (row: any): InvestmentBox => ({
    id: row.id,
    name: row.name,
    description: row.description,
    targetAmount: row.target_amount ? Number(row.target_amount) : undefined,
    color: row.color,
    interestRate: row.interest_rate ? Number(row.interest_rate) : undefined,
    taxRate: row.tax_rate ? Number(row.tax_rate) : undefined
});

const mapBoxToDb = (box: Partial<InvestmentBox>) => ({
    name: box.name,
    description: box.description,
    target_amount: box.targetAmount,
    color: box.color,
    interest_rate: box.interestRate,
    tax_rate: box.taxRate
});

export const investmentService = {
    async fetchBoxes(): Promise<InvestmentBox[]> {
        const { data, error } = await supabase
            .from('investment_boxes')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
             if (error.code === '42P01') return [];
            console.error('Error fetching boxes:', error);
            return [];
        }

        return (data || []).map(mapBoxFromDb);
    },

    async createBox(box: Omit<InvestmentBox, 'id'>): Promise<InvestmentBox | null> {
        const { data, error } = await supabase
            .from('investment_boxes')
            .insert([mapBoxToDb(box)])
            .select()
            .single();

        if (error) {
            console.error('Error creating box:', error);
            return null;
        }

        return mapBoxFromDb(data);
    },

    async updateBox(box: InvestmentBox): Promise<InvestmentBox | null> {
        const { data, error } = await supabase
            .from('investment_boxes')
            .update(mapBoxToDb(box))
            .eq('id', box.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating box:', error);
            throw error;
        }

        return mapBoxFromDb(data);
    },

    async deleteBox(id: string): Promise<void> {
        const { error } = await supabase
            .from('investment_boxes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting box:', error);
            throw error; 
        }
        // Nenhuma checagem extra de retorno. Se não houve erro, assumimos sucesso.
    }
};

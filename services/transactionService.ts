import { supabase } from '../lib/supabaseClient';
import { Transaction } from '../types';

const ATTACHMENT_BUCKET = 'attachments';

// Map DB snake_case to Frontend camelCase
const mapFromDb = (row: any): Transaction => {
  const date = new Date(row.date);
  // Validation to prevent app crashes from invalid dates in DB
  const validDate = isNaN(date.getTime()) ? new Date() : date;

  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
    date: validDate,
    expenseType: row.expense_type || undefined,
    incomeType: row.income_type || undefined,
    dueDate: row.due_date || undefined,
    paid: row.paid,
    recurrenceId: row.recurrence_id || undefined,
    interestRate: row.interest_rate ? Number(row.interest_rate) : undefined,
    investmentBoxId: row.investment_box_id || undefined,
    attachmentUrl: row.attachment_url || undefined,
  };
};

// Map Frontend camelCase to DB snake_case
const mapToDb = (t: Partial<Transaction>) => ({
  description: t.description,
  amount: t.amount,
  type: t.type,
  category: t.category,
  date: t.date?.toISOString(),
  expense_type: t.expenseType,
  income_type: t.incomeType,
  due_date: t.dueDate,
  paid: t.paid,
  recurrence_id: t.recurrenceId,
  interest_rate: t.interestRate,
  investment_box_id: t.investmentBoxId,
  attachment_url: t.attachmentUrl || null,
});

export const transactionService = {
  async fetchAll(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', JSON.stringify(error, null, 2));
      throw error;
    }

    return (data || []).map(mapFromDb);
  },

  async create(transactions: Omit<Transaction, 'id'>[]): Promise<Transaction[]> {
    const dbTransactions = transactions.map(mapToDb);
    const { data, error } = await supabase
      .from('transactions')
      .insert(dbTransactions)
      .select();

    if (error) {
      console.error('Error creating transactions:', JSON.stringify(error, null, 2));
      throw error;
    }

    return (data || []).map(mapFromDb);
  },

  async update(transaction: Transaction, applyToFuture: boolean): Promise<void> {
    const dbData = mapToDb(transaction);
    
    if (applyToFuture && transaction.recurrenceId) {
      // Only update fields that are common for recurring transactions
      const { error } = await supabase
        .from('transactions')
        .update({
            description: dbData.description,
            amount: dbData.amount,
            category: dbData.category,
            expense_type: dbData.expense_type,
            income_type: dbData.income_type,
            interest_rate: dbData.interest_rate,
            investment_box_id: dbData.investment_box_id,
        })
        .eq('recurrence_id', transaction.recurrenceId)
        .gte('date', transaction.date.toISOString());

       if (error) throw error;
    } else {
      const { error } = await supabase
        .from('transactions')
        .update(dbData)
        .eq('id', transaction.id);

      if (error) throw error;
    }
  },

  async delete(id: string, recurrenceId?: string, applyToFuture?: boolean): Promise<void> {
    if (applyToFuture && recurrenceId) {
        const { data: current } = await supabase.from('transactions').select('date').eq('id', id).single();
        
        if (current) {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('recurrence_id', recurrenceId)
                .gte('date', current.date);

            if (error) throw error;
        }
    } else {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },
  
  async togglePaid(id: string, paid: boolean): Promise<void> {
      const { error } = await supabase
        .from('transactions')
        .update({ paid })
        .eq('id', id);
        
      if(error) throw error;
  },

  async uploadAttachment(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`Falha no upload do anexo. Detalhes: ${uploadError.message}`);
    }

    const { data } = supabase.storage
        .from(ATTACHMENT_BUCKET)
        .getPublicUrl(filePath);

    if (!data.publicUrl) {
        throw new Error("Não foi possível obter a URL pública do anexo após o upload.");
    }
    return data.publicUrl;
  },

  async deleteAttachment(url: string): Promise<void> {
      const fileName = url.split('/').pop();
      if (!fileName) {
        console.warn('Could not extract filename from URL to delete attachment:', url);
        return;
      }

      const { error } = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .remove([fileName]);
    
      if (error) {
        console.error("Error deleting storage file:", error);
        throw new Error(`Falha ao excluir o anexo do armazenamento. Detalhes: ${error.message}`);
      }
  },

  async migrateFromLocalStorage(): Promise<number> {
      const stored = localStorage.getItem('transactions');
      if (!stored) return 0;

      let localTransactions: any[] = [];
      try {
          localTransactions = JSON.parse(stored);
      } catch (e) {
          console.error("Error parsing local storage", e);
          return 0;
      }

      if (!Array.isArray(localTransactions) || localTransactions.length === 0) return 0;

      const toInsert = localTransactions.map((t: any) => {
          const dateObj = new Date(t.date);
          const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
          
          const { id, ...rest } = t;
          
          return mapToDb({
              ...rest,
              date: validDate,
              dueDate: t.dueDate,
              recurrenceId: t.recurrenceId,
              investmentBoxId: t.investmentBoxId
          });
      });

      const { error } = await supabase.from('transactions').insert(toInsert);
      
      if (error) {
          console.error("Migration error:", JSON.stringify(error, null, 2));
          throw error;
      }
      
      return toInsert.length;
  }
};
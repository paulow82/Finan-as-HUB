


import { supabase } from '../lib/supabaseClient';
import { Transaction } from '../types';

const ATTACHMENT_BUCKET = 'attachments';

// Map DB snake_case to Frontend camelCase
const mapFromDb = (row: any): Transaction => {
  const date = new Date(row.date);
  // Validation to prevent app crashes from invalid dates in DB
  let validDate = isNaN(date.getTime()) ? new Date() : date;

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
    installmentsCurrent: row.installments_current || undefined,
    installmentsTotal: row.installments_total || undefined,
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
  installments_current: t.installmentsCurrent || null,
  installments_total: t.installmentsTotal || null,
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
    // Primeiro, sempre atualiza a transação específica que está sendo editada.
    const dbData = mapToDb(transaction);
    const { error: currentUpdateError } = await supabase
      .from('transactions')
      .update(dbData)
      .eq('id', transaction.id);

    if (currentUpdateError) {
      console.error('Error updating current transaction:', currentUpdateError);
      throw currentUpdateError;
    }
    
    // Se for uma transação recorrente e precisarmos aplicar as alterações às futuras...
    if (applyToFuture && transaction.recurrenceId) {
      // Busca todas as transações futuras na série.
      const { data: futureTransactions, error: fetchFutureError } = await supabase
        .from('transactions')
        .select('*')
        .eq('recurrence_id', transaction.recurrenceId)
        .gt('date', transaction.date.toISOString());

      if (fetchFutureError) {
        console.error('Error fetching future transactions:', fetchFutureError);
        throw fetchFutureError;
      }

      if (futureTransactions && futureTransactions.length > 0) {
        const newDay = transaction.dueDate ? new Date(transaction.dueDate + 'T12:00:00').getDate() : new Date(transaction.date).getDate();

        const updates = futureTransactions.map(t => {
            const originalDate = new Date(t.date);
            // Cria a nova data para a transação futura, preservando seu mês e ano, mas usando o novo dia.
            // Para evitar problemas de fuso horário, criamos a data ao meio-dia UTC
            const newDate = new Date(Date.UTC(originalDate.getFullYear(), originalDate.getMonth(), newDay, 12, 0, 0));

            return {
                id: t.id, // Importante para o upsert saber qual registro atualizar
                description: transaction.description,
                amount: transaction.amount,
                type: transaction.type,
                category: transaction.category,
                date: newDate.toISOString(),
                expense_type: transaction.expenseType,
                income_type: transaction.incomeType,
                // A data de vencimento é baseada na nova data
                due_date: transaction.dueDate ? `${newDate.getUTCFullYear()}-${String(newDate.getUTCMonth() + 1).padStart(2, '0')}-${String(newDate.getUTCDate()).padStart(2, '0')}` : null,
                paid: t.type === 'expense' ? false : null, // Reseta o status de pago para contas futuras
                recurrence_id: transaction.recurrenceId,
                interest_rate: transaction.interestRate,
                investment_box_id: transaction.investmentBoxId,
                // O URL do anexo não é propagado para transações futuras
                attachment_url: null,
                // Mantém a contagem de parcelas original da transação futura se existir
                installments_current: t.installments_current, 
                installments_total: t.installments_total
            };
        });
        
        const { error: upsertError } = await supabase.from('transactions').upsert(updates);
        if (upsertError) {
          console.error('Error updating future transactions:', upsertError);
          throw upsertError;
        }
      }
    }
  },

  async delete(id: string, recurrenceId?: string, applyToFuture?: boolean): Promise<void> {
    if (applyToFuture && recurrenceId) {
      const { data: current, error: fetchError } = await supabase.from('transactions').select('date').eq('id', id).single();
  
      if (fetchError || !current) {
        console.error("Could not fetch the transaction to be deleted.", fetchError);
        // Fallback to deleting just the single item if we can't get its date
        await this.delete(id); 
        return;
      }
  
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('recurrence_id', recurrenceId)
        .gte('date', current.date); // Deleta a atual e todas as futuras
  
      if (deleteError) {
        console.error("Error deleting future transactions:", deleteError);
        throw deleteError;
      }
  
      // Após a exclusão, verifica se sobrou alguma transação órfã
      const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('recurrence_id', recurrenceId);
      
      if (countError) {
        console.error("Error counting remaining recurring items:", countError);
        return; // A exclusão principal funcionou, então não lançamos erro.
      }
  
      // Se sobrou exatamente uma, ela é a "mãe" que agora está sozinha.
      if (count === 1) {
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ recurrence_id: null }) // Remove o ID de recorrência
          .eq('recurrence_id', recurrenceId);
        
        if (updateError) {
          console.error("Error cleaning up orphaned recurring item:", updateError);
        }
      }
  
    } else {
      // Exclusão de uma única transação
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
  
      if (error) throw error;
    }
  },

  // Nova função: Deleta APENAS as futuras (estritamente maior que a data), preservando a atual
  async deleteFutureTransactions(recurrenceId: string, afterDate: Date): Promise<void> {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('recurrence_id', recurrenceId)
        .gt('date', afterDate.toISOString()); // gt = Greater Than (Estritamente maior que)

    if (error) throw error;
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
              investmentBoxId: t.investmentBoxId,
              installmentsCurrent: t.installmentsCurrent,
              installmentsTotal: t.installmentsTotal
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

import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
// Utilizamos a URL e a chave 'anon' (pública) fornecidas.
// A chave 'service_role' NÃO deve ser usada no frontend por questões de segurança.

const supabaseUrl = 'https://nuvddnonstlqbjsmlzoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51dmRkbm9uc3RscWJqc21sem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzEwMDQsImV4cCI6MjA2NDE0NzAwNH0.RflxPhG0C0qjohP5jdckzHUA7EJGsITV6Lh0Nf_RJLU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => true;

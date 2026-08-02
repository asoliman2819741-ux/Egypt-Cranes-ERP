import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://thyudheynriuiqvxagnd.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_dszihp7nFA33VV-AB9M4sg_4GXKdxoo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const checkSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase.from('test_connection').select('*').limit(1);
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'الاتصال بقاعدة بيانات Supabase يعمل بنجاح' };
  } catch (err: any) {
    return { success: false, message: err.message || 'تعذر الاتصال بـ Supabase' };
  }
};

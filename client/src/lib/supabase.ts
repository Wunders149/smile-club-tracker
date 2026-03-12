import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Storage will not work.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export const uploadVolunteerPhoto = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `volunteer-photos/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from('volunteers')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('volunteers')
    .getPublicUrl(filePath);

  return publicUrl;
};

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

export const deleteVolunteerPhoto = async (photoUrl: string) => {
  if (!photoUrl) return;

  try {
    // Extract the file path from the public URL
    // Format is usually: .../storage/v1/object/public/volunteers/volunteer-photos/filename.ext
    const urlParts = photoUrl.split('/volunteers/');
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];
    const { error } = await supabase.storage
      .from('volunteers')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting photo from storage:', error);
    }
  } catch (err) {
    console.error('Unexpected error during photo deletion:', err);
  }
};

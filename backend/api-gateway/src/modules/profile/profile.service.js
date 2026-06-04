const supabase = require('../../config/supabase');

const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

const upsertProfile = async ({ id, email, phone, full_name, avatar_url }) => {
  const row = {
    id,
    email: email || '',
    phone: phone || '',
    full_name: full_name || '',
    avatar_url: avatar_url || '',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  getProfile,
  upsertProfile
};

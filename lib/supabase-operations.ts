// lib/supabase-operations.ts

import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export const getMemory = async (id: string) => {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createMemory = async (title: string, content: string, userId: string) => {
  const { data, error } = await supabase
    .from('memories')
    .insert([{ title, content, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateMemory = async (id: string, title: string, content: string) => {
  const { data, error } = await supabase
    .from('memories')
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteMemory = async (id: string) => {
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getAllMemories = async (userId: string) => {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
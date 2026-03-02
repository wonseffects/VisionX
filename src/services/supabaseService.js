import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export const saveChat = async (userId, prompt, htmlResponse) => {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('chats')
        .insert([
            { user_id: userId, prompt, dashboard_html: htmlResponse }
        ])
        .select();

    if (error) {
        console.error('Error saving chat to Supabase:', error);
        return null;
    }

    return data[0];
};

export const getChatHistory = async (userId) => {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching chat history from Supabase:', error);
        return [];
    }

    return data;
};

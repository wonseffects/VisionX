import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;

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
export const getTodayChatCount = async (userId) => {
    const client = supabaseAdmin || supabase;
    if (!client) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await client
        .from('chats')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());

    if (error) {
        console.error('Error counting today\'s chats:', error);
        return 0;
    }

    return count || 0;
};

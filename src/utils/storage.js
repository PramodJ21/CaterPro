import { supabase } from './supabase';

export const KEYS = {
    EVENTS: 'events',
    INVENTORY: 'inventory',
    PROCUREMENT: 'procurement',
    WORKERS: 'workers',
    ATTENDANCE: 'attendance',
    RECIPES: 'recipes',
    MOM: 'mom',
    FEEDBACK: 'feedback',
    INVENTORY_MOVEMENTS: 'inventory_movements',
    SEEDED: 'caterpro_seeded_v3',
};

const withRetry = async (fn, maxRetries = 3) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
};

export const getData = async (key) => {
    try {
        if (key === KEYS.SEEDED) return localStorage.getItem(key);
        const { data, error } = await supabase.from(key).select('data');
        if (error) throw error;
        return data ? data.map(item => item.data) : [];
    } catch (e) {
        console.error(`Failed to fetch ${key}:`, e);
        return [];
    }
};

export const upsertRecord = async (key, record) => {
    return withRetry(async () => {
        const { error } = await supabase
            .from(key)
            .upsert({ id: record.id, data: record });
        if (error) throw error;
        return true;
    });
};

export const deleteRecord = async (key, id) => {
    return withRetry(async () => {
        const { error } = await supabase
            .from(key)
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    });
};

// Legacy support - trying to move away from this bulk approach
export const saveData = async (key, value) => {
    try {
        if (key === KEYS.SEEDED) {
            localStorage.setItem(key, value);
            return;
        }

        const { data: currentRows, error: fetchErr } = await supabase.from(key).select('id');
        if (fetchErr) throw fetchErr;

        const currentIds = currentRows.map(r => r.id);
        const newIds = value.map(v => v.id);
        const idsToDelete = currentIds.filter(id => !newIds.includes(id));

        if (idsToDelete.length > 0) {
            await supabase.from(key).delete().in('id', idsToDelete);
        }

        if (value.length > 0) {
            const rowsToUpsert = value.map(v => ({ id: v.id, data: v }));
            await supabase.from(key).upsert(rowsToUpsert);
        }
    } catch (e) {
        console.error(`Failed to save ${key}:`, e);
        throw e;
    }
};

export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

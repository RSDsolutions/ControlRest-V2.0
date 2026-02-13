
import { supabase } from '../supabaseClient';

export const logActivity = async (
    userId: string,
    action: string,
    module: string,
    details?: any,
    referenceId?: string
) => {
    try {
        const { error } = await supabase.from('activity_logs').insert([
            {
                user_id: userId,
                action,
                module,
                details,
                reference_id: referenceId,
                created_at: new Date().toISOString()
            }
        ]);
        if (error) console.error('Error logging activity:', error);
    } catch (err) {
        console.error('Audit log failed:', err);
    }
};

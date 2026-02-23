import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

export function usePlanFeatures(restaurantId?: string) {
    return useQuery({
        queryKey: ['restaurant_features', restaurantId],
        queryFn: async () => {
            let targetRestaurantId = restaurantId;

            if (!targetRestaurantId) {
                const { data: userData } = await supabase.auth.getUser();
                const userId = userData.user?.id;
                const email = userData.user?.email;

                if (!userId) return { features: {}, planCode: null };

                // 1. Get restaurant_id using same logic as fetchProfile (handling ID/Email mismatches)
                const { data: userProfile, error: profileErr } = await supabase
                    .from('users')
                    .select('restaurant_id')
                    .or(`id.eq.${userId}${email ? `,email.eq.${email}` : ''}`)
                    .single();

                if (profileErr || !userProfile?.restaurant_id) return { features: {}, planCode: null };
                targetRestaurantId = userProfile.restaurant_id;
            }

            // 2. Fetch features
            // Get the active plan_id first
            const { data: subData } = await supabase
                .from('restaurant_subscriptions')
                .select('plan_id, ends_at, subscription_plans(code)')
                .eq('restaurant_id', targetRestaurantId)
                .eq('status', 'active')
                .single();

            if (!subData?.plan_id) return { features: {}, planCode: null };

            const { data: features, error } = await supabase
                .from('plan_features')
                .select('feature_code, enabled')
                .eq('plan_id', subData.plan_id);

            if (error) {
                console.error('Error fetching plan features:', error);
                return { features: {}, planCode: null };
            }

            // Transform to a key-value object
            const featureMap = (features || []).reduce((acc: Record<string, boolean>, curr: any) => {
                acc[curr.feature_code] = curr.enabled;
                return acc;
            }, {});

            return {
                features: featureMap,
                planCode: (subData.subscription_plans as any)?.code || null,
                planId: subData.plan_id,
                endsAt: subData.ends_at
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export const isFeatureEnabled = (data: any, featureCode: string): boolean => {
    if (!data) return false;
    const features = data.features || data;
    return !!features[featureCode];
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import {
    SmartAlert,
    SmartSuggestion,
    AlertSeverity,
    AlertType
} from '../types';

export function useIntelligence(branchId: string | 'GLOBAL' | null) {

    // 1. Fetch System Events (The new single source of truth)
    const { data: events = [], isLoading } = useQuery({
        queryKey: ['system_events', branchId],
        queryFn: async () => {
            let query = supabase
                .from('system_events')
                .select('*')
                .eq('resolved', false)
                .order('severity', { ascending: false }) // Critical first (depends on how DB sorts strings, usually we'd sort by created_at or case)
                .order('created_at', { ascending: false });

            if (branchId && branchId !== 'GLOBAL') {
                query = query.eq('branch_id', branchId);
            }

            const { data, error } = await query;
            if (error) {
                console.error('Error fetching system events:', error);
                return [];
            }
            return data || [];
        },
        refetchInterval: 30000 // Poll every 30s as a fallback, though we could use Supabase Realtime here
    });

    // 2. Parse Events into Alerts and Suggestions
    const alerts: SmartAlert[] = [];
    const suggestions: SmartSuggestion[] = [];

    events.forEach((ev: any) => {
        // Map DB severity to AlertSeverity Enum
        let severity = AlertSeverity.INFO;
        if (ev.severity === 'critical') severity = AlertSeverity.CRITICAL;
        if (ev.severity === 'warning') severity = AlertSeverity.WARNING;

        // Map Event Category to AlertType Enum
        let type = AlertType.ADMIN;
        if (ev.event_category === 'inventory') type = AlertType.INVENTORY;
        if (ev.event_category === 'financial') type = AlertType.FINANCIAL;
        if (ev.event_category === 'operational') type = AlertType.ADMIN;

        // Enrich metadata with DB's top-level source_record_id
        let parsedMeta: any = {};
        if (ev.metadata) {
            try {
                parsedMeta = typeof ev.metadata === 'string' ? JSON.parse(ev.metadata) : { ...ev.metadata };
            } catch (e) {
                console.error("Error parsing event metadata", e);
            }
        }
        if (ev.source_record_id) {
            parsedMeta._source_record_id = ev.source_record_id;
        }

        // Translate event types to Spanish
        const eventTypeTranslations: Record<string, string> = {
            'margin_drift': 'Desviación de Margen',
            'profit_deviation': 'Desviación de Utilidad',
            'idle_capital': 'Capital Estancado',
            'idle_inventory_capital': 'Inventario Inmóvil',
            'low_stock': 'Stock Bajo',
            'high_waste': 'Alerta de Merma',
            'cost_increase': 'Incremento de Costo',
            'cash_shortage': 'Faltante en Caja',
            'void_spike': 'Anomalía en Cancelaciones',
            'expense_anomaly': 'Gasto Inusual Detectado',
            'efficiency_leak': 'Fuga de Eficiencia Crítica',
        };

        let translatedTitle = eventTypeTranslations[ev.event_type] || ev.event_type.replace(/_/g, ' ').toUpperCase();

        // Append item/product name to title if available for immediate context
        if (parsedMeta.recipe_name) {
            translatedTitle += ` en ${parsedMeta.recipe_name}`;
        } else if (parsedMeta.ingredient_name) {
            translatedTitle += ` en ${parsedMeta.ingredient_name}`;
        }

        const baseEvent = {
            id: ev.id,
            title: translatedTitle,
            timestamp: ev.created_at,
            metadata: JSON.stringify(parsedMeta),
            actionLabel: 'Resolver'
        };

        // Identify AI suggestions vs Operational alerts
        // 'idle_inventory' is now treated as a notice rather than a simulated suggestion
        const isSuggestion = ['margin_drift', 'profit_deviation', 'expense_anomaly', 'efficiency_leak'].includes(ev.event_type);

        if (isSuggestion) {
            suggestions.push({
                id: ev.id,
                title: baseEvent.title,
                description: ev.impact_projection + (ev.recommended_action ? ' ' + ev.recommended_action : ''),
                actionLabel: 'Ver Simulación',
                impactFinancial: ev.impact_value ? `$${Math.abs(Number(ev.impact_value)).toFixed(2)}` : undefined,
                category: ev.event_category,
                horizon: 'daily',
                metadata: parsedMeta,
                sourceRecordId: ev.source_record_id,
                sourceTable: ev.source_table,
                eventType: ev.event_type
            });
        } else {
            // Check if this is the specific case where recommend action should be a notice
            const isNoticeOnly = ev.event_type === 'idle_inventory' || ev.event_type === 'idle_inventory_capital';

            alerts.push({
                id: ev.id,
                severity,
                type,
                title: baseEvent.title,
                message: isNoticeOnly
                    ? (ev.impact_projection + (ev.recommended_action ? ' ' + ev.recommended_action : ''))
                    : (ev.impact_projection || 'Anomalía detectada.'),
                impact: ev.impact_value ? `Impacto de $${Math.abs(Number(ev.impact_value)).toFixed(2)}` : undefined,
                actionLabel: isNoticeOnly ? 'Revisar' : (ev.recommended_action || 'Revisar'),
                timestamp: ev.created_at,
                metadata: parsedMeta,
                sourceRecordId: ev.source_record_id,
                sourceTable: ev.source_table,
                eventType: ev.event_type
            });
        }
    });

    return {
        alerts,
        suggestions,
        rawEvents: events,
        loading: isLoading
    };
}

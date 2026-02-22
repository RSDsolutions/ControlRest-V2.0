const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...valParts] = line.split('=');
    if (key) {
        env[key.trim()] = valParts.join('=').trim().replace(/['"]/g, '');
    }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log("Fetching latest unresolved events...");
    const { data: events, error } = await supabase
        .from('system_events')
        .select('*')
        .eq('resolved', false)
        .eq('event_category', 'financial')
        .limit(10);

    if (error) {
        console.error("Error", error);
        return;
    }
    console.log(JSON.stringify(events, null, 2));
}

run();

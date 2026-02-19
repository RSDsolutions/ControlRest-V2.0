
const https = require('https');

const data = JSON.stringify({
    email: 'robinsonsolorzano99@gmail.com',
    password: '123456'
});

const options = {
    hostname: 'yzlzcqjvwcftfmjzkqcs.supabase.co',
    port: 443,
    path: '/auth/v1/token?grant_type=password',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bHpjcWp2d2NmdGZtanprcWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NTQxMDQsImV4cCI6MjA4NjUzMDEwNH0.AVHojt1pzolJVDfWZI3_uetgWk8ZWFlkEVXGJ9CHJAE',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('BODY: ' + body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();

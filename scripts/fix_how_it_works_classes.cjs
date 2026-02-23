const fs = require('fs');
const path = require('path');

const fp = path.join(__dirname, '..', 'views', 'landing', 'HowItWorksView.tsx');
let content = fs.readFileSync(fp, 'utf8');

content = content.replace(/bg-bg-card/g, 'bg-[#1E293B]');
content = content.replace(/to-bg-card/g, 'to-[#1E293B]');
content = content.replace(/bg-bg-main/g, 'bg-[#0F172A]');
content = content.replace(/text-bg-main/g, 'text-[#0F172A]');
content = content.replace(/text-text-dim/g, 'text-slate-400');
content = content.replace(/text-text-light/g, 'text-slate-300');
content = content.replace(/bg-primary/g, 'bg-blue-600');
content = content.replace(/text-primary/g, 'text-blue-500');
content = content.replace(/border-primary/g, 'border-blue-500');
content = content.replace(/from-primary/g, 'from-blue-500');
content = content.replace(/bg-secondary/g, 'bg-emerald-500');
content = content.replace(/text-secondary/g, 'text-emerald-500');
content = content.replace(/border-secondary/g, 'border-emerald-500');
content = content.replace(/to-secondary/g, 'to-emerald-500');

fs.writeFileSync(fp, content, 'utf8');
console.log('Fixed Tailwind classes in HowItWorksView.tsx');

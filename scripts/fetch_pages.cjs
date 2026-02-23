const https = require('https');
const fs = require('fs');
const path = require('path');

const screens = [
    {
        name: "LandingView",
        url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzdmYWFhMjQwMjhjZjRhMWJhMWU4NjkwMjYxMTY2MTY3EgsSBxDy89WlngEYAZIBIwoKcHJvamVjdF9pZBIVQhMyNjAwNjYzNzA1Njc3ODE3MDIw&filename=&opi=89354086"
    },
    {
        name: "ProblemView",
        url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2Q2NDAwMzRjYmJlMTQyZTY4MmU4MTRiMzY3YTM4NDcxEgsSBxDy89WlngEYAZIBIwoKcHJvamVjdF9pZBIVQhMyNjAwNjYzNzA1Njc3ODE3MDIw&filename=&opi=89354086"
    },
    {
        name: "HowItWorksView",
        url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzUxM2E3ZTlmNTk1MDRjNmZiMGJlOGRjNWZkZmJlMjg3EgsSBxDy89WlngEYAZIBIwoKcHJvamVjdF9pZBIVQhMyNjAwNjYzNzA1Njc3ODE3MDIw&filename=&opi=89354086"
    },
    {
        name: "FeaturesView",
        url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2M1Nzg3N2RhMmRkNzRhZGU5MjE5YmZmNGVmNzRhNzRhEgsSBxDy89WlngEYAZIBIwoKcHJvamVjdF9pZBIVQhMyNjAwNjYzNzA1Njc3ODE3MDIw&filename=&opi=89354086"
    },
    {
        name: "PricingView",
        url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2Y5OGZjOGI4YTczNTRlNmFhNTM0MWYwOWI1Y2Y0NjllEgsSBxDy89WlngEYAZIBIwoKcHJvamVjdF9pZBIVQhMyNjAwNjYzNzA1Njc3ODE3MDIw&filename=&opi=89354086"
    },
    {
        name: "SupportView",
        url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2M1OGRiMzU0MGM1ZDQ2ZGI5ZTg1MDdkZmU1YzMzZjU5EgsSBxDy89WlngEYAZIBIwoKcHJvamVjdF9pZBIVQhMyNjAwNjYzNzA1Njc3ODE3MDIw&filename=&opi=89354086"
    }
];

function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', err => reject(err));
    });
}

function processHTMLToJSX(html, name) {
    // Extract inner content of <body>
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let innerHtml = bodyMatch ? bodyMatch[1] : html;

    // Convert standard HTML to JSX
    let jsx = innerHtml
        .replace(/class=/g, 'className=')
        .replace(/for=/g, 'htmlFor=')
        .replace(/<!--/g, '{/*')
        .replace(/-->/g, '*/}')
        .replace(/<img(.*?)>/g, '<img$1 />')
        .replace(/<input(.*?)>/g, '<input$1 />')
        .replace(/<br(.*?)>/g, '<br$1 />')
        .replace(/<hr(.*?)>/g, '<hr$1 />')
        .replace(/style="([^"]*)"/g, (match, styleString) => {
            const styleObj = styleString.split(';').filter(s => s.trim()).reduce((acc, curr) => {
                let [key, val] = curr.split(':');
                if (!key || !val) return acc;
                key = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
                acc[key] = val.trim();
                return acc;
            }, {});
            return `style={${JSON.stringify(styleObj)}}`;
        });

    jsx = jsx.replace(/stroke-width/g, 'strokeWidth')
        .replace(/stroke-linecap/g, 'strokeLinecap')
        .replace(/stroke-linejoin/g, 'strokeLinejoin');

    return `import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ${name}: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.classList.add('dark');
        return () => {
            document.documentElement.classList.remove('dark');
        };
    }, []);

    return (
        <div className="bg-[#0F172A] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden min-h-screen">
            ${jsx}
        </div>
    );
};

export default ${name};
`;
}

async function run() {
    for (const screen of screens) {
        console.log(`Fetching ${screen.name}...`);
        const html = await fetchHTML(screen.url);
        const jsx = processHTMLToJSX(html, screen.name);
        const fp = path.join(__dirname, '..', 'views', 'landing', `${screen.name}.tsx`);
        fs.writeFileSync(fp, jsx, 'utf8');
        console.log(`Saved ${fp}`);
    }
}

run().catch(err => console.error(err));

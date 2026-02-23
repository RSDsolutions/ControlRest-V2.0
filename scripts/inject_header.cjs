const fs = require('fs');
const path = require('path');

const views = [
    'LandingView.tsx',
    'ProblemView.tsx',
    'HowItWorksView.tsx',
    'FeaturesView.tsx',
    'PricingView.tsx',
    'SupportView.tsx'
];

views.forEach(view => {
    const fp = path.join(__dirname, '..', 'views', 'landing', view);
    let content = fs.readFileSync(fp, 'utf8');

    // Add import if missing
    if (!content.includes('LandingHeader')) {
        content = content.replace(
            "import { useNavigate } from 'react-router-dom';",
            "import { useNavigate } from 'react-router-dom';\nimport LandingHeader from './LandingHeader';"
        );
    }

    // Replace <nav> to </nav> in the others
    content = content.replace(/<nav[^>]*>[\s\S]*?<\/nav>/, '<LandingHeader />');

    // Replace <header> to </header> in LandingView
    content = content.replace(/<header[^>]*>[\s\S]*?<\/header>/, '<LandingHeader />');

    // Remove any extra "import { useNavigate }" since some of the new files don't use it anymore if only the header used it
    // Actually, let's keep it in case they have buttons that use it.

    fs.writeFileSync(fp, content, 'utf8');
    console.log(`Updated ${view} with LandingHeader`);
});

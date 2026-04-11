import fs from 'fs';
import path from 'path';

const filesToSanitize = [
    'src/App.tsx',
    'src/components/dashboards/AdvisorDashboard.tsx',
    'src/pages/Onboarding.tsx',
    'src/pages/StudentVerification.tsx',
    'src/components/layout/DashboardHeader.tsx',
    'src/components/layout/DashboardSidebar.tsx',
    'README.md'
];

filesToSanitize.forEach(file => {
    const fullPath = path.resolve(file);
    if (fs.existsSync(fullPath)) {
        console.log(`Sanitizing ${file}...`);
        const content = fs.readFileSync(fullPath);
        // Remove all instances of \x00
        const sanitized = content.filter(byte => byte !== 0);
        if (content.length !== sanitized.length) {
            fs.writeFileSync(fullPath, sanitized);
            console.log(`  Fixed: Removed ${content.length - sanitized.length} null characters.`);
        } else {
            console.log(`  Clean: No null characters found.`);
        }
    } else {
        console.log(`Skipping ${file} (not found).`);
    }
});

console.log('Sanitization complete.');

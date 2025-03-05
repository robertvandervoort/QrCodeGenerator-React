// GitHub Pages deployment script
import ghpages from 'gh-pages';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { exec } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Run build
console.log('Building the project...');
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Build error: ${error}`);
    return;
  }
  
  console.log('Build completed successfully.');
  
  // Create a CNAME file if needed
  // fs.writeFileSync('./dist/CNAME', 'yourdomain.com');
  
  // Create a .nojekyll file to disable Jekyll processing
  fs.writeFileSync('./dist/.nojekyll', '');
  
  // Copy README.md to the dist folder
  try {
    fs.copyFileSync('./README.md', './dist/README.md');
    console.log('README.md copied to dist folder.');
  } catch (err) {
    console.warn('Could not copy README.md:', err);
  }
  
  // Deploy to GitHub Pages
  console.log('Deploying to GitHub Pages...');
  ghpages.publish('dist', {
    branch: 'gh-pages',
    message: 'Auto-generated deployment to GitHub Pages',
    user: {
      name: 'Robert Vandervoort',
      email: 'auto-deploy@github.com' // Replace with your GitHub email if needed
    }
  }, (err) => {
    if (err) {
      console.error('Deployment error:', err);
      return;
    }
    console.log('Deployment successful!');
    console.log('Your app is now available at: https://rvandervoort.github.io/qr-code-generator');
  });
});
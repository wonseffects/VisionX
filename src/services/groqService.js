import fs from 'fs';
import path from 'path';

// Load the local template instead of the system prompt
const templatePath = path.join(process.cwd(), 'src', 'templates', 'dashboardTemplate.html');

export const generateDashboard = async (userPrompt, contextData) => {
    try {
        console.log('Generating dashboard via local template (bypassing Groq LLM to avoid token limits)...');
        
        // Read the static HTML file
        let templateContent = fs.readFileSync(templatePath, 'utf-8');
        
        // Create the script tag that injects the JSON data
        const dataInjection = `
  <script>
    window.DASHBOARD_DATA = ${JSON.stringify(contextData)};
  </script>`;
        
        // Replace the injection point marker in the HTML
        const finalHtml = templateContent.replace('<!-- DATA_INJECTION_POINT -->', dataInjection);

        // Return the final HTML string instantaneously
        return finalHtml;
    } catch (error) {
        console.error('Error interpolating dashboard template:', error);
        throw new Error('Falha ao gerar dashboard localmente.');
    }
};

const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.example' }); // Fallback

async function run() {
  const systemPrompt = `You are an elite, world-class resume-writing expert. Based on the user's answers, write an exceptional resume.
        
        You MUST wrap the complete resume JSON inside <UPDATE_RESUME> and </UPDATE_RESUME> XML tags.
        
        The structure MUST EXACTLY MATCH the following keys. Do NOT invent new keys (e.g. do NOT use 'jobTitle' or 'company', use ONLY the keys shown below):
        <UPDATE_RESUME>
        {
          "name": "[User's Name]",
          "contactLine": "City, ST | (123) 456-7890 | email@domain.com | linkedin.com/in/username",
          "summary": "Professional summary...",
          "experiences": [
            {
              "title": "Senior Frontend Engineer | Tech Company",
              "date": "Jan 2022 - Present",
              "bullets": [
                { "text": "Designed and deployed..." },
                { "text": "Collaborated with..." }
              ],
              "meta": "Stack: React, TypeScript, Tailwind"
            }
          ],
          "educations": [
            {
              "degree": "B.S. in Computer Science | University Name",
              "bullets": [
                { "text": "GPA 3.8, Honors" }
              ]
            }
          ],
          "skills": [
            {
              "title": "Programming Languages",
              "items": "TypeScript, JavaScript, Python"
            },
            {
              "title": "Frameworks & Databases",
              "items": "React, Next.js, PostgreSQL"
            }
          ]
        }
        </UPDATE_RESUME>
        
        CRITICAL: Do NOT use placeholder names like 'Jane Doe' or placeholder companies. If the user did not provide a specific piece of information, leave it blank or omit it, but NEVER invent fake personal details.
        CRITICAL: You MUST use the exact JSON keys shown above: "title", "date", "bullets", "text", "meta", "degree", "items". If you use different keys, the resume will break and render empty!
        
        Provide a friendly, conversational message before the XML block congratulating the user on finishing their career interview and explaining how their resume was crafted.`;

  const compilePrompt = `Please compile a complete, highly professional, impact-driven resume based on these career interview answers. Tailor the content, skills, and bullet points specifically for the target role:
        - name: Candidate
        - contactLine: San Francisco, CA | (415) 555-0198 | dev@example.com | linkedin.com/in/sampledev
        - summary: (Draft a professional summary for a Senior Full Stack Software Engineer)
        - experiences: Tech Lead at Acme Corp (2020-Present): Led a team of 5 engineers to rebuild the core React dashboard, reducing load times by 40%. Previously Frontend Developer at Globex (2018-2020): Built standard UI components and integrated REST APIs.
        - educations: B.S. Computer Science from University of California, Berkeley (2018). AWS Certified Solutions Architect (2021).
        - skills: React, Next.js, Node.js, TypeScript, PostgreSQL, AWS, Docker, Agile/Scrum
        
        Generate the professional experience with high-impact STAR method bullet points tailored to the target role. Return the full resume in our specialized JSON format.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: compilePrompt }
      ]
    })
  });

  const data = await response.json();
  console.log(data.choices[0].message.content);
}

run();

/**
 * Agent Rez: ATS Skills Taxonomy (Rez-Taxonomy)
 * Curated, deterministic dictionary of resume/JD keywords used for exact
 * (post-normalization) matching. No AI, no external calls — every match is
 * reproducible and auditable against this list.
 *
 * `variants` must be lowercase and include common abbreviations, plurals,
 * and alternate phrasings. `canonical` is the display form shown to users.
 */

export type SkillCategory =
  | 'language'
  | 'framework'
  | 'database'
  | 'cloud'
  | 'devops'
  | 'data_ml'
  | 'design'
  | 'methodology'
  | 'soft_skill'
  | 'certification'
  | 'tool';

export interface TaxonomyEntry {
  canonical: string;
  category: SkillCategory;
  variants: string[];
}

export const SKILLS_TAXONOMY: TaxonomyEntry[] = [
  // Languages
  { canonical: 'JavaScript', category: 'language', variants: ['javascript', 'js', 'es6', 'ecmascript'] },
  { canonical: 'TypeScript', category: 'language', variants: ['typescript', 'ts'] },
  { canonical: 'Python', category: 'language', variants: ['python', 'python3'] },
  { canonical: 'Java', category: 'language', variants: ['java'] },
  { canonical: 'C++', category: 'language', variants: ['c++', 'cpp'] },
  { canonical: 'C#', category: 'language', variants: ['c#', 'csharp', '.net'] },
  { canonical: 'Go', category: 'language', variants: ['golang', 'go lang'] },
  { canonical: 'Rust', category: 'language', variants: ['rust'] },
  { canonical: 'Ruby', category: 'language', variants: ['ruby', 'ruby on rails', 'rails'] },
  { canonical: 'PHP', category: 'language', variants: ['php'] },
  { canonical: 'Swift', category: 'language', variants: ['swift'] },
  { canonical: 'Kotlin', category: 'language', variants: ['kotlin'] },
  { canonical: 'SQL', category: 'language', variants: ['sql', 'structured query language'] },
  { canonical: 'HTML', category: 'language', variants: ['html', 'html5'] },
  { canonical: 'CSS', category: 'language', variants: ['css', 'css3'] },
  { canonical: 'Bash', category: 'language', variants: ['bash', 'shell scripting', 'shell script'] },

  // Frameworks / Libraries
  { canonical: 'React', category: 'framework', variants: ['react', 'react.js', 'reactjs'] },
  { canonical: 'Next.js', category: 'framework', variants: ['next.js', 'nextjs', 'next js'] },
  { canonical: 'Vue.js', category: 'framework', variants: ['vue', 'vue.js', 'vuejs'] },
  { canonical: 'Angular', category: 'framework', variants: ['angular', 'angularjs'] },
  { canonical: 'Node.js', category: 'framework', variants: ['node', 'node.js', 'nodejs'] },
  { canonical: 'Express.js', category: 'framework', variants: ['express', 'express.js', 'expressjs'] },
  { canonical: 'Django', category: 'framework', variants: ['django'] },
  { canonical: 'Flask', category: 'framework', variants: ['flask'] },
  { canonical: 'Spring Boot', category: 'framework', variants: ['spring boot', 'spring framework', 'spring'] },
  { canonical: 'ASP.NET', category: 'framework', variants: ['asp.net', 'asp .net'] },
  { canonical: 'Tailwind CSS', category: 'framework', variants: ['tailwind', 'tailwindcss', 'tailwind css'] },
  { canonical: 'GraphQL', category: 'framework', variants: ['graphql'] },
  { canonical: 'REST API', category: 'framework', variants: ['rest api', 'restful', 'rest', 'restful api'] },

  // Databases
  { canonical: 'PostgreSQL', category: 'database', variants: ['postgresql', 'postgres'] },
  { canonical: 'MySQL', category: 'database', variants: ['mysql'] },
  { canonical: 'MongoDB', category: 'database', variants: ['mongodb', 'mongo'] },
  { canonical: 'Redis', category: 'database', variants: ['redis'] },
  { canonical: 'SQLite', category: 'database', variants: ['sqlite'] },
  { canonical: 'DynamoDB', category: 'database', variants: ['dynamodb'] },
  { canonical: 'Supabase', category: 'database', variants: ['supabase'] },
  { canonical: 'Firebase', category: 'database', variants: ['firebase', 'firestore'] },
  { canonical: 'Elasticsearch', category: 'database', variants: ['elasticsearch', 'elastic search'] },

  // Cloud
  { canonical: 'AWS', category: 'cloud', variants: ['aws', 'amazon web services'] },
  { canonical: 'Google Cloud Platform', category: 'cloud', variants: ['gcp', 'google cloud platform', 'google cloud'] },
  { canonical: 'Microsoft Azure', category: 'cloud', variants: ['azure', 'microsoft azure'] },
  { canonical: 'Vercel', category: 'cloud', variants: ['vercel'] },
  { canonical: 'Netlify', category: 'cloud', variants: ['netlify'] },
  { canonical: 'Heroku', category: 'cloud', variants: ['heroku'] },
  { canonical: 'Cloudflare', category: 'cloud', variants: ['cloudflare'] },

  // DevOps / Infra
  { canonical: 'Docker', category: 'devops', variants: ['docker', 'containerization'] },
  { canonical: 'Kubernetes', category: 'devops', variants: ['kubernetes', 'k8s'] },
  { canonical: 'CI/CD', category: 'devops', variants: ['ci/cd', 'cicd', 'continuous integration', 'continuous deployment', 'continuous delivery'] },
  { canonical: 'Terraform', category: 'devops', variants: ['terraform', 'iac', 'infrastructure as code'] },
  { canonical: 'Git', category: 'devops', variants: ['git', 'version control'] },
  { canonical: 'GitHub Actions', category: 'devops', variants: ['github actions'] },
  { canonical: 'Jenkins', category: 'devops', variants: ['jenkins'] },
  { canonical: 'Linux', category: 'devops', variants: ['linux', 'unix'] },
  { canonical: 'Nginx', category: 'devops', variants: ['nginx'] },
  { canonical: 'Microservices', category: 'devops', variants: ['microservices', 'microservice architecture'] },
  { canonical: 'Serverless', category: 'devops', variants: ['serverless', 'lambda', 'aws lambda'] },
  { canonical: 'Webhooks', category: 'devops', variants: ['webhook', 'webhooks'] },

  // Data / ML / AI
  { canonical: 'Machine Learning', category: 'data_ml', variants: ['machine learning', 'ml'] },
  { canonical: 'Artificial Intelligence', category: 'data_ml', variants: ['artificial intelligence', 'ai'] },
  { canonical: 'Large Language Models', category: 'data_ml', variants: ['llm', 'llms', 'large language model', 'large language models'] },
  { canonical: 'Natural Language Processing', category: 'data_ml', variants: ['nlp', 'natural language processing'] },
  { canonical: 'TensorFlow', category: 'data_ml', variants: ['tensorflow'] },
  { canonical: 'PyTorch', category: 'data_ml', variants: ['pytorch'] },
  { canonical: 'Pandas', category: 'data_ml', variants: ['pandas'] },
  { canonical: 'NumPy', category: 'data_ml', variants: ['numpy'] },
  { canonical: 'Data Analysis', category: 'data_ml', variants: ['data analysis', 'data analytics'] },
  { canonical: 'Data Visualization', category: 'data_ml', variants: ['data visualization', 'data viz'] },
  { canonical: 'ETL', category: 'data_ml', variants: ['etl', 'extract transform load'] },
  { canonical: 'A/B Testing', category: 'data_ml', variants: ['a/b testing', 'ab testing', 'split testing'] },

  // Design
  { canonical: 'Figma', category: 'design', variants: ['figma'] },
  { canonical: 'UI/UX Design', category: 'design', variants: ['ui/ux', 'ui ux', 'user experience', 'user interface design', 'ux design', 'ui design'] },
  { canonical: 'Responsive Design', category: 'design', variants: ['responsive design', 'responsive web design'] },
  { canonical: 'Design Systems', category: 'design', variants: ['design system', 'design systems'] },
  { canonical: 'Accessibility', category: 'design', variants: ['accessibility', 'a11y', 'wcag'] },

  // Methodology / PM
  { canonical: 'Agile', category: 'methodology', variants: ['agile', 'agile methodology'] },
  { canonical: 'Scrum', category: 'methodology', variants: ['scrum'] },
  { canonical: 'Kanban', category: 'methodology', variants: ['kanban'] },
  { canonical: 'Project Management', category: 'methodology', variants: ['project management'] },
  { canonical: 'Product Management', category: 'methodology', variants: ['product management'] },
  { canonical: 'Stakeholder Management', category: 'methodology', variants: ['stakeholder management', 'stakeholder communication'] },
  { canonical: 'Roadmapping', category: 'methodology', variants: ['roadmap', 'roadmapping', 'product roadmap'] },
  { canonical: 'Jira', category: 'methodology', variants: ['jira'] },
  { canonical: 'Confluence', category: 'methodology', variants: ['confluence'] },

  // Tools
  { canonical: 'Stripe', category: 'tool', variants: ['stripe'] },
  { canonical: 'Salesforce', category: 'tool', variants: ['salesforce'] },
  { canonical: 'HubSpot', category: 'tool', variants: ['hubspot'] },
  { canonical: 'Slack', category: 'tool', variants: ['slack'] },
  { canonical: 'Excel', category: 'tool', variants: ['excel', 'microsoft excel'] },
  { canonical: 'Tableau', category: 'tool', variants: ['tableau'] },
  { canonical: 'Power BI', category: 'tool', variants: ['power bi', 'powerbi'] },
  { canonical: 'Zendesk', category: 'tool', variants: ['zendesk'] },

  // Certifications
  { canonical: 'PMP', category: 'certification', variants: ['pmp', 'project management professional'] },
  { canonical: 'AWS Certified', category: 'certification', variants: ['aws certified', 'aws certification'] },
  { canonical: 'CPA', category: 'certification', variants: ['cpa', 'certified public accountant'] },
  { canonical: 'Six Sigma', category: 'certification', variants: ['six sigma', 'lean six sigma'] },
  { canonical: 'CISSP', category: 'certification', variants: ['cissp'] },
  { canonical: 'Scrum Master', category: 'certification', variants: ['csm', 'certified scrum master'] },

  // Soft skills (kept narrow — these are heavily gamed, low weight in scoring)
  { canonical: 'Cross-functional Collaboration', category: 'soft_skill', variants: ['cross-functional', 'cross functional', 'cross-functional collaboration'] },
  { canonical: 'Leadership', category: 'soft_skill', variants: ['leadership', 'team lead', 'people management'] },
  { canonical: 'Communication', category: 'soft_skill', variants: ['communication skills', 'verbal communication', 'written communication'] },
  { canonical: 'Problem Solving', category: 'soft_skill', variants: ['problem solving', 'problem-solving'] },
  { canonical: 'Mentorship', category: 'soft_skill', variants: ['mentorship', 'mentoring', 'coaching'] },
];

/**
 * Flat lookup: normalized variant string -> taxonomy entry.
 * Built once at module load for O(1) matching.
 */
export const VARIANT_LOOKUP: Map<string, TaxonomyEntry> = new Map();
for (const entry of SKILLS_TAXONOMY) {
  for (const variant of entry.variants) {
    VARIANT_LOOKUP.set(variant.toLowerCase(), entry);
  }
}

/** Longest variant phrase (in words) — bounds n-gram window during scanning. */
export const MAX_VARIANT_WORDS = Math.max(
  ...SKILLS_TAXONOMY.flatMap((e) => e.variants.map((v) => v.split(/\s+/).length))
);

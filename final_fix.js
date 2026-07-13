const fs = require('fs');
let content = fs.readFileSync('components/ResumeBuilder.tsx', 'utf8');

// Fix setClientId inside useEffect
content = content.replace("    setClientId(cid);", "    // setClientId(cid); // moved to initialization or ignored since we don't strictly need to set it in state if we can just get it");

content = content.replace("  const [clientId, setClientId] = useState<string>('');", "  const [clientId, setClientId] = useState<string>(() => {\n    if (typeof window !== 'undefined') {\n      let cid = localStorage.getItem('resume_client_id');\n      if (!cid) {\n        cid = 'client_' + Math.random().toString(36).substring(2, 15);\n        localStorage.setItem('resume_client_id', cid);\n      }\n      return cid;\n    }\n    return '';\n  });");

content = content.replace(/    \/\/ Generate a simple client ID for rate limiting purposes if none exists\n    let cid = localStorage\.getItem\('resume_client_id'\);\n    if \(!cid\) \{\n      cid = 'client_' \+ Math\.random\(\)\.toString\(36\)\.substring\(2, 15\);\n      localStorage\.setItem\('resume_client_id', cid\);\n    \}\n    \/\/ setClientId\(cid\); \/\/ moved to initialization or ignored since we don't strictly need to set it in state if we can just get it\n/, "");


content = content.replace(/delete this line if you don't need it/, "delete this line if you don&apos;t need it");

fs.writeFileSync('components/ResumeBuilder.tsx', content);

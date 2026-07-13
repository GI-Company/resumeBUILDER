const fs = require('fs');
let content = fs.readFileSync('components/ResumeBuilder.tsx', 'utf8');
content = content.replace(/  <\/div>\n  \);\n\}$/, '  </div>\n  );\n}');
content = content.replace(/<\/div>      <\/div>    <\/div>  <\/div>  \);\}/, '        </div>\n      </div>\n    </div>\n  </div>\n  );\n}');
fs.writeFileSync('components/ResumeBuilder.tsx', content);

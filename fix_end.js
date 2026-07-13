const fs = require('fs');
let content = fs.readFileSync('components/ResumeBuilder.tsx', 'utf8');

const regex = /        <\/div>      <\/div>    <\/div>  \);\}$/m;
if (regex.test(content)) {
  content = content.replace(regex, "        </div>\n      </div>\n      </div>\n    </div>\n  );\n}");
} else {
  // If it is on a single line at the end:
  content = content.replace(/<\/div>      <\/div>    <\/div>  \);\}/, "</div></div></div></div>);}");
}

fs.writeFileSync('components/ResumeBuilder.tsx', content);

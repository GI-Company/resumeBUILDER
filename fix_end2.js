const fs = require('fs');
let content = fs.readFileSync('components/ResumeBuilder.tsx', 'utf8');

const replacement = `        </div>
      </div>
    </div>
  </div>
  );
}`;

// match from <div className="page-footer ... to end of file
content = content.replace(/          <div className="page-footer[\s\S]*?\}\n*$/, 
  `          <div className="page-footer text-center font-sans text-[10px] text-[#a19b9d] mt-4 outline-none" contentEditable suppressContentEditableWarning>Your Name</div>\n${replacement}`);

fs.writeFileSync('components/ResumeBuilder.tsx', content);

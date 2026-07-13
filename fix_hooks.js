const fs = require('fs');
let content = fs.readFileSync('components/ResumeBuilder.tsx', 'utf8');

// Remove loadResumeFromCloud from bottom and move to top
content = content.replace(/  const loadResumeFromCloud = async \(id: string\) => {[\s\S]*?  };\n/m, '');
content = content.replace(/  const fetchMyResumes = async \(\) => {[\s\S]*?  };\n/m, '');

const funcs = `  const fetchMyResumes = async () => {
    try {
      const { data, error } = await supabase.from('resumes').select('id, updated_at').order('updated_at', { ascending: false });
      if (error) throw error;
      setMyResumes(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadResumeFromCloud = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('content')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (data && data.content) {
        const c = data.content as any;
        if (c.design) setDesign(c.design);
        if (c.sections) setSections(c.sections);
        if (c.manualBreaks) setManualBreaks(c.manualBreaks);
        if (c.licenses) setLicenses(c.licenses);
        if (c.skills) setSkills(c.skills);
        if (c.experiences) setExperiences(c.experiences);
        if (c.educations) setEducations(c.educations);
      }
    } catch (err: any) {
      toast.error('Failed to load resume: ' + err.message);
    }
  };

`;

content = content.replace("  useEffect(() => {", funcs + "  useEffect(() => {");
content = content.replace("Don't have an account?", "Don&apos;t have an account?");

fs.writeFileSync('components/ResumeBuilder.tsx', content);

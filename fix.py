import re

with open("components/ResumeBuilder.tsx", "r") as f:
    content = f.read()

# Pattern:
# onBlur={(e) =html={name} onChange={(val) => {  }}> {
#   const val = e.currentTarget.innerHTML;
#   setName(val);
# }}
# />

# wait, we can just replace the whole mess

# We want to match:
# onBlur=\{\(e\) =html=\{(.*?)\} onChange=\{\(val\) => \{  \}\}> \{\s*const val = e\.currentTarget\.innerHTML;\s*(.*?)\s*\}\}
# and replace with:
# html={$1} onChange={(val) => { $2 }}

def replacer(match):
    html_val = match.group(1)
    body = match.group(2)
    return f'html={{{html_val}}} onChange={{(val) => {{ {body} }}}}'

content = re.sub(r'onBlur=\{\(e\) =html=\{(.*?)\} onChange=\{\(val\) => \{  \}\}> \{\s*const val = e\.currentTarget\.innerHTML;\s*(.*?)\s*\}\}', replacer, content, flags=re.DOTALL)

with open("components/ResumeBuilder.tsx", "w") as f:
    f.write(content)

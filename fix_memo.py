import re

with open("components/ResumeBuilder.tsx", "r") as f:
    content = f.read()

# Replace const PageBreakGap = (
content = re.sub(r'const PageBreakGap = \(\{', 'const PageBreakGap = memo(({', content, count=1)
# Replace component end: wait, it's safer to just replace `const PageBreakGap = ({...` with `const PageBreakGap = memo(({...`
# But we have to close the memo parenthesis at the end!
# Actually, since it's just a few components, I can use regex to find where they end or just use sed/awk.
# Better to do it manually for the 4 components.

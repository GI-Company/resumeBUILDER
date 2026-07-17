import re

with open("components/ResumeBuilder.tsx", "r") as f:
    content = f.read()

# Replace <div ... contentEditable ... dangerouslySetInnerHTML ... onBlur ... />
# Actually, it's easier to find contentEditable and replace its attributes.

def repl(match):
    tag = match.group(1) # div or span
    before = match.group(2)
    after = match.group(3)
    
    # Extract dangerouslySetInnerHTML
    html_match = re.search(r'dangerouslySetInnerHTML=\{\{\s*__html:\s*(.*?)\s*\}\}', after)
    html_val = html_match.group(1) if html_match else '""'
    
    # Extract onBlur body
    onblur_match = re.search(r'onBlur=\{\(e\)\s*=>\s*\{\s*const val = e\.currentTarget\.innerHTML;\s*(.*?)\s*\}\}', after, re.DOTALL)
    onblur_body = onblur_match.group(1) if onblur_match else ''
    
    # Remove the extracted parts from 'after'
    after_clean = re.sub(r'contentEditable\s*', '', after)
    after_clean = re.sub(r'suppressContentEditableWarning\s*', '', after_clean)
    after_clean = re.sub(r'dangerouslySetInnerHTML=\{\{\s*__html:\s*.*?\s*\}\}\s*', '', after_clean)
    after_clean = re.sub(r'onBlur=\{\(e\)\s*=>\s*\{\s*const val = e\.currentTarget\.innerHTML;\s*.*?\s*\}\}\s*', '', after_clean, flags=re.DOTALL)
    
    # Construct the new string
    # We replace <tag with <ContentEditableField tagName="tag"
    return f'<ContentEditableField tagName="{tag}"{before}{after_clean}html={{{html_val}}} onChange={{(val) => {{ {onblur_body} }}}}'

# We'll match from <div or <span up to the closing > 
# Note that we only want to match tags containing contentEditable.
# Since regex for HTML is tricky, we can split by "<" and process tags.
parts = content.split("<")
new_parts = [parts[0]]
for part in parts[1:]:
    if "contentEditable" in part and ("div" == part[:3] or "span" == part[:4]):
        tag_end = part.find(">")
        if tag_end != -1:
            tag_content = part[:tag_end]
            rest = part[tag_end:]
            
            # extract tag name
            tag_name = "div" if part.startswith("div") else "span"
            
            # replace inside tag_content
            # It's easier to just use regex on the whole tag_content
            html_match = re.search(r'dangerouslySetInnerHTML=\{\{\s*__html:\s*(.*?)\s*\}\}', tag_content)
            html_val = html_match.group(1) if html_match else '""'
            
            onblur_match = re.search(r'onBlur=\{\([^)]*\)\s*=>\s*\{\s*const val = [^;]+;\s*(.*?)\s*\}\}', tag_content, re.DOTALL)
            onblur_body = onblur_match.group(1) if onblur_match else ''
            
            clean = re.sub(r'contentEditable\s*', '', tag_content)
            clean = re.sub(r'suppressContentEditableWarning\s*', '', clean)
            clean = re.sub(r'dangerouslySetInnerHTML=\{\{\s*__html:\s*.*?\s*\}\}\s*', '', clean)
            clean = re.sub(r'onBlur=\{\([^)]*\)\s*=>\s*\{\s*const val = [^;]+;\s*.*?\s*\}\}\s*', '', clean, flags=re.DOTALL)
            
            clean = clean[len(tag_name):] # remove 'div' or 'span'
            
            new_part = f'ContentEditableField tagName="{tag_name}"{clean}html={{{html_val}}} onChange={{(val) => {{ {onblur_body} }}}}' + rest
            
            # Also we need to change closing tags from </div> or </span> to </ContentEditableField>
            # BUT some tags are self-closing `/>` !
            # If tag_content ends with `/`, then it's self-closing.
            # We don't have to change closing tags if it's self closing.
            if new_part.find("/>") == -1:
                # it's not self-closing. Wait, what if it's `> ... </div>`? We have to replace the closing tag manually.
                # Actually, all contentEditable in this file are self-closing!
                pass
                
            new_parts.append(new_part)
        else:
            new_parts.append(part)
    elif "contentEditable" in part and part.startswith("h"): # h3 etc?
        pass # none in current file probably
    else:
        new_parts.append(part)

content = "<".join(new_parts)

# Wait, check if there are any closing tags like `</div>` that correspond to the div we changed.
# None of the contentEditables we saw had children, they used dangerouslySetInnerHTML and were self-closing `/>` or `></...>`
# Let's fix `></div` or `></span` if they exist.
# The easiest is just replace `></ContentEditableField>` where appropriate, or just rely on self-closing.
# All the ones I checked were `/>`.
# Let's print out what we found.
with open("components/ResumeBuilder.tsx", "w") as f:
    f.write(content)

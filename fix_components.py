with open("components/ResumeBuilder.tsx", "r") as f:
    lines = f.readlines()

def wrap_memo(start_str, end_str=None, end_line_offset=None):
    start_idx = -1
    for i, line in enumerate(lines):
        if line.startswith(start_str):
            start_idx = i
            break
    if start_idx == -1: return

    lines[start_idx] = lines[start_idx].replace(start_str, start_str.replace(" = ({", " = memo(({").replace(" = (props", " = memo((props").replace(" = ({ dragControls }", " = memo(({ dragControls }"))
    
    if end_str:
        for i in range(start_idx, len(lines)):
            if lines[i].startswith(end_str):
                lines[i] = lines[i].replace(end_str, end_str.replace("};", "});").replace(");", ");)"))
                break

wrap_memo("const PageBreakGap = ({", "};")
wrap_memo("const DragHandle = ({", ");")
wrap_memo("const SubItemWrapper = ({", "};")
wrap_memo("const SectionWrapper = ({", "};")

with open("components/ResumeBuilder.tsx", "w") as f:
    f.writelines(lines)

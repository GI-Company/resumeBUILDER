with open("components/ResumeBuilder.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'import React, { useState, useEffect, useRef, useCallback } from "react";',
    'import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";\nimport { ContentEditableField } from "./ContentEditableField";'
)

with open("components/ResumeBuilder.tsx", "w") as f:
    f.write(content)

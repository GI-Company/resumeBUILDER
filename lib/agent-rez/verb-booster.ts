export const verbReplacements: Record<string, string> = {
  "worked on": "engineered",
  "did": "executed",
  "helped": "spearheaded",
  "helped with": "collaborated to engineer",
  "built": "architected and deployed",
  "made": "designed and developed",
  "created": "pioneered",
  "managed": "orchestrated",
  "improved": "optimized",
  "added": "integrated",
};

export function boostVerbs(text: string): { text: string; replacements: number } {
  let count = 0;
  let newText = text;
  
  Object.keys(verbReplacements).forEach((weak) => {
    const regex = new RegExp(`\\b${weak}\\b`, "gi");
    if (regex.test(newText)) {
      newText = newText.replace(regex, verbReplacements[weak]);
      count++;
    }
  });

  return { text: newText, replacements: count };
}

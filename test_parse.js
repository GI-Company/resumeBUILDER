const chunks = [
  'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
  'data: {"choices":[{"delta":{"content":"lo "}}]}\n\n',
  'data: {"choices":[{"delta":{"content":"World!"}}]}\n\n',
  'data: [DONE]\n\n'
];

let buffer = "";
let accumulated = "";

for (const chunk of chunks) {
  buffer += chunk;
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";
  
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6).trim();
      if (data === "[DONE]") break;
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content ?? "";
        if (token) {
          accumulated += token;
        }
      } catch (e) { console.error("Parse error:", e); }
    }
  }
}
console.log("Accumulated:", accumulated);

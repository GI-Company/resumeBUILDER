fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=invalid", {
  method: "POST",
  body: JSON.stringify({
    systemInstruction: { parts: [{ text: "System" }] },
    contents: [{ parts: [{ text: "Hello" }] }]
  })
}).then(r => r.json()).then(console.log);

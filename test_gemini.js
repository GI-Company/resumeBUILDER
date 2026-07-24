fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=invalid", {
  method: "POST",
  body: JSON.stringify({
    contents: [{ parts: [{ inlineData: { mimeType: "image/png", data: "123" } }] }]
  })
}).then(r => r.json()).then(console.log);

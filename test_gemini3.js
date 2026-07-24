console.log(JSON.stringify({
  systemInstruction: { parts: [{ text: "Hello" }] },
  contents: [
    {
      parts: [
        { text: "Parse this" },
        {
          inlineData: {
            mimeType: "application/pdf",
            data: "base64..."
          },
        },
      ],
    },
  ],
  generationConfig: {
    temperature: 0.1,
    responseMimeType: "application/json",
  },
}));

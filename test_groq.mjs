import fetch from 'node-fetch';

async function test() {
  console.log("Starting test...");
  try {
    const res = await fetch("http://localhost:3000/api/groq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "Say hello",
        systemPrompt: "You are a bot",
        temperature: 0.5,
        aiAction: "general"
      })
    });
    
    console.log("Status:", res.status);
    
    // read stream
    const reader = res.body;
    reader.on('data', chunk => {
      console.log("Chunk:", chunk.toString());
    });
    reader.on('end', () => {
      console.log("Stream ended.");
    });
  } catch (e) {
    console.error(e);
  }
}

test();

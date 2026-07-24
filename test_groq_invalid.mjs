import fetch from 'node-fetch';

async function test() {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer fake_key_for_test_we_just_want_status"
    },
    body: JSON.stringify({
      model: "invalid_model_123",
      stream: true,
      messages: [{ role: "user", content: "Hi" }]
    })
  });
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}
test();

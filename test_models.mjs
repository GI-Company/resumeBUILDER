import fetch from 'node-fetch';

async function test() {
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: {
      "Authorization": "Bearer fake_key_just_to_check"
    }
  });
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
}
test();

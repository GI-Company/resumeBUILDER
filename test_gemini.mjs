import fetch from 'node-fetch';

const apiKey = process.env.API_KEY || "YOUR_KEY"; // Just checking the URL format
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

console.log("URL structure is:", url);

import 'dotenv/config';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

console.log("Testing with hardcoded key...");
console.log("Key length:", apiKey.length);

const openai = new OpenAI({ apiKey });

async function test() {
    try {
        console.log("Sending request...");
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Hello" }],
        });
        console.log("Success! Response:", completion.choices[0].message.content);
    } catch (error) {
        console.error("Failed:", error.message);
        if (error.response) {
            console.error("Status:", error.status);
            console.error("Type:", error.type);
            console.error("Code:", error.code);
        }
    }
}

test();

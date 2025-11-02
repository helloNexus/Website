// api/chat.js
export default async function handler(req, res) {
  try {
    const { prompt } = await req.json();

    const HF_KEY = process.env.HF_KEY; // secret stored in GitHub

    const response = await fetch(
      "https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 300 },
        }),
      }
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

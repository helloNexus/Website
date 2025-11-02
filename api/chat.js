// /api/chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ text: "Method not allowed" });
  }

  try {
    const { prompt } = req.body; // Vercel parses JSON automatically

    const HF_KEY = process.env.HF_KEY;
    if (!HF_KEY) return res.status(500).json({ text: "HF_KEY not set" });

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
          options: { wait_for_model: true },
          parameters: { max_new_tokens: 300 },
        }),
      }
    );

    const data = await response.json();
    console.log("HF API response:", data);

    if (Array.isArray(data)) return res.status(200).json({ text: data[0]?.generated_text || "No response from AI." });
    if (data.generated_text) return res.status(200).json({ text: data.generated_text });

    return res.status(200).json({ text: "No response from AI." });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ text: "Error connecting to AI." });
  }
}


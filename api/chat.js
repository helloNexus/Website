// api/chat.js
export default async function handler(req, res) {
  try {
    const { prompt } = await req.json();
    const HF_KEY = process.env.HF_KEY;

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
          options: { wait_for_model: true }, // ensures model is ready
          parameters: { max_new_tokens: 300 },
        }),
      }
    );

    const data = await response.json();
    console.log("HF API response:", data);

    // Hugging Face sometimes returns array of objects
    if (Array.isArray(data)) {
      return res.status(200).json({ text: data[0]?.generated_text || "No response from AI." });
    }
    if (data.generated_text) {
      return res.status(200).json({ text: data.generated_text });
    }

    res.status(200).json({ text: "No response from AI." });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ text: "Error connecting to AI." });
  }
}

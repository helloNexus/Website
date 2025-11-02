export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ text: "Method not allowed" });

  const { prompt } = req.body;
  const HF_KEY = process.env.HF_KEY; // store securely in Vercel

  if (!HF_KEY) return res.status(500).json({ text: "HF_KEY not set" });

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/meta-llama/Llama-4-Scout-17B-16E-Instruct",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          options: { wait_for_model: true },
          parameters: { max_new_tokens: 500 },
        }),
      }
    );

    const textBody = await response.text(); // read once

    let data;
    try {
      data = JSON.parse(textBody);
    } catch {
      console.error("HF returned non-JSON:", textBody);
      return res.status(500).json({ text: "HF returned invalid response" });
    }

    if (Array.isArray(data)) return res.status(200).json({ text: data[0]?.generated_text || "No response from AI." });
    if (data.generated_text) return res.status(200).json({ text: data.generated_text });

    return res.status(200).json({ text: "No response from AI." });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ text: "Error connecting to AI." });
  }
}

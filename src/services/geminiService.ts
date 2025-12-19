const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export const getApiKey = (): string | null => {
  return localStorage.getItem("gemini_api_key");
};

export const setApiKey = (key: string): void => {
  localStorage.setItem("gemini_api_key", key);
};

export const extractAndFormatText = async (
  imageBase64: string,
  template: string
): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  // Remove the data URL prefix if present
  const base64Data = imageBase64.includes(",") 
    ? imageBase64.split(",")[1] 
    : imageBase64;

  const prompt = `You are a text extraction and formatting assistant. 

1. First, extract ALL text from the provided image using OCR.
2. Then, format the extracted text according to this template/instructions:

${template}

Important:
- Extract text accurately from the image
- Apply the formatting template to the extracted text
- Only return the final formatted result, nothing else
- If the template contains placeholders or structure, fill them with the extracted text appropriately`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to process image");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No text extracted from image");
  }

  return text;
};

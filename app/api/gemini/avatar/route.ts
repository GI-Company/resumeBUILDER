import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, aspectRatio = "1:1" } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing prompt for image generation" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is not set." },
        { status: 500 }
      );
    }

    // Call Imagen 3 model to generate professional portrait
    const response = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: `${prompt}, professional portrait, high resolution, sharp focus, studio lighting, clean background`,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio: aspectRatio === "3:4" ? "3:4" : aspectRatio === "4:3" ? "4:3" : "1:1",
      },
    });

    if (
      !response.generatedImages ||
      response.generatedImages.length === 0 ||
      !response.generatedImages[0].image?.imageBytes
    ) {
      throw new Error("No image was returned by the generation model.");
    }

    const base64Image = response.generatedImages[0].image.imageBytes;
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    return NextResponse.json({ success: true, url: dataUrl });
  } catch (error: any) {
    console.error("AI Headshot Generator route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate professional headshot" },
      { status: 500 }
    );
  }
}

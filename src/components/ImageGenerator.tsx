import { GoogleGenAI } from "@google/genai";
import { useState, useEffect } from "react";
import { Image as ImageIcon, Loader2, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function ImageGenerator({ onImageGenerated, promptOverride }: { onImageGenerated?: (url: string) => void, promptOverride?: string }) {
  const [prompt, setPrompt] = useState(promptOverride || '');
  const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (promptOverride && !prompt) {
      setPrompt(promptOverride);
    }
  }, [promptOverride]);

  const generateImage = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setImageUrl(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: `Generate a high quality product photo of: ${prompt}. Professional lighting, clean background, village grocery store style.` }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: size
          }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          const url = `data:image/png;base64,${base64Data}`;
          setImageUrl(url);
          if (onImageGenerated) onImageGenerated(url);
          break;
        }
      }
    } catch (error) {
      console.error("Image generation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-orange-100 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Sparkles className="w-5 h-5" />
          AI Product Visualizer
        </CardTitle>
        <CardDescription>
          Generate high-quality images of products you want to see in our store.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Fresh organic mangoes in a basket"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={generateImage} 
              disabled={isLoading || !prompt.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
            </Button>
          </div>

          <div className="flex items-center justify-between bg-orange-50 p-3 rounded-lg">
            <span className="text-sm font-medium text-orange-800">Image Quality:</span>
            <Tabs value={size} onValueChange={(v) => setSize(v as any)} className="w-auto">
              <TabsList className="bg-orange-100">
                <TabsTrigger value="1K" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">1K</TabsTrigger>
                <TabsTrigger value="2K" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">2K</TabsTrigger>
                <TabsTrigger value="4K" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">4K</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="aspect-square w-full relative bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-orange-200 flex items-center justify-center">
          {imageUrl ? (
            <>
              <img 
                src={imageUrl} 
                alt="Generated product" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = imageUrl;
                  link.download = 'jmb-mart-product.png';
                  link.click();
                }}
              >
                <Download className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <div className="text-center p-8">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
                  <p className="text-orange-800 font-medium animate-pulse">Creating your image...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <ImageIcon className="w-12 h-12" />
                  <p>Your generated product image will appear here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

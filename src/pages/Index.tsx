import { useState, useEffect } from "react";
import { Upload, FileText, Sparkles, Copy, Check, Key, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { extractAndFormatText, getApiKey, setApiKey } from "@/services/geminiService";

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [template, setTemplate] = useState("");
  const [formattedText, setFormattedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKeyState] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedKey = getApiKey();
    if (savedKey) {
      setApiKeyState(savedKey);
    } else {
      setShowApiKey(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      setApiKey(apiKey.trim());
      setShowApiKey(false);
      toast({ title: "API Key Saved" });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFormat = async () => {
    if (!selectedImage || !template.trim() || !getApiKey()) {
      toast({
        title: "Missing input",
        description: "Please provide template, image, and API key.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await extractAndFormatText(imagePreview, template);
      setFormattedText(result);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Image to Formatted Text</h1>
          <div className="flex items-center justify-center gap-2">
            {showApiKey ? (
              <div className="flex gap-2 items-center">
                <Input
                  type="password"
                  placeholder="Gemini API Key"
                  value={apiKey}
                  onChange={(e) => setApiKeyState(e.target.value)}
                  className="w-64"
                />
                <Button size="sm" onClick={handleSaveApiKey}>Save</Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setShowApiKey(true)}>
                <Settings className="w-4 h-4 mr-1" /> API Key
              </Button>
            )}
          </div>
        </div>

        {/* 3 Column Layout */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* 1. Template */}
          <Card className="p-4 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              1. Template
            </h2>
            <Textarea
              placeholder={`Enter your template format, e.g.:
Name: [name]
Email: [email]
Phone: [phone]

Or instructions like:
"Convert to bullet points"
"Format as JSON"`}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="min-h-[300px] text-sm"
            />
          </Card>

          {/* 2. Image */}
          <Card className="p-4 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              2. Image
            </h2>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer min-h-[300px] flex items-center justify-center"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer w-full">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="max-h-[280px] mx-auto rounded object-contain" />
                ) : (
                  <div className="text-muted-foreground">
                    <Upload className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>Drop image or click to upload</p>
                  </div>
                )}
              </label>
            </div>
          </Card>

          {/* 3. Result */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                3. Formatted Result
              </h2>
              {formattedText && (
                <Button size="sm" variant="ghost" onClick={copyToClipboard}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              )}
            </div>
            <Textarea
              value={formattedText}
              onChange={(e) => setFormattedText(e.target.value)}
              placeholder="Result will appear here..."
              className="min-h-[300px] font-mono text-sm"
            />
          </Card>
        </div>

        {/* Process Button */}
        <div className="flex justify-center">
          <Button onClick={handleFormat} size="lg" disabled={isProcessing} className="px-8">
            {isProcessing ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Extract & Format
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;

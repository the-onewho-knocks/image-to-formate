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
      toast({
        title: "API Key Saved",
        description: "Your Gemini API key has been saved locally.",
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormat = async () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please upload an image first.",
        variant: "destructive",
      });
      return;
    }

    if (!template.trim()) {
      toast({
        title: "No template provided",
        description: "Please enter a template or formatting instructions.",
        variant: "destructive",
      });
      return;
    }

    if (!getApiKey()) {
      setShowApiKey(true);
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await extractAndFormatText(imagePreview, template);
      setFormattedText(result);
      toast({
        title: "Success!",
        description: "Text extracted and formatted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process image",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Formatted text copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary-foreground">AI-Powered Text Formatter</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold gradient-text">
            Image to Formatted Text
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload an image, provide a template, and get perfectly formatted text using Gemini AI
          </p>
        </div>

        {/* API Key Section */}
        {showApiKey && (
          <Card className="p-6 bg-card/50 backdrop-blur border-border max-w-xl mx-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Gemini API Key</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter your Gemini API key to enable text extraction. Get one free at{" "}
                <a 
                  href="https://aistudio.google.com/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google AI Studio
                </a>
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter your Gemini API key"
                  value={apiKey}
                  onChange={(e) => setApiKeyState(e.target.value)}
                  className="bg-background/50"
                />
                <Button onClick={handleSaveApiKey}>Save</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Settings Toggle */}
        {!showApiKey && (
          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowApiKey(true)}
              className="text-muted-foreground"
            >
              <Settings className="w-4 h-4 mr-2" />
              Change API Key
            </Button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="p-6 space-y-6 bg-card/50 backdrop-blur border-border glow-card hover-scale">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Upload className="w-6 h-6 text-primary" />
                Upload Image
              </h2>
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to select an image with text
              </p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer space-y-4 block">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg object-contain"
                    />
                    <p className="text-sm text-muted-foreground">
                      {selectedImage?.name}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-muted-foreground">
                        PNG, JPG, or WEBP
                      </p>
                    </div>
                  </>
                )}
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Template / Format Instructions</label>
              <Textarea
                placeholder={`Example templates:
• "Name: [name]\nEmail: [email]\nPhone: [phone]"
• "Convert to bullet points"
• "Format as a professional email"
• "Extract only dates and times"
• "Create a JSON object with the data"`}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="min-h-32 bg-background/50"
              />
            </div>

            <Button
              onClick={handleFormat}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Extract & Format
                </>
              )}
            </Button>
          </Card>

          {/* Results Section */}
          <Card className="p-6 space-y-6 bg-card/50 backdrop-blur border-border glow-card">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <FileText className="w-6 h-6 text-secondary" />
                Formatted Result
              </h2>
              <p className="text-sm text-muted-foreground">
                Your formatted text will appear here
              </p>
            </div>

            <div className="relative">
              <Textarea
                value={formattedText}
                onChange={(e) => setFormattedText(e.target.value)}
                placeholder="Formatted text will appear here after processing..."
                className="min-h-[400px] bg-background/50 font-mono text-sm"
              />
              {formattedText && (
                <Button
                  onClick={copyToClipboard}
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 pt-8">
          <Card className="p-6 text-center space-y-3 bg-card/30 backdrop-blur border-border hover-scale">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Gemini AI OCR</h3>
            <p className="text-sm text-muted-foreground">
              Powerful text extraction from any image using Google's Gemini
            </p>
          </Card>

          <Card className="p-6 text-center space-y-3 bg-card/30 backdrop-blur border-border hover-scale">
            <div className="w-12 h-12 mx-auto rounded-full bg-secondary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-semibold">Template Formatting</h3>
            <p className="text-sm text-muted-foreground">
              Define your own templates to format extracted text exactly how you need
            </p>
          </Card>

          <Card className="p-6 text-center space-y-3 bg-card/30 backdrop-blur border-border hover-scale">
            <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
              <Copy className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold">100% Local</h3>
            <p className="text-sm text-muted-foreground">
              Your API key stays in your browser - no server required
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;

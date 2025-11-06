import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ImageUploadProps {
  currentImage?: string | null;
  onImageChange: (imageUrl: string) => void;
  label?: string;
}

export function ImageUpload({ currentImage, onImageChange, label = "Upload Image" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const uploadMutation = trpc.upload.image.useMutation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Convert file to base64 for upload to S3
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Upload to S3 via tRPC
      const result = await uploadMutation.mutateAsync({
        image: base64,
        filename: file.name,
      });

      onImageChange(result.url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageChange("");
    toast.success("Image removed");
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">{label}</label>
      
      {previewUrl ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview"
            className="h-32 w-32 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors">
              <Upload className="h-4 w-4" />
              <span className="text-sm">{uploading ? "Uploading..." : "Choose Image"}</span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Recommended: Square image, max 5MB (JPG, PNG, WebP)
      </p>
    </div>
  );
}

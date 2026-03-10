"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import toast from "react-hot-toast";

interface MediaPickerProps {
  value: string;
  onChange: (url: string) => void;
}

export default function MediaPicker({ value, onChange }: MediaPickerProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      const res = await fetch("/api/assets/upload", { method: "POST" });
      const data = await res.json();
      onChange(data.url);
      toast.success("Image uploaded (mock)");
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Cover"
            className="h-40 w-72 rounded-lg border object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 text-gray-500 hover:border-gray-400 hover:text-gray-700"
        >
          <ImagePlus size={24} />
          <span>{isUploading ? "Uploading..." : "Add Cover Image"}</span>
        </button>
      )}
    </div>
  );
}

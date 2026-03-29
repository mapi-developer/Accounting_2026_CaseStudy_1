"use client";

import { useState } from "react";

export default function FileUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const response = await fetch("http://localhost:8000/upload/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("File uploaded and processed!");
        onUploadSuccess(); // Refresh the list
      } else {
        alert("Upload failed.");
      }
    } catch (error) {
      console.error("Error uploading:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <label className={`cursor-pointer rounded-lg bg-green-600 px-6 py-2 text-white font-medium hover:bg-green-700 transition-colors ${uploading ? 'opacity-50' : ''}`}>
        {uploading ? "Processing..." : "Upload PDF"}
        <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} disabled={uploading} />
      </label>
    </div>
  );
}
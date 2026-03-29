"use client";

import { useState } from "react";

export default function FileUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    // Append ALL selected files to the form data
    Array.from(e.target.files).forEach((file) => {
        formData.append("files", file); // Notice this is "files" (plural) to match FastAPI
    });

    try {
      const response = await fetch("http://16.171.7.91:8000/upload/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Files uploaded successfully!");
        onUploadSuccess(); // Refresh the document list
      } else {
        alert("Upload failed.");
      }
    } catch (error) {
      console.error("Error uploading:", error);
    } finally {
      setUploading(false);
      e.target.value = ""; // Clear the input so you can re-upload if needed
    }
  };

  return (
    <div className="flex items-center gap-4">
      <label className={`cursor-pointer rounded-lg bg-green-600 px-6 py-2 text-white font-medium hover:bg-green-700 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {uploading ? "Processing..." : "Upload PDFs"}
        {/* The 'multiple' attribute allows selecting multiple files at once */}
        <input 
          type="file" 
          className="hidden" 
          accept=".pdf" 
          multiple 
          onChange={handleFileChange} 
          disabled={uploading} 
        />
      </label>
    </div>
  );
}
// frontend/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import FileUpload from "@/components/FileUpload";

interface Document {
  id: number;
  filename: string;
  file_path: string;
  uploaded_at: string;
}

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState("");

  // Fetch documents from FastAPI
  const fetchDocs = async (query = "") => {
    const res = await fetch(`http://localhost:8000/documents/?search=${query}`);
    const data = await res.json();
    setDocuments(data);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocs(search);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-12 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Accounting Case Study</h1>
        
        <div className="flex items-center gap-4">
          <FileUpload onUploadSuccess={() => fetchDocs(search)} />
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search inside files..."
              className="w-80 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="rounded-lg bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700">
              Search
            </button>
          </form>
        </div>
      </header>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded bg-red-100 flex items-center justify-center text-red-600 font-bold">PDF</div>
              <h3 className="font-semibold text-gray-800 truncate">{doc.filename}</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</p>
            <button className="w-full rounded-lg border border-blue-600 py-2 text-blue-600 font-medium hover:bg-blue-50">
              View & Comment
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FileUpload from "@/components/FileUpload"; // Adjust path if you use `src/` or `@/`

interface Document {
  id: number;
  filename: string;
  file_path: string;
  uploaded_at: string;
}

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState("");

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    const res = await fetch(`http://localhost:8000/documents/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      // Refresh the list after successful deletion
      fetchDocs(search);
    } else {
      alert("Failed to delete document");
    }
  };

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
              className="w-80 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 text-black"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="rounded-lg bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700">
              Search
            </button>
          </form>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded bg-red-100 flex items-center justify-center text-red-600 font-bold">PDF</div>
              <h3 className="font-semibold text-gray-800 truncate" title={doc.filename}>{doc.filename}</h3>
              <button 
                onClick={() => handleDelete(doc.id)}
                className="top-4 right-4 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete Document"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</p>
            
            {/* The Link to the split-screen Document Viewer */}
            <Link href={`/document/${doc.id}`}>
              <button className="w-full rounded-lg border border-blue-600 py-2 text-blue-600 font-medium hover:bg-blue-50 transition-colors">
                View & Comment
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
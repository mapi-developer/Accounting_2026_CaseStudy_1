"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FileUpload from "@/components/FileUpload";

interface Document {
  id: number;
  filename: string;
  file_path: string;
  uploaded_at: string;
  tags: { id: number; name: string; color: string }[];
}

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  // Fix: Accept 'query' as an argument to resolve the TypeScript error
  const fetchDocs = async (query: string = search) => {
    const tagArray = tagFilter.split(",").map(t => t.trim()).filter(t => t !== "");
    const tagParams = tagArray.map(t => `tags=${t}`).join("&");
    
    const url = `http://localhost:8000/documents/?search=${query}&${tagParams}`;
    
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    const res = await fetch(`http://localhost:8000/documents/${id}`, { method: "DELETE" });
    if (res.ok) fetchDocs();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Accounting Case Study</h1>
          {/* Upload Button Restored */}
          <FileUpload onUploadSuccess={() => fetchDocs()} />
        </div>
        
        {/* Advanced Filter Bar Restored */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Search Content & Names</label>
            <input
              type="text"
              placeholder="Search words inside PDFs..."
              className="w-full mt-1 border-none focus:ring-0 text-sm text-black"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 border-l pl-4">
            <label className="text-xs font-semibold text-gray-500 uppercase">Filter by Tags</label>
            <input
              type="text"
              placeholder="e.g. Invoice, Q1..."
              className="w-full mt-1 border-none focus:ring-0 text-sm text-black"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            />
          </div>
          <button 
            onClick={() => fetchDocs(search)}
            className="bg-blue-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </header>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
            {/* Delete Button */}
            <button 
              onClick={() => handleDelete(doc.id)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">PDF</div>
              <h3 className="font-semibold text-gray-800 truncate pr-6" title={doc.filename}>{doc.filename}</h3>
            </div>
            
            {/* Display Current Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {doc.tags?.map(tag => (
                <span key={tag.id} className="px-2 py-0.5 rounded-full text-[10px] text-white" style={{backgroundColor: tag.color}}>
                  {tag.name}
                </span>
              ))}
            </div>

            <Link href={`/document/${doc.id}`}>
              <button className="w-full rounded-lg border border-blue-600 py-2 text-blue-600 font-medium hover:bg-blue-50">
                View & Comment
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
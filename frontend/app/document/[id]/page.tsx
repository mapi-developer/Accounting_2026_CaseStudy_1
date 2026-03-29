"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// Ensure this path matches your folder structure
import TagManager from "@/components/TagManager"; 

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [document, setDocument] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  
  // Initialize the PDF layout plugin
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    if (!documentId) return;
    fetch(`https://api.matveipisarev.me/documents/${documentId}`)
      .then((res) => res.json())
      .then((data) => setDocument(data))
      .catch((err) => console.error("Error fetching document:", err));
  }, [documentId]);

  // --- STRICT PRESERVATION: Note Saving Logic ---
  const handleAddComment = async () => {
    if (!newComment.trim() || !documentId) return;
    const res = await fetch(`https://api.matveipisarev.me/documents/${documentId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    });
    if (res.ok) {
      const addedComment = await res.json();
      setDocument({ ...document, comments: [...(document.comments || []), addedComment] });
      setNewComment("");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    const res = await fetch(`https://api.matveipisarev.me/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) {
      setDocument({
        ...document,
        comments: document.comments.filter((c: any) => c.id !== commentId)
      });
    }
  };

  // --- NEW: Handle Document Deletion from inside the viewer ---
  const handleDeleteDocument = async () => {
    if (!confirm("Are you sure you want to completely delete this document and all its notes?")) return;
    
    const res = await fetch(`https://api.matveipisarev.me/documents/${documentId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.push('/'); // Route back to the dashboard automatically
    } else {
      alert("Failed to delete document");
    }
  };

  if (!document) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 animate-pulse font-medium">Loading Document...</p>
      </div>
    );
  }

  const pdfUrl = `https://api.matveipisarev.me/files/${document.filename}`;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      
      {/* LEFT/TOP SIDE: Inline PDF Viewer (Mobile: 60vh, Desktop: Full height) */}
      <div className="h-[60vh] md:h-full md:w-2/3 border-b md:border-b-0 md:border-r border-gray-200 bg-white relative">
        <div className="absolute inset-0 overflow-y-auto">
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer fileUrl={pdfUrl} plugins={[defaultLayoutPluginInstance]} />
          </Worker>
        </div>
      </div>

      {/* RIGHT/BOTTOM SIDE: Sidebar (Mobile: 40vh, Desktop: Full height) */}
      <div className="h-[40vh] md:h-full md:w-1/3 flex flex-col bg-white p-4 md:p-6 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:shadow-none z-20">
        
        {/* Header: Back Button & NEW Delete Button */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.push('/')} className="text-sm font-medium text-blue-600 hover:underline">
            &larr; Back to Dashboard
          </button>
          
          <button 
            onClick={handleDeleteDocument} 
            className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100"
            title="Delete Document"
          >
            Delete File
          </button>
        </div>

        <h2 className="text-sm font-bold text-gray-800 mb-4 truncate" title={document.filename}>
          {document.filename}
        </h2>

        {/* STRICT PRESERVATION: Tags Section */}
        <div className="mb-4 border-b pb-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tags</h3>
          <TagManager 
            documentId={document.id} 
            existingTags={document.tags || []} 
            onTagAdded={(updatedDoc) => setDocument(updatedDoc)} 
          />
        </div>

        {/* STRICT PRESERVATION: Comments Section */}
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-thin">
          {!document.comments || document.comments.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No notes yet.</p>
          ) : (
            document.comments.map((comment: any) => (
              <div key={comment.id} className="group relative bg-gray-50 p-3 pr-8 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-800 leading-relaxed">{comment.content}</p>
                <button 
                  onClick={() => handleDeleteComment(comment.id)}
                  className="absolute top-2 right-2 text-gray-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-red-500 transition-all p-1"
                  title="Delete Note"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* STRICT PRESERVATION: Mobile-Optimized Input Area */}
        <div className="mt-auto pt-2 bg-white">
          <textarea
            className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none text-black"
            rows={2}
            placeholder="Add a case note..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button 
            onClick={handleAddComment} 
            className="mt-2 w-full rounded-lg bg-blue-600 py-3 text-white font-semibold shadow-md active:bg-blue-700 active:scale-[0.98] transition-all text-sm"
          >
            Save Note
          </button>
        </div>
        
      </div>
    </div>
  );
}
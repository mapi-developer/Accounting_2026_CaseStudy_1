// frontend/app/document/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import TagManager from "@/components/TagManager";

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  
  // Unwrap the params.id correctly for Next.js 14/15
  const documentId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const [document, setDocument] = useState<any>(null);
  const [newComment, setNewComment] = useState("");

  const handleDeleteComment = async (commentId: number) => {
    const res = await fetch(`http://localhost:8000/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) {
      setDocument({
        ...document,
        comments: document.comments.filter((c: any) => c.id !== commentId)
      });
    }
  };

  useEffect(() => {
    if (!documentId) return;
    
    // Fetch the single document data
    fetch(`http://localhost:8000/documents/${documentId}`)
      .then((res) => res.json())
      .then((data) => setDocument(data))
      .catch((err) => console.error("Error fetching document:", err));
  }, [documentId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !documentId) return;
    
    const res = await fetch(`http://localhost:8000/documents/${documentId}/comments`, {
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

  if (!document) return <div className="p-8 flex justify-center mt-10">Loading document details...</div>;

  const pdfUrl = `http://localhost:8000/files/${document.filename}`;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* LEFT SIDE: PDF Viewer */}
      <div className="w-2/3 border-r border-gray-200 bg-white relative">
        <div className="absolute inset-0 overflow-y-auto">
            <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                <Viewer fileUrl={pdfUrl} plugins={[defaultLayoutPluginInstance]} />
            </Worker>
        </div>
      </div>

      {/* RIGHT SIDE: Details, Tags, and Comments */}
      <div className="w-1/3 flex flex-col h-full bg-white p-6 shadow-sm z-10">
        <button onClick={() => router.push('/')} className="mb-6 text-sm text-blue-600 hover:underline w-fit">
          &larr; Back to Dashboard
        </button>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2 truncate" title={document.filename}>
          {document.filename}
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          Uploaded on {new Date(document.uploaded_at).toLocaleString()}
        </p>

        {/* Tags Section */}
        <div className="mb-8 border-b pb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Tags</h3>
          <TagManager 
            documentId={document.id} 
            existingTags={document.tags || []} 
            onTagAdded={(updatedDoc) => setDocument(updatedDoc)} 
          />
        </div>

        {/* Comments Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Case Notes</h3>
          
          <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
            {!document.comments || document.comments.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No notes yet.</p>
            ) : (
              document.comments.map((comment: any) => (
                <div key={comment.id} className="group bg-gray-50 p-3 rounded-lg border border-gray-100 relative">
                  <p className="text-sm text-gray-800">{comment.content}</p>
                  {/* Delete Comment Button */}
                  <button 
                    onClick={() => handleDeleteComment(comment.id)}
                    className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto pt-4 bg-white">
            <textarea
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none text-black"
              rows={3}
              placeholder="Add a finding or note..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button 
              onClick={handleAddComment}
              className="mt-2 w-full rounded-lg bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
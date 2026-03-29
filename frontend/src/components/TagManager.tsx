"use client";

import { useState, useEffect } from "react";

interface Tag {
  id: number;
  name: string;
  color: string;
}

export default function TagManager({ 
  documentId, 
  existingTags, 
  onTagAdded 
}: { 
  documentId: number; 
  existingTags: Tag[]; 
  onTagAdded: (updatedDoc: any) => void 
}) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  // Fetch all available tags created in the system
  const fetchTags = async () => {
    const res = await fetch("http://localhost:8000/tags/");
    if (res.ok) setAllTags(await res.json());
  };

  useEffect(() => { fetchTags(); }, []);

  const handleCreateAndAddTag = async () => {
    if (!newTagName.trim()) return;

    // 1. Create the tag if it doesn't exist
    const tagRes = await fetch("http://localhost:8000/tags/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTagName, color: "#3b82f6" }),
    });

    const tagData = await tagRes.json();
    
    // 2. Link this tag to the current document
    const linkRes = await fetch(`http://localhost:8000/documents/${documentId}/tags/${tagData.id}`, {
      method: "POST",
    });

    if (linkRes.ok) {
      onTagAdded(await linkRes.json());
      setNewTagName("");
      setShowAddMenu(false);
      fetchTags();
    }
  };

  const handleAttachExisting = async (tagId: number) => {
    const res = await fetch(`http://localhost:8000/documents/${documentId}/tags/${tagId}`, {
      method: "POST",
    });
    if (res.ok) {
      onTagAdded(await res.json());
      setShowAddMenu(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {existingTags.map((tag) => (
          <span 
            key={tag.id} 
            className="px-2 py-1 text-xs rounded-full text-white font-medium"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
          </span>
        ))}
        <button 
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200"
        >
          + Add Tag
        </button>
      </div>

      {showAddMenu && (
        <div className="p-3 border rounded-lg bg-gray-50 text-sm">
          <p className="font-semibold mb-2 text-black">Select or Create Tag</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {allTags.filter(t => !existingTags.find(et => et.id === t.id)).map(tag => (
              <button 
                key={tag.id}
                onClick={() => handleAttachExisting(tag.id)}
                className="px-2 py-1 border rounded hover:bg-white"
              >
                {tag.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="New tag name..." 
              className="flex-1 px-2 py-1 border rounded text-black"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
            />
            <button onClick={handleCreateAndAddTag} className="bg-blue-600 text-white px-3 py-1 rounded">Create</button>
          </div>
        </div>
      )}
    </div>
  );
}
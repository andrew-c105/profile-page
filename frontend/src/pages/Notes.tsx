import { useEffect, useState } from "react";
import { useRef } from "react";

const NOTES_URL = "http://localhost:5001/api/notes";

interface Note {
  _id: string | number;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // Sync edit fields whenever the selected note changes
  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
    }
  }, [selectedNote?._id]);

  const handleFieldChange = (field: "title" | "content", value: string) => {
    setEditTitle(field === "title" ? value : editTitle);
    setEditContent(field === "content" ? value : editContent);

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      handleSaveNote(field, value);
    }, 500);
  };

  const handleNewNote = async () => {
    const newTitle = `New Note ${notes.length + 1}`;
    try {
      const response = await fetch(NOTES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: "" }),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("Server error:", err);
        return;
      }

      const createdNote: Note = await response.json();
      setNotes((prev) => [createdNote, ...prev]);
      setSelectedNote(createdNote);
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  };

  const handleSaveNote = async (field: "title" | "content", value: string) => {
    if (!selectedNote) return;
    // Don't save if title is being cleared
    if (field === "title" && value.trim() === "") return;
    const updated = {
      ...selectedNote,
      [field]: value,
    };
    try {
      const response = await fetch(`${NOTES_URL}/${selectedNote._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) return;
      setNotes((prev) =>
        prev.map((n) => (n._id === selectedNote._id ? updated : n)),
      );
      setSelectedNote(updated);
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  const handleDeleteNote = async (noteId: string | number) => {
    try {
      const response = await fetch(`${NOTES_URL}/${noteId}`, {
        method: "DELETE",
      });
      if (!response.ok) return;
      const remaining = notes.filter((n) => n._id !== noteId);
      setNotes(remaining);
      if (selectedNote?._id === noteId) {
        setSelectedNote(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch(NOTES_URL);
        const data: Note[] = await response.json();
        setNotes(data);
        if (data.length > 0) setSelectedNote(data[0]);
      } catch (err) {
        console.error("Failed to fetch notes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  return (
    <div className="flex h-[calc(90vh-4rem)] border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-gray-200 flex flex-col">
        <div className="flex flex-row items-center justify-between px-4 py-3 gap-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            My Notes
          </h2>
          <button
            onClick={handleNewNote}
            className="text-[0.7em] border px-2 py-2 rounded gap-3"
          >
            Create Note
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-gray-400 px-4 py-6">Loading...</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-gray-400 px-4 py-6">No notes yet.</p>
          ) : (
            <ul>
              {notes.map((note) => (
                <li key={note._id} className="relative">
                  <button
                    onClick={() => setSelectedNote(note)}
                    className={`w-full text-left px-4 py-3 pr-8 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedNote?._id === note._id
                      ? "bg-blue-50 border-l-2 border-l-blue-500"
                      : ""
                      }`}
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {note.title || "Untitled"}
                    </p>
                    {(note.updatedAt || note.createdAt) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(note.updatedAt ?? note.createdAt)}
                      </p>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note._id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all"
                    title="Delete note"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedNote ? (
          <>
            <div className="px-8 py-5 border-b border-gray-200">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="Untitled"
                className="w-full text-xl font-semibold text-gray-900 bg-transparent outline-none placeholder-gray-300"
              />
              {(selectedNote.updatedAt || selectedNote.createdAt) && (
                <p className="text-xs text-gray-400 mt-1">
                  Last updated:{" "}
                  {formatDate(selectedNote.updatedAt ?? selectedNote.createdAt)}
                </p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <textarea
                value={editContent}
                onChange={(e) => handleFieldChange("content", e.target.value)}
                placeholder="Start writing..."
                className="w-full h-full resize-none bg-transparent outline-none text-gray-700 leading-relaxed placeholder-gray-300"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <svg
              className="w-12 h-12 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-400 text-sm">
              Click on a note to see its contents
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Notes;

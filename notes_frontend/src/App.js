import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { listNotes, createNote, updateNote, deleteNote } from "./api/notesApi";
import { NotesList } from "./components/NotesList";
import { NoteEditor } from "./components/NoteEditor";
import { Button } from "./components/Button";

function byUpdatedDesc(a, b) {
  const aT = Date.parse(a.updated_at || a.created_at || "") || 0;
  const bT = Date.parse(b.updated_at || b.created_at || "") || 0;
  // If timestamps are missing, maintain stable order by id (string compare).
  if (aT === bT) return String(b.id).localeCompare(String(a.id));
  return bT - aT;
}

function normalizeNote(payload) {
  // Accept various potential shapes. We only depend on id/title/content.
  if (!payload || typeof payload !== "object") return null;
  const id = payload.id ?? payload.note_id ?? payload.uuid;
  if (id === undefined || id === null) return null;
  return {
    id,
    title: payload.title ?? "",
    content: payload.content ?? payload.body ?? "",
    created_at: payload.created_at,
    updated_at: payload.updated_at
  };
}

// PUBLIC_INTERFACE
function App() {
  /** Retro Notes app root: handles fetching and CRUD state transitions. */
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedNote = useMemo(() => {
    if (selectedId === null || selectedId === undefined) return null;
    return notes.find((n) => String(n.id) === String(selectedId)) || null;
  }, [notes, selectedId]);

  const editorMode = selectedNote ? "edit" : "create";

  async function refresh() {
    setError("");
    setLoading(true);
    try {
      const list = await listNotes();
      const normalized = (Array.isArray(list) ? list : [])
        .map(normalizeNote)
        .filter(Boolean)
        .sort(byUpdatedDesc);

      setNotes(normalized);

      // Maintain selection if possible.
      if (selectedId != null) {
        const stillThere = normalized.some((n) => String(n.id) === String(selectedId));
        if (!stillThere) setSelectedId(null);
      }
    } catch (e) {
      setError(e?.message || "Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(note) {
    setError("");
    setBusy(true);
    try {
      if (editorMode === "edit" && selectedNote) {
        const updatedPayload = await updateNote(selectedNote.id, note);
        const updated = normalizeNote(updatedPayload) || { ...selectedNote, ...note };
        setNotes((prev) =>
          prev
            .map((n) => (String(n.id) === String(selectedNote.id) ? { ...n, ...updated } : n))
            .slice()
            .sort(byUpdatedDesc)
        );
      } else {
        const createdPayload = await createNote(note);
        const created = normalizeNote(createdPayload) || {
          id: createdPayload?.id ?? `${Date.now()}`,
          ...note
        };
        setNotes((prev) => [created, ...prev].slice().sort(byUpdatedDesc));
        setSelectedId(created.id);
      }
    } catch (e) {
      setError(e?.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    setError("");
    const target = notes.find((n) => String(n.id) === String(id));
    const ok = window.confirm(
      `Delete this note?\n\n${(target?.title || "Untitled").trim()}\n\nThis cannot be undone.`
    );
    if (!ok) return;

    setBusy(true);
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => String(n.id) !== String(id)));
      if (String(selectedId ?? "") === String(id)) setSelectedId(null);
    } catch (e) {
      setError(e?.message || "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__left">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true">
              ▣
            </span>
            <div className="brand__text">
              <div className="brand__title">Retro Notes</div>
              <div className="brand__subtitle">CRUD over REST • pixel vibes</div>
            </div>
          </div>
        </div>

        <div className="topbar__right">
          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading || busy}>
            {loading ? "SYNC..." : "SYNC"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setSelectedId(null)}
            disabled={busy}
            title="Create a new note"
            ariaLabel="Create a new note"
          >
            NEW
          </Button>
        </div>
      </header>

      <main className="main">
        <section className="panel panel--left" aria-label="Notes">
          <div className="panel__header">
            <h1 className="panel__title">Notes</h1>
            <div className="panel__meta">{notes.length} total</div>
          </div>

          {error ? (
            <div className="alert" role="alert">
              <div className="alert__title">ERROR</div>
              <div className="alert__body">{error}</div>
            </div>
          ) : null}

          {loading ? (
            <div className="loading" role="status">
              LOADING...
            </div>
          ) : (
            <NotesList
              notes={notes}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
              onDelete={handleDelete}
            />
          )}
        </section>

        <section className="panel panel--right" aria-label="Editor">
          <NoteEditor
            mode={editorMode}
            initialNote={selectedNote}
            onCancel={() => setSelectedId(null)}
            onSubmit={handleSubmit}
            busy={busy}
          />

          <div className="panel__footer">
            <div className="panel__footerText">
              API base:{" "}
              <span className="mono">
                {(process.env.REACT_APP_API_BASE ||
                  process.env.REACT_APP_BACKEND_URL ||
                  "(same-origin)")?.replace(/\/+$/, "")}
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span className="mono">Tip:</span> select a note to edit it • use <span className="mono">
          DEL
        </span>{" "}
        to remove.
      </footer>
    </div>
  );
}

export default App;

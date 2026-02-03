import React, { useEffect, useMemo, useState } from "react";
import { Button } from "./Button";
import "./NoteEditor.css";

function normalizeValue(v) {
  return typeof v === "string" ? v : "";
}

/**
 * @param {{
 *  mode: "create" | "edit",
 *  initialNote?: { id?: string|number, title?: string, content?: string } | null,
 *  onCancel: () => void,
 *  onSubmit: (note: { title: string, content: string }) => Promise<void> | void,
 *  busy?: boolean,
 * }} props
 */
// PUBLIC_INTERFACE
export function NoteEditor({ mode, initialNote, onCancel, onSubmit, busy = false }) {
  /** Controlled form used to create or edit a note. */
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [touched, setTouched] = useState({ title: false, content: false });

  useEffect(() => {
    setTitle(normalizeValue(initialNote?.title));
    setContent(normalizeValue(initialNote?.content));
    setTouched({ title: false, content: false });
  }, [initialNote?.id, initialNote?.title, initialNote?.content]);

  const errors = useMemo(() => {
    const e = {};
    if (!title.trim()) e.title = "Title is required.";
    if (content.trim().length > 4000) e.content = "Keep it under 4000 characters.";
    return e;
  }, [title, content]);

  const canSubmit = Object.keys(errors).length === 0 && !busy;

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ title: true, content: true });
    if (!canSubmit) return;
    await onSubmit({ title: title.trim(), content: content.trim() });
  }

  return (
    <section className="editor" aria-label={mode === "create" ? "Add note" : "Edit note"}>
      <div className="editor__header">
        <h2 className="editor__title">{mode === "create" ? "New Note" : "Edit Note"}</h2>
        <p className="editor__hint">Press “Save” to persist changes.</p>
      </div>

      <form className="editor__form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field__label" htmlFor="note-title">
            Title <span className="field__required">*</span>
          </label>
          <input
            id="note-title"
            className="field__input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, title: true }))}
            placeholder="e.g. Grocery list"
            maxLength={120}
            disabled={busy}
            autoComplete="off"
          />
          {touched.title && errors.title ? <div className="field__error">{errors.title}</div> : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="note-content">
            Content
          </label>
          <textarea
            id="note-content"
            className="field__textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, content: true }))}
            placeholder="Write something memorable..."
            rows={7}
            disabled={busy}
          />
          {touched.content && errors.content ? (
            <div className="field__error">{errors.content}</div>
          ) : (
            <div className="field__help">{content.length}/4000</div>
          )}
        </div>

        <div className="editor__actions">
          <Button variant="ghost" type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!canSubmit}>
            {busy ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </section>
  );
}

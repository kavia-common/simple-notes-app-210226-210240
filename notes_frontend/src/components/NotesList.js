import React from "react";
import { Button } from "./Button";
import "./NotesList.css";

function truncate(s, max = 160) {
  const v = typeof s === "string" ? s : "";
  if (v.length <= max) return v;
  return `${v.slice(0, max - 1)}…`;
}

/**
 * @param {{
 *  notes: Array<{ id: string|number, title?: string, content?: string, updated_at?: string, created_at?: string }>,
 *  selectedId?: string|number|null,
 *  onSelect: (id: string|number) => void,
 *  onDelete: (id: string|number) => void,
 * }} props
 */
// PUBLIC_INTERFACE
export function NotesList({ notes, selectedId, onSelect, onDelete }) {
  /** Displays notes in a retro list; selection controls which note is edited. */
  if (!notes.length) {
    return (
      <div className="notesEmpty" role="status">
        <div className="notesEmpty__title">No notes yet.</div>
        <div className="notesEmpty__hint">Create one to get started.</div>
      </div>
    );
  }

  return (
    <ul className="notesList" aria-label="Notes list">
      {notes.map((n) => {
        const isSelected = String(n.id) === String(selectedId ?? "");
        return (
          <li key={String(n.id)} className={`notesList__item ${isSelected ? "is-selected" : ""}`}>
            <button
              type="button"
              className="notesList__select"
              onClick={() => onSelect(n.id)}
              aria-current={isSelected ? "true" : "false"}
            >
              <div className="notesList__titleRow">
                <span className="notesList__title">{n.title?.trim() ? n.title : "Untitled"}</span>
                <span className="notesList__badge">{isSelected ? "EDITING" : "NOTE"}</span>
              </div>
              <div className="notesList__preview">{truncate(n.content || "")}</div>
            </button>

            <div className="notesList__actions">
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(n.id)}
                ariaLabel={`Delete note ${n.title || ""}`}
                title="Delete"
              >
                DEL
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

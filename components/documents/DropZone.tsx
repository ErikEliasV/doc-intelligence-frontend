"use client";

import { useRef, useState, type DragEvent } from "react";
import { cn } from "../cn";
import { Button } from "../core/Button";
import { Icon } from "../core/Icon";

/**
 * Ported from the design system's `DropZone.jsx`.
 *
 * Native HTML drag-and-drop plus a hidden `<input type="file" multiple>` — no
 * library. See docs/adr/ADR-0008.md for what was weighed against that.
 *
 * The `accept` hint below is a *filter for the file picker*, not validation:
 * a dropped file of any type is still passed to `onFiles`. Deciding what a
 * document is belongs to the extraction model, not this component.
 */
export interface DropZoneProps {
  onFiles?: (files: File[]) => void;
  hint?: string;
  className?: string;
}

export function DropZone({
  onFiles,
  hint = "PDF, JPG ou PNG · vários arquivos por vez",
  className,
}: DropZoneProps) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const pick = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length > 0) onFiles?.(files);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setOver(false);
    pick(event.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn(
        "grid justify-items-center gap-3 border-2 border-dashed px-6 py-12 text-center",
        "transition-control",
        over ? "border-yellow-600 bg-yellow-100" : "border-line bg-card",
        className,
      )}
    >
      <Icon name="upload-cloud" size={30} strokeWidth={1.75} />
      <h3 className="type-display-3">Arraste documentos aqui</h3>
      <p className="type-body-sm text-muted">{hint}</p>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/*,application/pdf"
        onChange={(event) => {
          pick(event.target.files);
          // Lets the same file be picked twice in a row — without this the
          // input keeps its value and fires no change event the second time.
          event.target.value = "";
        }}
        className="hidden"
      />
      <Button variant="inverse" size="sm" onClick={() => input.current?.click()}>
        Selecionar arquivos
      </Button>
    </div>
  );
}

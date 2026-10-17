import { useEffect, useRef, useState, type ChangeEvent, type CompositionEvent, type FocusEvent } from "react";

type TextField = HTMLInputElement | HTMLTextAreaElement;

export function AnswerInput({
  savedValue, kind, onSave,
}: {
  savedValue: string;
  kind: "short" | "numeric" | "essay";
  onSave: (value: string) => Promise<boolean>;
}) {
  // The visible value must update in the input event itself. IndexedDB and
  // profile broadcasts can finish later, including between IME keystrokes.
  const [value, setValue] = useState(savedValue);
  const focused = useRef(false), composing = useRef(false), dirty = useRef(false);
  const version = useRef(0), sent = useRef<string | null>(savedValue);

  useEffect(() => {
    if (!focused.current && !composing.current && !dirty.current) {
      setValue(savedValue);
      sent.current = savedValue;
    }
  }, [savedValue]);

  const save = (next: string) => {
    if (sent.current === next) return;
    sent.current = next;
    dirty.current = true;
    const request = ++version.current;
    // Keep saving interim input as well, so reload/time expiry can retain the
    // latest text. Its completion must never replace the visible composition.
    void onSave(next).then((saved) => {
      if (request !== version.current) return;
      dirty.current = !saved;
      if (!saved) sent.current = null; // Allow blur to retry a failed write.
    });
  };
  const change = (event: ChangeEvent<TextField>) => {
    const next = event.currentTarget.value;
    setValue(next);
    save(next);
  };
  const compositionEnd = (event: CompositionEvent<TextField>) => {
    composing.current = false;
    const next = event.currentTarget.value;
    setValue(next);
    save(next);
  };
  const props = {
    value,
    onChange: change,
    onFocus: () => { focused.current = true; },
    onBlur: (event: FocusEvent<TextField>) => {
      focused.current = false;
      composing.current = false;
      save(event.currentTarget.value);
      if (!dirty.current) setValue(savedValue);
    },
    onCompositionStart: () => { composing.current = true; },
    onCompositionEnd: compositionEnd,
  };
  return kind === "essay" ? (
    <textarea {...props} aria-label="서술 답안" rows={6} maxLength={10000} />
  ) : (
    <input {...props} aria-label={kind === "numeric" ? "숫자 답안" : "짧은 답안"}
      type="text" inputMode={kind === "numeric" ? "decimal" : "text"}
      maxLength={1000} placeholder={kind === "numeric" ? "숫자만 입력" : "답 입력"} />
  );
}

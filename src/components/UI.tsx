import { Bookmark } from "lucide-react";
import { useStudy } from "../context";
import { toggleBookmark } from "../storage";
export const kindLabel = {
  choice: "객관식",
  numeric: "숫자 입력",
  short: "짧은 답",
  essay: "서술 자기 평가",
};
export function Heading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
export function BookmarkButton({
  targetId,
  kind,
}: {
  targetId: string;
  kind: "lesson" | "question";
}) {
  const { profile, session, run } = useStudy();
  const on = profile.bookmarks.some(
    (b) => b.targetId === targetId && b.kind === kind,
  );
  return (
    <button
      className={`bookmark ${on ? "active" : ""}`}
      aria-label={on ? "북마크 해제" : "북마크"}
      aria-pressed={on}
      onClick={() => void run(toggleBookmark(session.userId, targetId, kind))}
    >
      <Bookmark size={17} fill={on ? "currentColor" : "none"} />
      {on ? "저장됨" : "북마크"}
    </button>
  );
}

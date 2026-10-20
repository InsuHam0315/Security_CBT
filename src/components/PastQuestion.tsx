import type { Question } from '../types';
import { pastSourceMap } from '../content/past';

export function PastProvenance({q, explanation=false}:{q:Question; explanation?:boolean}) {
  if (!q.past) return null;
  return <div className="past-provenance">
    <span className="tag">{q.past.status}</span>
    <p>{q.past.occurrences.map(o=>`${pastSourceMap[o.sourceId].title} · ${o.locator}번`).join(' / ')}</p>
    {explanation && <>
      {q.past.correction && <p className="past-correction"><b>검토·수정:</b> {q.past.correction}</p>}
      {!!q.past.references.length && <ul className="past-references">{q.past.references.map(r=><li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.title} ↗</a></li>)}</ul>}
    </>}
  </div>;
}

export function PastMaterial({q}:{q:Question}) {
  const material=q.past?.material;
  if (!material) return null;
  return <section className="past-material" aria-label="문제 조건 자료">
    <h3>{material.title}</h3><p>{material.description}</p>
    <div className="table-scroll" tabIndex={0} aria-label={`${material.title} 가로 스크롤`}>
      <table><thead><tr>{material.columns.map((c,i)=><th key={i} scope="col">{c}</th>)}</tr></thead><tbody>{material.rows.map((row,i)=><tr key={i}>{row.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table>
    </div>
    <p className="muted">표가 잘리면 좌우로 밀어 전체 열을 확인하세요.</p>
  </section>;
}

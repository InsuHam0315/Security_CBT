import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CaseStudy, Row, SourceRef } from "../types";
import { sourceMap } from "../content";
import { Link } from "react-router-dom";
import { Expand, Table2, BarChart3, ArrowUpDown, X } from "lucide-react";
export function Sources({
  refs,
  supplements = [],
}: {
  refs: SourceRef[];
  supplements?: SourceRef[];
}) {
  return (
    <div className="sources">
      <strong>범위 근거 · PPTX 실제 슬라이드</strong>
      {refs.map((r) => (
        <p key={r.sourceId + ":" + r.pages.join(",")}>
          {sourceMap[r.sourceId].filename} · 슬라이드 {r.pages.map((page,i)=><span key={page}>{i>0?", ":""}<Link to={`/sources?source=${r.sourceId}&page=${page}`}>{page}</Link></span>)}
        </p>
      ))}
      {supplements.length > 0 && (
        <details>
          <summary>설명 보강 자료</summary>
          {supplements.map((r, i) => (
            <p key={i}>
              {sourceMap[r.sourceId].filename} · p{r.pages[0]}~{r.pages.at(-1)}
            </p>
          ))}
        </details>
      )}
    </div>
  );
}
export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Row[];
}) {
  const filterId = useId();
  const [sort, setSort] = useState<{ column: string; dir: 1 | -1 } | null>(
      null,
    ),
    [filter, setFilter] = useState("");
  const visible = useMemo(() => {
    const v = rows.filter((r) =>
      Object.values(r).some((x) =>
        String(x ?? "—")
          .toLowerCase()
          .includes(filter.toLowerCase()),
      ),
    );
    if (sort)
      v.sort((a, b) => {
        const av = a[sort.column],
          bv = b[sort.column];
        if (av === null) return 1;
        if (bv === null) return -1;
        return (
          (typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv), "ko")) * sort.dir
        );
      });
    return v;
  }, [rows, sort, filter]);
  return (
    <div className="datatable">
      <div className="table-tools">
        <label className="sr-only" htmlFor={filterId}>
          표 행 필터
        </label>
        <input
          id={filterId}
          aria-label="표 행 필터"
          placeholder="표 안에서 검색…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <span className="muted">
          {visible.length} / {rows.length}행 · 열 제목으로 정렬
        </span>
      </div>
      <div className="table-scroll">
        <table>
          <caption className="sr-only">사례 데이터. —는 결측입니다.</caption>
          <thead>
            <tr>
              {columns.map((k) => (
                <th
                  key={k}
                  aria-sort={
                    sort?.column === k
                      ? sort.dir === 1
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    onClick={() =>
                      setSort({
                        column: k,
                        dir: sort?.column === k && sort.dir === 1 ? -1 : 1,
                      })
                    }
                  >
                    {k}
                    <ArrowUpDown size={12} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i}>
                {columns.map((k) => (
                  <td key={k} className={r[k] === null ? "missing" : ""}>
                    {r[k] === null ? "—" : String(r[k])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <p className="empty">조건에 맞는 행이 없습니다.</p>}
      </div>
    </div>
  );
}
function Modal({
  children,
  close,
}: {
  children: ReactNode;
  close: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    root.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <div className="modal-backdrop" onClick={close}>
      <section
        ref={root}
        role="dialog"
        aria-modal="true"
        aria-label="자료 확대"
        className="modal wide"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            close();
          }
          if (e.key === "Tab") {
            const nodes = [
              ...root.current!.querySelectorAll<HTMLElement>(
                'button,input,select,[tabindex="0"]',
              ),
            ];
            const first = nodes[0],
              last = nodes.at(-1);
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <button className="close" aria-label="확대 닫기" onClick={close}>
          <X />
        </button>
        {children}
        <button onClick={close}>닫기</button>
      </section>
    </div>
  );
}
export function Code({ code, notes = [], label = "코드·도식 읽기" }: { code: string; notes?: string[]; label?: string }) {
 const [line,setLine]=useState(0);const lines=code.split("\n");
 return <div className="code-block"><div className="code-caption">{label} · 줄 번호로 해설 확인</div><pre tabIndex={0} aria-label={`${label} 예제`}><code>{lines.map((text,i)=><span key={i} className={`code-line ${line===i?'selected':''}`}><button aria-label={`${i+1}줄 해설`} aria-pressed={line===i} onClick={()=>setLine(i)}>{i+1}</button>{text}{"\n"}</span>)}</code></pre>{notes[line]&&<p className="line-explanation" role="status">{line+1}줄 · {notes[line]}</p>}{notes.length>0&&<details><summary>전체 해설</summary><ol className="code-notes">{notes.map((n,i)=><li key={i}>{n}</li>)}</ol></details>}</div>;
}
export function Process({data}:{data:CaseStudy}){
 const [step,setStep]=useState(0);const steps=data.code.split("\n");
 return <div className="process"><h3>과정을 한 단계씩</h3><div className="actions compact">{steps.map((_,i)=><button key={i} aria-pressed={i===step} onClick={()=>setStep(i)}>{i+1}단계</button>)}</div><div className="trust-node" role="status"><strong>{step+1}. {steps[step]}</strong><p>{data.codeNotes[step]??data.guide[3]}</p></div><div className="actions compact"><button disabled={step===0} onClick={()=>setStep(step-1)}>이전 단계</button><button disabled={step===steps.length-1} onClick={()=>setStep(step+1)}>다음 단계</button></div></div>;
}
export function Materials({data,interactive=false}:{data:CaseStudy;interactive?:boolean}){
 const [expanded,setExpanded]=useState(false);
 return <><section className="material panel"><div className="case-label"><span className="tag">{data.id}</span><span className="tag synthetic">학습용 가상 자료</span></div><h2>{data.title}</h2><p>{data.scenario}</p><div className="metadata"><span>관찰 단위 <b>{data.unit}</b></span><span>표 <b>{data.validN}행</b></span></div><button onClick={()=>setExpanded(true)}><Expand size={15}/>자료 확대</button><DataTable columns={data.columns} rows={data.rows}/>{data.code&&(data.kind==='flow'&&interactive?<Process data={data}/>:<Code code={data.code} notes={data.codeNotes}/>)}<details><summary>가정·제외 기준·해석 한계</summary><p>{data.exclusions}</p><ul>{data.assumptions.map((a,i)=><li key={i}>{a}</li>)}</ul><p>{data.numericOrigin}</p></details></section>{expanded&&<Modal close={()=>setExpanded(false)}><h2>{data.title} · 확대</h2><DataTable columns={data.columns} rows={data.rows}/>{data.code&&<Code code={data.code} notes={data.codeNotes}/>}</Modal>}</>;
}

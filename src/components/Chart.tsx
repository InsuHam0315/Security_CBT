import { useState } from "react";
import type { CaseStudy } from "../types";

// 학습 기록 화면에서 쓰는 확정 점수 추이만 그린다.
export function DataChart({ data }: { data: CaseStudy }) {
  const [focused, setFocused] = useState("");
  const chart = data.chart;
  if (!chart || !data.rows.length) return <p>확정된 점수가 아직 없습니다.</p>;
  const width = 680, height = 320, left = 65, right = 35, top = 30, bottom = 65;
  const x = (index: number) => data.rows.length === 1 ? width / 2 : left + index * (width-left-right)/(data.rows.length-1);
  const y = (value: number) => top + (100-value)*(height-top-bottom)/100;
  const points = data.rows.map((row, index) => ({ x: x(index), y: y(Number(row[chart.y])), score: Number(row[chart.y]), label: `${row[chart.x]}번째 확정 응시 · ${row[chart.y]}점` }));
  return <figure className="chart">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${chart.title}. ${points.map(p=>p.label).join(', ')}`}>
      <title>{chart.title} · 0~100점</title>
      {[0,25,50,75,100].map(value=><g key={value}>
        <line x1={left} x2={width-right} y1={y(value)} y2={y(value)} stroke="currentColor" opacity=".15" />
        <text x={left-12} y={y(value)+5} textAnchor="end" fontSize="14" fill="currentColor">{value}</text>
      </g>)}
      <polyline points={points.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--accent)" strokeWidth="3" />
      {points.map((p,index)=><g key={index} tabIndex={0} role="img" aria-label={p.label} onMouseEnter={()=>setFocused(p.label)} onMouseLeave={()=>setFocused('')} onFocus={()=>setFocused(p.label)} onBlur={()=>setFocused('')}>
        <circle cx={p.x} cy={p.y} r="6" fill="var(--accent)" stroke="var(--bg)" strokeWidth="2" />
        <text x={p.x} y={p.y-12} textAnchor="middle" fill="currentColor" fontSize="14">{p.score}</text>
        <text x={p.x} y={height-bottom+25} textAnchor="middle" fill="currentColor" fontSize="14">{index+1}</text>
        <title>{p.label}</title>
      </g>)}
      <text x={width/2} y={height-12} textAnchor="middle" fontSize="14" fill="currentColor">최근 확정 응시 순서</text>
    </svg>
    <figcaption aria-live="polite">{focused || '확정 점수 추이 · 숫자와 점으로 표시 · 자세한 응시는 아래 이력에서 확인'}</figcaption>
  </figure>;
}

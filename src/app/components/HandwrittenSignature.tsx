import { useRef } from 'react';
export type Strokes = number[][][];
export function HandwrittenSignature({value,onChange,readOnly=false}:{value:Strokes;onChange?:(strokes:Strokes)=>void;readOnly?:boolean}) {
  const drawing=useRef(false);
  return <svg viewBox="0 0 600 200" role="img" aria-label="Handwritten quotation signature" style={{display:'block',width:'100%',maxWidth:600,background:'#fff',border:'1px solid #888',borderRadius:8,touchAction:'none'}}
    onPointerDown={event=>{if(readOnly)return;event.currentTarget.setPointerCapture(event.pointerId);drawing.current=true;const r=event.currentTarget.getBoundingClientRect();onChange?.([...value,[[(event.clientX-r.left)*600/r.width,(event.clientY-r.top)*200/r.height]]]);}}
    onPointerMove={event=>{if(readOnly||!drawing.current||!value.length)return;const r=event.currentTarget.getBoundingClientRect();const p=[Math.max(0,Math.min(600,(event.clientX-r.left)*600/r.width)),Math.max(0,Math.min(200,(event.clientY-r.top)*200/r.height))];if(value.flat().length<4000)onChange?.([...value.slice(0,-1),[...value[value.length-1],p]]);}}
    onPointerUp={()=>{drawing.current=false;}} onPointerCancel={()=>{drawing.current=false;}}>
    {value.map((stroke,index)=><polyline key={index} points={stroke.map(point=>point.join(',')).join(' ')} fill="none" stroke="#17202a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>)}
  </svg>;
}

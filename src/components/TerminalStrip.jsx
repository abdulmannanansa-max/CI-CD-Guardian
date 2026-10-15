import { useEffect, useState } from 'react';

const script = [
  '> fetching workflows...',
  '> parsed 30 pipelines',
  '> flaky test detected: test_auth_retry',
  '> root cause cluster: dependency timeout',
  '> failure risk: 0.82 (HIGH)',
  '> suggested fix: add timeout-minutes',
  '> guardian: all clear',
];

function tone(line) {
  if (/failed|flaky|risk: 0\./i.test(line)) return 'terminal-error';
  if (/root cause|warning/i.test(line)) return 'terminal-warning';
  if (/suggested|target:/i.test(line)) return 'terminal-info';
  return 'terminal-success';
}

export default function TerminalStrip({ target }) {
  const [lines, setLines] = useState([]);
  const [current, setCurrent] = useState('');

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let timer;
    let lineIndex = 0;
    let charIndex = 0;
    let line = '';
    if (reduceMotion) {
      setLines(script.slice(-4));
      setCurrent('');
      return undefined;
    }
    const tick = () => {
      if (charIndex < line.length) {
        charIndex += 1;
        setCurrent(line.slice(0, charIndex));
        timer = window.setTimeout(tick, 22);
      } else {
        setLines((existing) => [...existing.slice(-6), line]);
        lineIndex = (lineIndex + 1) % script.length;
        line = script[lineIndex];
        charIndex = 0;
        setCurrent('');
        timer = window.setTimeout(tick, 1200);
      }
    };
    line = script[0];
    timer = window.setTimeout(tick, 500);
    return () => window.clearTimeout(timer);
  }, []);

  const visible = [...lines.slice(-6), ...(current ? [current] : [])];
  const targetLine = target ? `> target: ${target}` : '';

  return (
    <div className="live-terminal" aria-label="Live example CI analysis output" aria-live="off">
      <div className="terminal-lines">
        {visible.map((line, index) => <div className={`terminal-line ${tone(line)}`} key={`${index}-${line}`}>{line}</div>)}
        {targetLine && <div className="terminal-line terminal-info terminal-target">{targetLine}<i className="terminal-cursor" /></div>}
        {!targetLine && current && <i className="terminal-cursor" />}
      </div>
    </div>
  );
}

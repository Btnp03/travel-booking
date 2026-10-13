'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Database, Eye, Globe2, RefreshCw, Server, Users } from 'lucide-react';

type Point = { label: string; views: number };
type PageView = { _id?: string; eventId?: string; pagePath?: string; visitorId?: string; deviceType?: string; timestamp?: string };
type Summary = {
  totalPageViews: number; totalSessions: number; totalVisitors: number;
  activity: { daily: Point[]; monthly: Point[]; yearly: Point[] };
  topPages: Array<{ path: string; views: number }>; latestPageViews: PageView[];
};
type Status = { cassandra: { connected: boolean; type: string } };
const API = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'http://localhost:3002/api';
const number = (value = 0) => new Intl.NumberFormat('en-US').format(value);

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [range, setRange] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryResult, statusResult] = await Promise.all([
        fetch(`${API}/analytics/summary`).then((response) => response.json()),
        fetch(`${API}/analytics/status`).then((response) => response.json()),
      ]);
      setSummary(summaryResult.summary ?? null);
      setStatus(statusResult);
      setUpdatedAt(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); const interval = window.setInterval(reload, 15000); return () => clearInterval(interval); }, [reload]);
  const points = summary?.activity?.[range] ?? [];
  const maximum = Math.max(...points.map((point) => point.views), 1);
  const activePage = useMemo(() => summary?.topPages?.[0], [summary]);

  return <main className="analytics-page">
    <header className="simple-header">
      <div className="logo"><Globe2 size={23} /><span>Travel <b>Pulse</b></span></div>
      <div className="header-right"><span className="connection"><i className={status?.cassandra?.connected ? 'online' : ''} />{status?.cassandra?.connected ? 'Cassandra connected' : 'Cassandra unavailable'}</span><button onClick={reload} disabled={loading} aria-label="Refresh data"><RefreshCw size={17} className={loading ? 'spin' : ''} /></button></div>
    </header>
    <section className="page-intro"><div><p>LIVE WEB ANALYTICS</p><h1>สถิติผู้เข้าชมเว็บไซต์</h1><span>ข้อมูลจริงจาก event การเข้าชมหน้าเว็บหลัก อัปเดตทุก 15 วินาที</span></div><div className="update-mark"><Activity size={17} /><span>อัปเดตล่าสุด<br /><b>{updatedAt || 'กำลังโหลด...'}</b></span></div></section>
    <section className="stats-row"><Stat icon={<Eye />} title="การเข้าชมหน้า" value={number(summary?.totalPageViews)} description="Page views" /><Stat icon={<Users />} title="ผู้เข้าชมไม่ซ้ำ" value={number(summary?.totalVisitors)} description="Unique visitors" /><Stat icon={<Activity />} title="เซสชัน" value={number(summary?.totalSessions)} description="Visitor sessions" /><Stat icon={<Globe2 />} title="หน้าที่นิยม" value={activePage?.path || '—'} description={activePage ? `${number(activePage.views)} views` : 'No visits yet'} path /></section>
    <section className="dashboard-grid">
      <article className="panel chart-panel"><div className="panel-heading"><div><p className="section-label">TRAFFIC</p><h2>แนวโน้มการเข้าชม</h2></div><div className="range-control">{(['daily', 'monthly', 'yearly'] as const).map((item) => <button key={item} className={range === item ? 'active' : ''} onClick={() => setRange(item)}>{{ daily: 'วัน', monthly: 'เดือน', yearly: 'ปี' }[item]}</button>)}</div></div><div className="bars">{points.length ? points.map((point) => <div className="bar-item" key={point.label}><div className="bar-wrap"><span>{number(point.views)}</span><i style={{ height: `${Math.max((point.views / maximum) * 100, 6)}%` }} /></div><small>{point.label}</small></div>) : <Empty text="ยังไม่มี event การเข้าชมใน Cassandra" />}</div></article>
      <article className="panel pages-panel"><div className="panel-heading"><div><p className="section-label">TOP PAGES</p><h2>หน้าที่มีคนเข้าชม</h2></div></div><div className="top-pages">{summary?.topPages?.length ? summary.topPages.map((page, index) => <div className="top-page" key={page.path}><b>0{index + 1}</b><code>{page.path}</code><strong>{number(page.views)}</strong></div>) : <Empty text="รอข้อมูลจากเว็บหลัก" />}</div></article>
    </section>
    <section className="dashboard-grid bottom-grid">
      <article className="panel visits-panel"><div className="panel-heading"><div><p className="section-label">RECENT EVENTS</p><h2>การเข้าชมล่าสุด</h2></div></div><div className="visit-list">{summary?.latestPageViews?.length ? summary.latestPageViews.slice(0, 6).map((visit, index) => <div className="visit" key={visit._id || visit.eventId || index}><span><Globe2 size={15} /></span><div><code>{visit.pagePath || '/'}</code><small>{visit.deviceType || 'Unknown device'} · {visit.visitorId || 'anonymous'}</small></div><time>{visit.timestamp ? new Date(visit.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '—'}</time></div>) : <Empty text="ยังไม่มีการเข้าชมล่าสุด" />}</div></article>
      <article className="why-cassandra"><div className="why-icon"><Database size={22} /></div><p className="section-label">WHY CASSANDRA</p><h2>ทำไมข้อมูลนี้<br />จึงอยู่ใน Cassandra</h2><ul><li><Server size={15} />เขียน event จำนวนมากได้เร็ว</li><li><Activity size={15} />เหมาะกับข้อมูลตามเวลา</li><li><Globe2 size={15} />ขยายรองรับผู้ใช้เพิ่มได้</li></ul><small>โหมดเชื่อมต่อ: {status?.cassandra?.type || 'checking...'}</small></article>
    </section>
    <footer>แสดงข้อมูล event จริงจาก Cassandra/Astra DB · ไม่สร้างข้อมูลตัวอย่าง</footer>
  </main>;
}

function Stat({ icon, title, value, description, path }: { icon: React.ReactNode; title: string; value: string; description: string; path?: boolean }) { return <article className="stat"><span>{icon}</span><div><p>{title}</p><strong className={path ? 'path-value' : ''}>{value}</strong><small>{description}</small></div></article>; }
function Empty({ text }: { text: string }) { return <p className="empty">{text}</p>; }

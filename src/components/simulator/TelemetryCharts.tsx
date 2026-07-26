import React from 'react';
import { TelemetryPoint } from '../../types';
import { ShieldCheck, Clock, Layers, Zap, Activity } from 'lucide-react';

interface TelemetryChartsProps {
  telemetryHistory: TelemetryPoint[];
  latestPoint?: TelemetryPoint;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({ telemetryHistory, latestPoint }) => {
  const p = latestPoint || {
    throughputRps: 0,
    p50LatencyMs: 0,
    p95LatencyMs: 0,
    p99LatencyMs: 0,
    activeQueueDepth: 0,
    totalSuccessOrders: 0,
    totalStockouts: 0,
    oversellEvents: 0,
    stockSyncLagMs: 0,
    remainingStock: 0
  };

  const maxRps = Math.max(10, ...telemetryHistory.map(t => t.throughputRps));
  const maxLatency = Math.max(50, ...telemetryHistory.map(t => t.p95LatencyMs));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Top Metric Cards Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        
        {/* 1. Oversell Assertion Meter */}
        <div style={{ background: 'var(--color-green-subtle)', border: '1px solid var(--color-green-border)', borderRadius: 16, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)' }}>
            <span>Oversell Events</span>
            <ShieldCheck size={16} color="var(--color-green-text)" />
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-green-text)', letterSpacing: '-0.04em' }}>{p.oversellEvents}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-green-text)', background: 'var(--color-green-subtle)', border: '1px solid var(--color-green-border)', padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)' }}>
              ZERO OVERSELL
            </span>
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>PostgreSQL Atomic Lock</p>
        </div>

        {/* 2. Throughput (RPS) */}
        <div style={{ background: 'var(--color-blue-subtle)', border: '1px solid var(--color-blue-border)', borderRadius: 16, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)' }}>
            <span>Throughput</span>
            <Zap size={16} color="var(--color-blue-text)" />
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-blue-text)', letterSpacing: '-0.04em' }}>{p.throughputRps}</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>req/sec</span>
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>Synthetic Load Rate</p>
        </div>

        {/* 3. p95 Latency */}
        <div style={{ background: 'var(--color-amber-subtle)', border: '1px solid var(--color-amber-border)', borderRadius: 16, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)' }}>
            <span>p95 Latency</span>
            <Clock size={16} color="var(--color-amber-text)" />
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-amber-text)', letterSpacing: '-0.04em' }}>{p.p95LatencyMs}</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>ms</span>
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>p50: {p.p50LatencyMs}ms | p99: {p.p99LatencyMs}ms</p>
        </div>

        {/* 4. Queue Depth */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)' }}>
            <span>Queue Depth</span>
            <Layers size={16} color="var(--text-secondary)" />
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>{p.activeQueueDepth}</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>workers</span>
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>Concurrent Threads</p>
        </div>

        {/* 5. Stock Sync Lag */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)' }}>
            <span>Stock Sync Lag</span>
            <Activity size={16} color="var(--color-blue-text)" />
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-blue-text)', letterSpacing: '-0.04em' }}>{p.stockSyncLagMs}</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>ms</span>
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>Pub/Sub Broadcast</p>
        </div>

      </div>

      {/* Real-time Telemetry Graphs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        
        {/* Graph 1: Throughput (RPS) Timeline */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={15} color="var(--color-blue-text)" />
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Throughput Curve (RPS)</h3>
            </div>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-blue-text)', fontWeight: 600 }}>{p.throughputRps} RPS</span>
          </div>

          <div style={{ height: 160, width: '100%', background: 'var(--bg-canvas)', borderRadius: 12, padding: 12, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-end', gap: 3 }}>
            {telemetryHistory.length === 0 ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-disabled)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                Awaiting simulation start...
              </div>
            ) : (
              telemetryHistory.map((t, idx) => {
                const heightPercent = Math.max(6, (t.throughputRps / maxRps) * 100);
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                    <div
                      style={{
                        height: `${heightPercent}%`,
                        width: '100%',
                        background: 'var(--color-blue-text)',
                        borderRadius: '3px 3px 0 0',
                        transition: 'all 200ms ease'
                      }}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Graph 2: Latency Distribution Timeline (p95 / p99) */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={15} color="var(--color-amber-text)" />
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Latency Distribution (p95 ms)</h3>
            </div>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-amber-text)', fontWeight: 600 }}>p95: {p.p95LatencyMs}ms</span>
          </div>

          <div style={{ height: 160, width: '100%', background: 'var(--bg-canvas)', borderRadius: 12, padding: 12, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-end', gap: 3 }}>
            {telemetryHistory.length === 0 ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-disabled)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                Awaiting simulation start...
              </div>
            ) : (
              telemetryHistory.map((t, idx) => {
                const heightPercent = Math.max(6, (t.p95LatencyMs / maxLatency) * 100);
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                    <div
                      style={{
                        height: `${heightPercent}%`,
                        width: '100%',
                        background: 'var(--color-amber-text)',
                        borderRadius: '3px 3px 0 0',
                        transition: 'all 200ms ease'
                      }}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

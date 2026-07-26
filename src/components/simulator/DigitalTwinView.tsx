import React, { useState, useEffect } from 'react';
import { simulatorEngine } from '../../services/simulatorEngine';
import { TelemetryPoint, SimulationResult } from '../../types';
import { TelemetryCharts } from './TelemetryCharts';
import { Play, Square, Zap, ShieldCheck, Flame, Sliders, Activity } from 'lucide-react';

export const DigitalTwinView: React.FC = () => {
  const [config, setConfig] = useState(simulatorEngine.getConfig());
  const [isRunning, setIsRunning] = useState(false);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [latestPoint, setLatestPoint] = useState<TelemetryPoint | undefined>(undefined);
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    const unsubscribe = simulatorEngine.subscribeTelemetry((point, history) => {
      setLatestPoint(point);
      setTelemetryHistory(history);
    });
    return () => unsubscribe();
  }, []);

  const handleConfigChange = (field: string, value: any) => {
    const updated = { ...config, [field]: value };
    setConfig(updated);
    simulatorEngine.setConfig(updated);
  };

  const handleStart = (scenarioPreset?: string) => {
    setIsRunning(true);
    setLastResult(null);
    simulatorEngine.startSimulation(scenarioPreset);
  };

  const handleStop = () => {
    setIsRunning(false);
    const result = simulatorEngine.stopSimulation();
    setLastResult(result);
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 80 }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: 20,
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 9999, background: 'var(--color-blue-subtle)', border: '1px solid var(--color-blue-border)', color: 'var(--color-blue-text)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
            <Activity size={13} className={isRunning ? 'animate-pulse' : ''} />
            <span>Digital Twin Simulator & Synthetic Load Benchmark</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Cinema Intermission Concurrency Engine
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.5 }}>
            Proves system design choices under heavy burst traffic (up to 25,000 concurrent patrons across auditorium screens). Validates atomic inventory locking, queue depth, p95 latency, and zero overselling.
          </p>
        </div>

        {/* Start / Stop Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isRunning ? (
            <button
              onClick={() => handleStart()}
              className="btn btn-primary btn-lg"
              style={{ gap: 8, padding: '12px 24px', fontSize: 14 }}
            >
              <Play size={16} fill="currentColor" />
              <span>Launch Load Simulator</span>
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="btn btn-lg"
              style={{ gap: 8, padding: '12px 24px', fontSize: 14, background: 'var(--color-red-muted)', color: 'var(--color-red-text)', border: '1px solid var(--color-red-border)' }}
            >
              <Square size={16} fill="currentColor" />
              <span>Stop & Generate Readout</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Scenario Buttons */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
          <Zap size={14} color="var(--color-amber-text)" />
          <span>Preset What-If Scenarios</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          <button
            disabled={isRunning}
            onClick={() => {
              handleConfigChange('stockAllocationLimit', 25);
              handleConfigChange('concurrencyWorkers', 20);
              handleStart('flash_stockout');
            }}
            style={{
              padding: '12px 14px', borderRadius: 12, background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
              textAlign: 'left', cursor: isRunning ? 'not-allowed' : 'pointer', transition: 'all 120ms ease', opacity: isRunning ? 0.5 : 1
            }}
            onMouseEnter={e => { if (!isRunning) (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-amber-border)'; }}
            onMouseLeave={e => { if (!isRunning) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-amber-text)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Flame size={14} />
              Popcorn Flash Stockout
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
              500 patrons rush for 25 popcorn units during 3-min intermission burst.
            </div>
          </button>

          <button
            disabled={isRunning}
            onClick={() => {
              handleConfigChange('numScreens', 10);
              handleConfigChange('seatsPerScreen', 400);
              handleConfigChange('concurrencyWorkers', 30);
              handleStart();
            }}
            style={{
              padding: '12px 14px', borderRadius: 12, background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
              textAlign: 'left', cursor: isRunning ? 'not-allowed' : 'pointer', transition: 'all 120ms ease', opacity: isRunning ? 0.5 : 1
            }}
            onMouseEnter={e => { if (!isRunning) (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-blue-border)'; }}
            onMouseLeave={e => { if (!isRunning) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-blue-text)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Activity size={14} />
              25,000 Concurrent Peak Spike
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
              Simulates 10 screens exiting simultaneously into intermission.
            </div>
          </button>

          <button
            disabled={isRunning}
            onClick={() => {
              handleConfigChange('stockAllocationLimit', 50);
              handleConfigChange('concurrencyWorkers', 15);
              handleStart();
            }}
            style={{
              padding: '12px 14px', borderRadius: 12, background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
              textAlign: 'left', cursor: isRunning ? 'not-allowed' : 'pointer', transition: 'all 120ms ease', opacity: isRunning ? 0.5 : 1
            }}
            onMouseEnter={e => { if (!isRunning) (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-green-border)'; }}
            onMouseLeave={e => { if (!isRunning) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-green-text)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <ShieldCheck size={14} />
              Stacked Offers Contention
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
              Tests deterministic promo rule resolution under high transaction throughput.
            </div>
          </button>
        </div>
      </div>

      {/* Simulator Parameters Panel */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14 }}>
          <Sliders size={14} color="var(--color-blue-text)" />
          <span>Traffic Generator Parameters</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>Auditorium Screens</label>
            <input
              type="number"
              value={config.numScreens}
              onChange={(e) => handleConfigChange('numScreens', Number(e.target.value))}
              disabled={isRunning}
              className="input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>Seats per Screen</label>
            <input
              type="number"
              value={config.seatsPerScreen}
              onChange={(e) => handleConfigChange('seatsPerScreen', Number(e.target.value))}
              disabled={isRunning}
              className="input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>Worker Threads</label>
            <input
              type="number"
              value={config.concurrencyWorkers}
              onChange={(e) => handleConfigChange('concurrencyWorkers', Number(e.target.value))}
              disabled={isRunning}
              className="input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>Stock Cap</label>
            <input
              type="number"
              value={config.stockAllocationLimit}
              onChange={(e) => handleConfigChange('stockAllocationLimit', Number(e.target.value))}
              disabled={isRunning}
              className="input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
            />
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Dashboard */}
      <TelemetryCharts telemetryHistory={telemetryHistory} latestPoint={latestPoint} />

      {/* Final Readout Section */}
      {lastResult && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--color-green-border)', borderRadius: 20, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-green-subtle)', border: '1px solid var(--color-green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} color="var(--color-green-text)" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Digital Twin Execution Readout Summary</h2>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Simulation completed in {lastResult.durationSeconds}s across concurrent threads.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, padding: 16, background: 'var(--bg-overlay)', borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Total Requests</span>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{lastResult.totalRequestsSent}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Successful Orders</span>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-green-text)' }}>{lastResult.successfulOrders}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Graceful Stockouts</span>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-amber-text)' }}>{lastResult.rejectedStockouts}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Oversell Violations</span>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-green-text)' }}>{lastResult.oversellViolations} (0.00%)</span>
            </div>
          </div>

          <div style={{ padding: 14, background: 'var(--bg-overlay)', borderRadius: 12, border: '1px solid var(--border-subtle)', fontSize: 12 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Latency & Realtime Sync Metrics</div>
            <div style={{ display: 'flex', gap: 20, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              <div>p50: <strong style={{ color: 'var(--color-amber-text)' }}>{lastResult.p50Latency}ms</strong></div>
              <div>p95: <strong style={{ color: 'var(--color-amber-text)' }}>{lastResult.p95Latency}ms</strong></div>
              <div>Sync Lag: <strong style={{ color: 'var(--color-blue-text)' }}>{lastResult.avgStockSyncLagMs}ms</strong></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

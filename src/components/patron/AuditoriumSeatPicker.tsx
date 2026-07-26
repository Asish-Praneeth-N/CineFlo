import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { INITIAL_SCREENS } from '../../data/seedData';
import { X, Armchair, Film, Check, Sparkles, AlertCircle } from 'lucide-react';

interface AuditoriumSeatPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedScreenName: string;
  selectedSeat: string;
  onConfirmSeat: (screenName: string, seatNumber: string) => void;
}

interface SeatRowConfig {
  code: string;
  tierName: string;
  price: number;
  badgeColor: string;
}

const SEAT_ROWS: SeatRowConfig[] = [
  { code: 'A', tierName: 'Recliner Luxury', price: 650, badgeColor: 'var(--color-amber-text)' },
  { code: 'B', tierName: 'Recliner Luxury', price: 650, badgeColor: 'var(--color-amber-text)' },
  { code: 'C', tierName: 'Executive Prime', price: 380, badgeColor: 'var(--color-blue-text)' },
  { code: 'D', tierName: 'Executive Prime', price: 380, badgeColor: 'var(--color-blue-text)' },
  { code: 'E', tierName: 'Executive Prime', price: 380, badgeColor: 'var(--color-blue-text)' },
  { code: 'F', tierName: 'Executive Prime', price: 380, badgeColor: 'var(--color-blue-text)' },
  { code: 'G', tierName: 'Classic Standard', price: 290, badgeColor: 'var(--text-tertiary)' },
  { code: 'H', tierName: 'Classic Standard', price: 290, badgeColor: 'var(--text-tertiary)' },
];

// Pre-occupied seat set for realistic auditorium demo
const OCCUPIED_SEATS = new Set(['A-03', 'A-04', 'B-07', 'C-05', 'C-06', 'D-02', 'D-08', 'F-04', 'F-05', 'G-09']);

export const AuditoriumSeatPicker: React.FC<AuditoriumSeatPickerProps> = ({
  isOpen,
  onClose,
  selectedScreenName,
  selectedSeat,
  onConfirmSeat
}) => {
  const [activeScreen, setActiveScreen] = useState(selectedScreenName);
  const [tempSeat, setTempSeat] = useState(selectedSeat);

  if (!isOpen) return null;

  const handleSeatClick = (rowCode: string, seatNum: number) => {
    const formattedNum = seatNum < 10 ? `0${seatNum}` : `${seatNum}`;
    const rawCode = `${rowCode}-${formattedNum}`;
    if (OCCUPIED_SEATS.has(rawCode)) return;
    setTempSeat(`Seat ${rowCode}-${formattedNum}`);
  };

  const handleConfirm = () => {
    onConfirmSeat(activeScreen, tempSeat);
    onClose();
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(7,7,10,0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: 'var(--font-sans)',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-strong)',
            borderRadius: 24,
            width: '100%',
            maxWidth: 680,
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-2xl)',
            overflow: 'hidden',
          }}
        >
          {/* ─── Header ─── */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'var(--color-amber-subtle)',
                border: '1px solid var(--color-amber-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Armchair size={20} color="var(--color-amber-text)" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Select Delivery Seat
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  Food & beverages will be delivered straight to your seat during showtime
                </p>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              onClick={onClose}
              style={{ width: 34, height: 34, borderRadius: 10 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* ─── Auditorium Selector Dropdown ─── */}
          <div style={{ padding: '14px 24px', background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Film size={15} color="var(--color-amber-text)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Auditorium Screen:</span>
            </div>

            <select
              value={activeScreen}
              onChange={(e) => setActiveScreen(e.target.value)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 10,
                color: 'var(--color-amber-text)',
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 12px',
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {INITIAL_SCREENS.map(s => (
                <option key={s.id} value={s.name}>{s.name} ({s.totalSeats} Seats)</option>
              ))}
            </select>
          </div>

          {/* ─── Modal Scrollable Body ─── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Glowing Curved Cinema Screen */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', height: 28, maxWidth: 440, margin: '0 auto' }}>
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: 12,
                  borderRadius: '100%',
                  borderTop: '3px solid var(--color-amber-bright)',
                  background: 'linear-gradient(180deg, rgba(245,158,11,0.25) 0%, transparent 100%)',
                  boxShadow: '0 -10px 24px rgba(245,158,11,0.4)',
                }} />
              </div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-disabled)', textTransform: 'uppercase' }}>
                CINEMA AUDITORIUM SCREEN (ALL EYES THIS WAY)
              </span>
            </div>

            {/* Seat Grid Map */}
            <div style={{ overflowX: 'auto', paddingBottom: 8, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              {SEAT_ROWS.map(row => (
                <div key={row.code} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 540 }}>

                  {/* Row Code Label */}
                  <span style={{ width: 20, textAlign: 'right', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                    {row.code}
                  </span>

                  {/* Seats 1 to 10 with aisle gap after seat 5 */}
                  <div style={{ display: 'flex', gap: 5, flex: 1, justifyContent: 'center' }}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => {
                      const formattedNum = num < 10 ? `0${num}` : `${num}`;
                      const seatId = `Seat ${row.code}-${formattedNum}`;
                      const rawCode = `${row.code}-${formattedNum}`;
                      const isOccupied = OCCUPIED_SEATS.has(rawCode);
                      const isSelected = tempSeat === seatId;
                      const isAisleGap = num === 5; // Aisle divider gap

                      return (
                        <React.Fragment key={num}>
                          <button
                            disabled={isOccupied}
                            onClick={() => handleSeatClick(row.code, num)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              border: '1px solid',
                              cursor: isOccupied ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 120ms ease',
                              background: isSelected
                                ? 'var(--color-amber-bright)'
                                : isOccupied
                                ? 'rgba(239,68,68,0.08)'
                                : 'var(--bg-surface)',
                              color: isSelected
                                ? '#09090b'
                                : isOccupied
                                ? 'var(--color-red-text)'
                                : 'var(--text-secondary)',
                              borderColor: isSelected
                                ? 'var(--color-amber-bright)'
                                : isOccupied
                                ? 'rgba(239,68,68,0.2)'
                                : 'var(--border-default)',
                              opacity: isOccupied ? 0.4 : 1,
                              transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                              boxShadow: isSelected ? '0 0 16px rgba(245,158,11,0.4)' : 'none',
                            }}
                          >
                            {num}
                          </button>
                          {isAisleGap && <div style={{ width: 14 }} />}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Tier Badge */}
                  <span style={{ width: 95, fontSize: 10, fontFamily: 'var(--font-mono)', color: row.badgeColor, fontWeight: 500 }}>
                    ₹{row.price} · {row.tierName.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>

            {/* Seat Legend */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              paddingTop: 12,
              borderTop: '1px solid var(--border-subtle)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }} />
                <span>Available</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--color-amber-bright)', border: '1px solid var(--color-amber-bright)' }} />
                <span style={{ color: 'var(--color-amber-text)', fontWeight: 600 }}>Selected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 4, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }} />
                <span style={{ opacity: 0.7 }}>Occupied</span>
              </div>
            </div>

          </div>

          {/* ─── Footer Action Bar ─── */}
          <div style={{
            padding: '16px 24px',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16
          }}>
            <div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-disabled)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                SELECTED DELIVERY TARGET
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                {activeScreen.split('(')[0].trim()} · <span style={{ color: 'var(--color-amber-text)' }}>{tempSeat}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirm}
                style={{ gap: 6, padding: '10px 20px', fontSize: 13 }}
              >
                <Check size={15} />
                Confirm Seat
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

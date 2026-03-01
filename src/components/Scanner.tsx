import { useState, useRef } from 'react';
import { Search, ChevronDown, Loader2, CalendarPlus } from 'lucide-react';
import type { CalendarEvent, Category, ScanResult } from '../types';
import { predictCost, getSpendingTriggers, getWhyExplanation, getHistoricalContext } from '../utils/predictions';
import { generatePersonalities } from '../utils/personalities';
import AddEventModal from './AddEventModal';

const CATEGORIES: Category[] = ['Work', 'Personal', 'Family', 'Social', 'Health'];

const EXAMPLE_EVENTS = [
  'Study group at coffee shop (SFU)',
  'Saturday night bar crawl downtown',
  'Team lunch at Miku Restaurant',
  'Mall shopping haul — spring wardrobe',
  'Concert at Rogers Arena with friends',
  "Family brunch — mom's birthday",
  'Yoga class + smoothie after',
  'Client dinner at Yaletown steakhouse',
];

interface Props {
  onScanComplete?: (result: ScanResult) => void;
  onAddEvent?: (event: CalendarEvent) => void;
  existingEvents?: CalendarEvent[];
}

// Clean cost row with left-border accent — no emoji
function CostRow({
  label,
  amount,
  total,
  accentColor,
  valueColor = '#0F1923',
}: {
  label: string;
  amount: number;
  total: number;
  accentColor: string;
  valueColor?: string;
}) {
  const pct = total > 0 ? Math.min((amount / total) * 100, 100) : 0;
  if (amount === 0) return null;
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
      style={{ background: '#F8FAFC', borderLeft: `3px solid ${accentColor}` }}>
      <span className="text-xs font-medium flex-1" style={{ color: '#5A6880' }}>
        {label}
      </span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-20 h-1.5 rounded-full" style={{ background: '#E5EDF5' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: accentColor,
              transition: 'width 0.7s ease',
            }}
          />
        </div>
        <span className="text-xs font-bold font-mono w-10 text-right" style={{ color: valueColor, transition: 'color 0.3s ease' }}>
          ${amount}
        </span>
      </div>
    </div>
  );
}

export default function Scanner({ onScanComplete, onAddEvent, existingEvents }: Props) {
  const [input, setInput] = useState('');
  const [category, setCategory] = useState<Category>('Social');
  const [pressure, setPressure] = useState(60);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScan = () => {
    if (!input.trim()) return;
    setScanning(true);
    setResult(null);

    setTimeout(() => {
      const breakdown = predictCost(input, category, pressure);
      const triggers = getSpendingTriggers(input, pressure);
      const why = getWhyExplanation(input, category, pressure, breakdown);
      const historicalContext = getHistoricalContext(input, category);
      const { jekyll: jekyllAdvice, hyde: hydeComment } = generatePersonalities(input, breakdown, pressure);

      const scanResult: ScanResult = {
        event: input,
        category,
        socialPressure: pressure,
        breakdown,
        whyExplanation: why,
        jekyllAdvice,
        hydeComment,
        spendingTriggers: triggers,
        historicalContext,
      };

      setResult(scanResult);
      setScanning(false);
      onScanComplete?.(scanResult);
    }, 900);
  };

  const pressureColor =
    pressure < 30 ? '#059669' : pressure < 60 ? '#D97706' : pressure < 80 ? '#EA580C' : '#DC2626';
  const pressureLabel =
    pressure < 30 ? 'Low' : pressure < 60 ? 'Moderate' : pressure < 80 ? 'High' : 'Extreme';

  return (
    <div className="flex flex-col gap-5">
      {/* Input card */}
      <div className="nomi-card p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#E8F2FB' }}>
            <Search size={15} style={{ color: '#006AC3' }} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: '#0F1923' }}>Event Scanner</div>
            <div className="text-xs" style={{ color: '#8FA3B8' }}>
              Predict spend before it happens
            </div>
          </div>
          <span
            className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: '#E8F2FB', color: '#006AC3', border: '1px solid #B8D8F4' }}>
            Jekyll / Hyde
          </span>
        </div>

        {/* Event input */}
        <div className="relative mb-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            placeholder='Describe an event, e.g. "Bar crawl downtown" or "Team lunch at Miku"'
            className="w-full px-4 py-3 pr-10 rounded-xl text-sm outline-none transition-all"
            style={{
              background: '#F8FAFC',
              border: '1.5px solid #DDE5EE',
              color: '#0F1923',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#006AC3')}
            onBlur={(e) => (e.target.style.borderColor = '#DDE5EE')}
          />
          <button
            onClick={() => setShowExamples((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: '#8FA3B8' }}
            title="Show examples">
            <ChevronDown
              size={15}
              style={{
                transform: showExamples ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </button>
        </div>

        {/* Examples */}
        {showExamples && (
          <div
            className="mb-3 rounded-xl overflow-hidden slide-up"
            style={{ border: '1px solid #DDE5EE', background: 'white' }}>
            {EXAMPLE_EVENTS.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setInput(ex);
                  setShowExamples(false);
                  inputRef.current?.focus();
                }}
                className="w-full text-left px-4 py-2.5 text-xs transition-colors border-b last:border-0"
                style={{ color: '#5A6880', borderColor: '#F0F4F8' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F8FAFC';
                  e.currentTarget.style.color = '#006AC3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#5A6880';
                }}>
                {ex}
              </button>
            ))}
          </div>
        )}

        {/* Category + Pressure */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5A6880' }}>
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border cat-${cat} transition-all`}
                  style={{ opacity: category === cat ? 1 : 0.4 }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-semibold" style={{ color: '#5A6880' }}>
                Social Pressure
              </label>
              <span className="text-xs font-bold" style={{ color: pressureColor }}>
                {pressureLabel}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={pressure}
              onChange={(e) => setPressure(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${pressureColor} ${pressure}%, #E5EDF5 ${pressure}%)`,
              }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: '#B8CCE0' }}>
              <span>Low</span>
              <span>Extreme</span>
            </div>
          </div>
        </div>

        {/* Scan button */}
        <button
          onClick={handleScan}
          disabled={!input.trim() || scanning}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40"
          style={{ background: '#006AC3' }}
          onMouseEnter={(e) => !scanning && (e.currentTarget.style.background = '#004A8B')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#006AC3')}>
          {scanning ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Search size={15} />
          )}
          {scanning ? 'Analyzing event...' : 'Scan with Jekyll & Hyde'}
        </button>
      </div>

      {/* Results */}
      {scanning && (
        <div className="nomi-card p-10 flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: '#006AC3', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: '#8FA3B8' }}>Analyzing spending patterns...</p>
        </div>
      )}

      {result && !scanning && (
        <ScanResultView result={result} onAddToCalendar={onAddEvent ? () => setShowAddModal(true) : undefined} />
      )}

      {showAddModal && result && onAddEvent && (
        <AddEventModal
          onAdd={(ev) => { onAddEvent(ev); setShowAddModal(false); }}
          onClose={() => setShowAddModal(false)}
          prefill={{ title: result.event, category: result.category, socialPressure: result.socialPressure }}
          existingEvents={existingEvents}
        />
      )}
    </div>
  );
}

function ScanResultView({ result, onAddToCalendar }: { result: ScanResult; onAddToCalendar?: () => void }) {
  const [hydeLevel, setHydeLevel] = useState(50);

  // Multiplier: Jekyll(0)=0.6×  Balanced(50)=1.0×  Hyde(100)=1.5×
  const multiplier = hydeLevel <= 50
    ? 0.6 + (hydeLevel / 50) * 0.4
    : 1.0 + ((hydeLevel - 50) / 50) * 0.5;

  const adjFood       = Math.round(result.breakdown.food       * multiplier);
  const adjTransport  = Math.round(result.breakdown.transport  * multiplier);
  const adjActivities = Math.round(result.breakdown.activities * multiplier);
  const adjTotal      = adjFood + adjTransport + adjActivities;
  const baseCost      = result.breakdown.total;
  const diff          = adjTotal - baseCost;

  const valueColor =
    hydeLevel < 40 ? '#059669' :
    hydeLevel < 55 ? '#5A6880' :
    hydeLevel < 75 ? '#D97706' : '#DC2626';

  const totalColor =
    adjTotal > 100 ? '#DC2626' : adjTotal > 60 ? '#EA580C' : adjTotal > 30 ? '#D97706' : '#006AC3';

  return (
    <div className="space-y-4 slide-up">
      {/* Cost breakdown */}
      <div className="nomi-card p-5">
        {/* Total header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-sm font-bold" style={{ color: '#0F1923' }}>
              Predicted Cost Breakdown
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#8FA3B8' }}>
              {result.event}
            </div>
          </div>
          <div
            className="text-3xl font-black font-mono"
            style={{ color: totalColor, transition: 'color 0.3s ease' }}>
            ${adjTotal}
          </div>
        </div>

        {/* Cost rows */}
        <div className="space-y-2 mb-4">
          <CostRow label="Food & Drinks"  amount={adjFood}       total={adjTotal} accentColor="#F59E0B" valueColor={valueColor} />
          <CostRow label="Transport"      amount={adjTransport}  total={adjTotal} accentColor="#006AC3" valueColor={valueColor} />
          <CostRow label="Activities"     amount={adjActivities} total={adjTotal} accentColor="#7C3AED" valueColor={valueColor} />
        </div>

        {/* Why this estimate */}
        <div
          className="rounded-xl p-4 mb-3"
          style={{ background: '#F8FAFC', border: '1px solid #E5EDF5' }}>
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#5A6880' }}>
            Why this estimate
          </div>
          <p className="text-xs leading-relaxed mb-3" style={{ color: '#374151' }}>
            {result.whyExplanation}
          </p>

          {/* Historical context — data-driven feel */}
          <div
            className="rounded-lg p-3"
            style={{ background: '#E8F2FB', borderLeft: '3px solid #006AC3' }}>
            <div className="text-xs font-semibold mb-1.5" style={{ color: '#006AC3' }}>
              Historical patterns
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#1E40AF' }}>
              {result.historicalContext}
            </p>
          </div>
        </div>

        {/* Spending triggers — clean tags, no emoji */}
        {result.spendingTriggers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {result.spendingTriggers.map((trigger) => (
              <span
                key={trigger}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                {trigger}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Temptation Slider ── */}
      <div className="nomi-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold" style={{ color: '#0F1923' }}>Temptation Slider</div>
          {diff !== 0 && (
            <span
              className="text-xs font-bold font-mono px-2 py-0.5 rounded-full"
              style={{
                background: diff < 0 ? '#E6F9F0' : '#FEE2E2',
                color: diff < 0 ? '#059669' : '#DC2626',
                border: `1px solid ${diff < 0 ? '#A7E8CB' : '#FECACA'}`,
                transition: 'all 0.3s ease',
              }}>
              {diff < 0 ? `Save $${-diff}` : `+$${diff} extra`}
            </span>
          )}
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={hydeLevel}
          onChange={(e) => setHydeLevel(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer mb-2"
          style={{
            background: 'linear-gradient(to right, #059669 0%, #EEF3F8 50%, #DC2626 100%)',
          }}
        />

        <div className="flex justify-between text-xs font-semibold mb-3">
          <span style={{ color: '#059669' }}>Listen to Jekyll</span>
          <span style={{ color: '#DC2626' }}>Give in to Hyde</span>
        </div>

        {diff < 0 && (
          <div
            className="rounded-lg px-3 py-2 text-xs font-semibold slide-up"
            style={{ background: '#E6F9F0', color: '#059669', border: '1px solid #A7E8CB' }}>
            Jekyll saves you ${-diff} — well done for listening!
          </div>
        )}
        {diff > 0 && (
          <div
            className="rounded-lg px-3 py-2 text-xs font-semibold slide-up"
            style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}>
            Hyde costs you ${diff} extra. Is it really worth it?
          </div>
        )}
        {diff === 0 && (
          <div
            className="rounded-lg px-3 py-2 text-xs font-semibold"
            style={{ background: '#F0F4F8', color: '#5A6880', border: '1px solid #DDE5EE' }}>
            Balanced — Jekyll and Hyde are in equilibrium.
          </div>
        )}
      </div>

      {/* Jekyll & Hyde — clean white cards, colored left borders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Jekyll — green left border */}
        <div
          className="nomi-card p-5"
          style={{ borderLeft: '4px solid #059669' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
              style={{ background: '#E6F9F0', color: '#059669' }}>
              J
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: '#059669' }}>DR. JEKYLL</div>
              <div className="text-xs" style={{ color: '#8FA3B8' }}>Calm · Rational · Helpful</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#1A2E1A' }}>
            {result.jekyllAdvice}
          </p>
        </div>

        {/* Hyde — red left border */}
        <div
          className="nomi-card p-5"
          style={{ borderLeft: '4px solid #DC2626' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
              style={{ background: '#FEE2E2', color: '#DC2626' }}>
              H
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: '#DC2626' }}>MR. HYDE</div>
              <div className="text-xs" style={{ color: '#8FA3B8' }}>Sarcastic · Impulsive · Real</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#2D1111' }}>
            {result.hydeComment}
          </p>
        </div>
      </div>

      {/* Add to Calendar CTA */}
      {onAddToCalendar && (
        <button
          onClick={onAddToCalendar}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all slide-up"
          style={{ background: 'linear-gradient(135deg, #006AC3, #004A8B)' }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
          <CalendarPlus size={16} />
          Add to My Calendar
        </button>
      )}
    </div>
  );
}

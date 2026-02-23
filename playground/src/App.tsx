import { useState, useCallback, useRef, useEffect } from 'react'
import { crack, decrypt, detect, encrypt, getEncryptableCipherTypes } from 'codecracker'
import type { CrackResult, DetectionCandidate, CipherType, EncryptResult } from 'codecracker'

type Mode = 'crack' | 'detect' | 'decrypt' | 'encrypt'

const CIPHER_TYPES: CipherType[] = [
  'caesar', 'rot13', 'atbash', 'vigenere', 'substitution',
  'rail-fence', 'playfair', 'columnar-transposition',
  'base64', 'base32', 'hex', 'binary', 'url-encoding', 'morse',
  'xor', 'hash-lookup', 'aes', 'rsa',
]

const EXAMPLES = [
  { label: 'ROT13', input: 'Uryyb Jbeyq' },
  { label: 'Base64', input: 'SGVsbG8gV29ybGQ=' },
  { label: 'Caesar', input: 'Khoor Zruog' },
  { label: 'Hex', input: '48656c6c6f20576f726c64' },
  { label: 'Morse', input: '.... . .-.. .-.. ---' },
  { label: 'Binary', input: '01001000 01101001' },
  { label: 'Atbash', input: 'Svool Dliow' },
  { label: 'URL', input: 'Hello%20World%21' },
]

const ENCRYPTABLE_TYPES = getEncryptableCipherTypes()

const MODE_LABELS: Record<Mode, { cmd: string; desc: string }> = {
  crack: { cmd: 'crack', desc: 'auto-detect & decrypt' },
  detect: { cmd: 'detect', desc: 'identify cipher type' },
  decrypt: { cmd: 'decrypt', desc: 'known cipher + key' },
  encrypt: { cmd: 'encrypt', desc: 'encrypt plaintext' },
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 70
    ? 'text-[var(--phosphor)] bg-[var(--phosphor)]'
    : pct >= 40
      ? 'text-[var(--amber)] bg-[var(--amber)]'
      : 'text-red-400 bg-red-400'
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div className="h-1.5 w-20 rounded-full bg-[var(--terminal-border)] overflow-hidden">
        <div
          className={`h-full rounded-full confidence-fill ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums opacity-70">{pct}%</span>
    </div>
  )
}

function CrackResultCard({ result, index }: { result: CrackResult; index: number }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      className="result-card border border-[var(--terminal-border)] rounded-md bg-[var(--terminal-surface)] p-4 hover:border-[var(--terminal-border-bright)] transition-colors"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded border border-[var(--phosphor-dim)] bg-[rgba(57,255,20,0.08)] px-2 py-0.5 text-[11px] font-semibold text-[var(--phosphor)] uppercase tracking-wider">
              {result.cipherType}
            </span>
            {result.key !== undefined && (
              <span className="inline-flex items-center rounded border border-[var(--terminal-border-bright)] bg-[var(--terminal-bg)] px-2 py-0.5 text-[11px] text-[var(--amber)] tabular-nums">
                key: {String(result.key)}
              </span>
            )}
          </div>
          <p className="text-[var(--phosphor-bright)] break-all text-[15px] leading-relaxed">
            {result.plaintext}
          </p>
        </div>
        <ConfidenceBar value={result.confidence} />
      </div>
      {result.details && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-[11px] text-[var(--phosphor-dim)] hover:text-[var(--phosphor)] cursor-pointer transition-colors uppercase tracking-widest"
        >
          {expanded ? '[-] hide details' : '[+] show details'}
        </button>
      )}
      {expanded && result.details && (
        <pre className="mt-2 text-[11px] text-[var(--phosphor-dim)] overflow-x-auto leading-relaxed border-t border-[var(--terminal-border)] pt-2">
          {JSON.stringify(result.details, null, 2)}
        </pre>
      )}
    </div>
  )
}

function DetectionCard({ candidate, index }: { candidate: DetectionCandidate; index: number }) {
  return (
    <div
      className="result-card flex items-center gap-4 border border-[var(--terminal-border)] rounded-md bg-[var(--terminal-surface)] p-4 hover:border-[var(--terminal-border-bright)] transition-colors"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <span className="text-sm font-bold text-[var(--phosphor-dim)] tabular-nums w-5 text-right">{index + 1}</span>
      <span className="text-[var(--phosphor)] uppercase tracking-wider text-sm font-semibold">{candidate.cipherType}</span>
      <div className="ml-auto">
        <ConfidenceBar value={candidate.confidence} />
      </div>
    </div>
  )
}

function LoadingIndicator() {
  return (
    <div className="flex items-center gap-3 py-8 justify-center">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--phosphor)]"
            style={{
              animation: 'glow-pulse 1s ease-in-out infinite',
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>
      <span className="text-[var(--phosphor-dim)] text-sm">decrypting...</span>
    </div>
  )
}

export default function App() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<Mode>('crack')
  const [cipherType, setCipherType] = useState<CipherType>('caesar')
  const [key, setKey] = useState('')
  const [maxResults, setMaxResults] = useState(5)

  const [crackResults, setCrackResults] = useState<CrackResult[]>([])
  const [detectionResults, setDetectionResults] = useState<DetectionCandidate[]>([])
  const [encryptResult, setEncryptResult] = useState<EncryptResult | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return

    setLoading(true)
    setError('')
    setCrackResults([])
    setDetectionResults([])
    setEncryptResult(null)
    setWarnings([])

    try {
      if (mode === 'encrypt') {
        const result = await encrypt(input, cipherType, {
          key: key || undefined,
        })
        setEncryptResult(result)
      } else if (mode === 'detect') {
        const candidates = detect(input)
        setDetectionResults(candidates.slice(0, maxResults))
      } else if (mode === 'decrypt') {
        const results = await decrypt(input, cipherType, {
          key: key || undefined,
          maxResults,
        })
        setCrackResults(results.slice(0, maxResults))
      } else {
        const response = await crack(input, {
          maxResults,
          key: key || undefined,
        })
        setCrackResults(response.results)
        setWarnings(response.warnings)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
    }
  }, [input, mode, cipherType, key, maxResults])

  const hasResults = crackResults.length > 0 || detectionResults.length > 0 || encryptResult !== null

  return (
    <div className="min-h-screen relative">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(57,255,20,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-2xl px-5 py-14">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-[var(--phosphor-dim)] text-sm select-none">$</span>
            <h1 className="text-3xl tracking-tight font-bold">
              <span className="text-[var(--phosphor-bright)]" style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400 }}>
                codec
              </span>
              <span className="text-[var(--phosphor)]">racker</span>
            </h1>
            <span className="cursor-blink text-[var(--phosphor)] text-3xl font-light" />
          </div>
          <p className="text-[var(--phosphor-dim)] text-[13px] tracking-wide pl-4">
            cipher detection &amp; decryption in the browser
          </p>
        </header>

        {/* Mode selector as terminal command tabs */}
        <div className="mb-5 flex gap-0.5 text-sm">
          {(Object.entries(MODE_LABELS) as [Mode, typeof MODE_LABELS[Mode]][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-t-md cursor-pointer transition-all text-[13px] ${
                mode === m
                  ? 'bg-[var(--terminal-surface)] text-[var(--phosphor)] border border-b-0 border-[var(--terminal-border-bright)]'
                  : 'text-[var(--phosphor-dim)] hover:text-[var(--phosphor)] border border-transparent'
              }`}
            >
              <span className="font-semibold">{label.cmd}</span>
              <span className="hidden sm:inline text-[11px] ml-1.5 opacity-50">({label.desc})</span>
            </button>
          ))}
        </div>

        {/* Main input panel */}
        <div className="border border-[var(--terminal-border-bright)] rounded-md bg-[var(--terminal-surface)] overflow-hidden mb-5">
          {/* Decrypt/Encrypt mode options */}
          {(mode === 'decrypt' || mode === 'encrypt') && (
            <div className="flex gap-3 p-3 border-b border-[var(--terminal-border)] bg-[var(--terminal-bg)]">
              <select
                value={cipherType}
                onChange={(e) => setCipherType(e.target.value as CipherType)}
                className="rounded border border-[var(--terminal-border-bright)] bg-[var(--terminal-surface)] px-2.5 py-1.5 text-[13px] text-[var(--phosphor)] cursor-pointer"
              >
                {(mode === 'encrypt' ? ENCRYPTABLE_TYPES : CIPHER_TYPES).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="key (optional)"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="flex-1 rounded border border-[var(--terminal-border)] bg-[var(--terminal-surface)] px-2.5 py-1.5 text-[13px] text-[var(--phosphor)]"
              />
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
            }}
            placeholder={mode === 'encrypt' ? 'enter plaintext here...' : 'paste ciphertext here...'}
            rows={3}
            className="w-full bg-transparent px-4 py-3 text-[14px] text-[var(--phosphor-bright)] placeholder:text-[var(--phosphor-dim)] placeholder:opacity-40 resize-y border-none"
          />

          {/* Action bar */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-t border-[var(--terminal-border)] bg-[var(--terminal-bg)]">
            <button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="rounded px-5 py-1.5 text-[13px] font-semibold cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-[var(--phosphor)] text-[var(--terminal-bg)] hover:bg-[var(--phosphor-bright)] hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] active:scale-[0.98]"
            >
              {loading ? 'processing...' : mode === 'encrypt' ? 'encrypt' : mode === 'detect' ? 'detect' : 'crack'}
            </button>

            <div className="flex items-center gap-1.5 ml-auto text-[12px] text-[var(--phosphor-dim)]">
              <span>max:</span>
              <input
                type="number"
                min={1}
                max={20}
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value) || 5)}
                className="w-10 rounded border border-[var(--terminal-border)] bg-[var(--terminal-surface)] px-1.5 py-0.5 text-center text-[12px] text-[var(--phosphor)] tabular-nums"
              />
            </div>

            <span className="text-[11px] text-[var(--phosphor-dim)] opacity-40 hidden sm:inline">
              {navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl'}+Enter
            </span>
          </div>
        </div>

        {/* Examples */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] text-[var(--phosphor-dim)] opacity-50 uppercase tracking-widest mr-1 self-center">
              try:
            </span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => { setInput(ex.input); setMode('crack') }}
                className="rounded border border-[var(--terminal-border)] px-2.5 py-1 text-[11px] text-[var(--phosphor-dim)] hover:text-[var(--phosphor)] hover:border-[var(--phosphor-dim)] cursor-pointer transition-all hover:bg-[rgba(57,255,20,0.04)]"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results area */}
        <div ref={resultsRef}>
          {/* Loading */}
          {loading && <LoadingIndicator />}

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-md border border-red-900/50 bg-red-950/30 px-4 py-3 text-[13px] text-red-400 animate-[fade-up_0.2s_ease-out]">
              <span className="opacity-60 mr-2">ERR</span>{error}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mb-4 rounded-md border border-[var(--amber-dim)] bg-[rgba(255,176,0,0.05)] px-4 py-3 text-[13px] text-[var(--amber)] animate-[fade-up_0.2s_ease-out]">
              <span className="opacity-60 mr-2">WARN</span>
              {warnings.join(' | ')}
            </div>
          )}

          {/* Encrypt result */}
          {encryptResult && (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2 mb-3">
                <h2 className="text-[11px] text-[var(--phosphor-dim)] uppercase tracking-[0.2em] font-semibold">encrypted</h2>
                <div className="flex-1 h-px bg-[var(--terminal-border)]" />
              </div>
              <div className="result-card border border-[var(--terminal-border)] rounded-md bg-[var(--terminal-surface)] p-4 hover:border-[var(--terminal-border-bright)] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center rounded border border-[var(--phosphor-dim)] bg-[rgba(57,255,20,0.08)] px-2 py-0.5 text-[11px] font-semibold text-[var(--phosphor)] uppercase tracking-wider">
                    {encryptResult.cipherType}
                  </span>
                  {encryptResult.key !== undefined && (
                    <span className="inline-flex items-center rounded border border-[var(--terminal-border-bright)] bg-[var(--terminal-bg)] px-2 py-0.5 text-[11px] text-[var(--amber)] tabular-nums">
                      key: {String(encryptResult.key)}
                    </span>
                  )}
                </div>
                <p className="text-[var(--phosphor-bright)] break-all text-[15px] leading-relaxed select-all">
                  {encryptResult.ciphertext}
                </p>
              </div>
            </div>
          )}

          {/* Detection results */}
          {detectionResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2 mb-3">
                <h2 className="text-[11px] text-[var(--phosphor-dim)] uppercase tracking-[0.2em] font-semibold">detected</h2>
                <div className="flex-1 h-px bg-[var(--terminal-border)]" />
              </div>
              {detectionResults.map((c, i) => (
                <DetectionCard key={`${c.cipherType}-${i}`} candidate={c} index={i} />
              ))}
            </div>
          )}

          {/* Crack results */}
          {crackResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2 mb-3">
                <h2 className="text-[11px] text-[var(--phosphor-dim)] uppercase tracking-[0.2em] font-semibold">
                  results
                </h2>
                <span className="text-[11px] text-[var(--phosphor-dim)] opacity-40 tabular-nums">
                  ({crackResults.length})
                </span>
                <div className="flex-1 h-px bg-[var(--terminal-border)]" />
              </div>
              {crackResults.map((r, i) => (
                <CrackResultCard key={`${r.cipherType}-${r.plaintext}-${i}`} result={r} index={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !hasResults && !error && (
            <div className="text-center py-12 text-[var(--phosphor-dim)] opacity-30 text-sm select-none">
              awaiting input...
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-[var(--terminal-border)] text-center text-[11px] text-[var(--phosphor-dim)] opacity-30 tracking-wider">
          codecracker v1.0.0
        </footer>
      </div>
    </div>
  )
}

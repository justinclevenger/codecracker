import { useState, useCallback } from 'react'
import { crack, decrypt, detect } from 'codecracker'
import type { CrackResult, DetectionCandidate, CipherType } from 'codecracker'

type Mode = 'crack' | 'detect' | 'decrypt'

const CIPHER_TYPES: CipherType[] = [
  'caesar', 'rot13', 'atbash', 'vigenere', 'substitution',
  'rail-fence', 'playfair', 'columnar-transposition',
  'base64', 'base32', 'hex', 'binary', 'url-encoding', 'morse',
  'xor', 'hash-lookup', 'aes', 'rsa',
]

const EXAMPLES = [
  { label: 'ROT13', input: 'Uryyb Jbeyq' },
  { label: 'Base64', input: 'SGVsbG8gV29ybGQ=' },
  { label: 'Caesar (shift 3)', input: 'Khoor Zruog' },
  { label: 'Hex', input: '48656c6c6f20576f726c64' },
  { label: 'Morse', input: '.... . .-.. .-.. ---' },
  { label: 'Binary', input: '01001000 01101001' },
  { label: 'Atbash', input: 'Svool Dliow' },
  { label: 'URL encoding', input: 'Hello%20World%21' },
]

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-gray-700 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400">{pct}%</span>
    </div>
  )
}

function CrackResultCard({ result }: { result: CrackResult }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block rounded bg-indigo-600/80 px-2 py-0.5 text-xs font-mono">
              {result.cipherType}
            </span>
            {result.key !== undefined && (
              <span className="inline-block rounded bg-gray-700 px-2 py-0.5 text-xs font-mono">
                key: {String(result.key)}
              </span>
            )}
          </div>
          <p className="font-mono text-green-300 break-all">{result.plaintext}</p>
        </div>
        <ConfidenceBar value={result.confidence} />
      </div>
      {result.details && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>
      )}
      {expanded && result.details && (
        <pre className="mt-2 text-xs text-gray-500 overflow-x-auto">
          {JSON.stringify(result.details, null, 2)}
        </pre>
      )}
    </div>
  )
}

function DetectionCard({ candidate, index }: { candidate: DetectionCandidate; index: number }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <span className="text-lg font-bold text-gray-500">{index + 1}.</span>
      <span className="font-mono text-indigo-300">{candidate.cipherType}</span>
      <ConfidenceBar value={candidate.confidence} />
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
  const [warnings, setWarnings] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return

    setLoading(true)
    setError('')
    setCrackResults([])
    setDetectionResults([])
    setWarnings([])

    try {
      if (mode === 'detect') {
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
    }
  }, [input, mode, cipherType, key, maxResults])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-indigo-400">codec</span>racker
          </h1>
          <p className="mt-2 text-gray-400">
            Auto-detect and crack ciphers in the browser
          </p>
        </div>

        {/* Mode tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-gray-900 p-1">
          {(['crack', 'detect', 'decrypt'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium capitalize cursor-pointer transition-colors ${
                mode === m
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Options row (decrypt mode) */}
        {mode === 'decrypt' && (
          <div className="mb-4 flex gap-3">
            <select
              value={cipherType}
              onChange={(e) => setCipherType(e.target.value as CipherType)}
              className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100"
            >
              {CIPHER_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Key (optional)"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-500"
            />
          </div>
        )}

        {/* Input area */}
        <div className="mb-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
            }}
            placeholder="Paste ciphertext here..."
            rows={4}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 font-mono text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none resize-y"
          />
        </div>

        {/* Controls row */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {loading ? 'Processing...' : mode === 'detect' ? 'Detect' : 'Crack'}
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-400">
            Max results:
            <input
              type="number"
              min={1}
              max={20}
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value) || 5)}
              className="w-16 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-center text-sm text-gray-100"
            />
          </label>
        </div>

        {/* Examples */}
        <div className="mb-8">
          <p className="mb-2 text-xs text-gray-500 uppercase tracking-wide">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => { setInput(ex.input); setMode('crack') }}
                className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-300 hover:border-indigo-500 hover:text-indigo-300 cursor-pointer transition-colors"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mb-4 rounded-lg border border-yellow-800 bg-yellow-900/30 px-4 py-3 text-sm text-yellow-300">
            {warnings.map((w, i) => <p key={i}>{w}</p>)}
          </div>
        )}

        {/* Results */}
        {detectionResults.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Detected Cipher Types</h2>
            {detectionResults.map((c, i) => (
              <DetectionCard key={`${c.cipherType}-${i}`} candidate={c} index={i} />
            ))}
          </div>
        )}

        {crackResults.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
              Results ({crackResults.length})
            </h2>
            {crackResults.map((r, i) => (
              <CrackResultCard key={`${r.cipherType}-${r.plaintext}-${i}`} result={r} />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-xs text-gray-600">
          codecracker &mdash; auto-detect and crack ciphers
        </footer>
      </div>
    </div>
  )
}

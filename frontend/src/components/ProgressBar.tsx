interface ProgressBarProps {
  value: number // 0-100
  color?: string
  height?: number
  showLabel?: boolean
  label?: string
}

export default function ProgressBar({
  value,
  color,
  height = 8,
  showLabel = false,
  label,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div>
      {(showLabel || label) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          {label && <span style={{ fontSize: 13, color: 'var(--text-mid)', fontWeight: 600 }}>{label}</span>}
          {showLabel && (
            <span style={{ fontSize: 13, color: 'var(--text-soft)' }}>{clampedValue}%</span>
          )}
        </div>
      )}
      <div
        className="progress-bar"
        style={{ height }}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="progress-fill"
          style={{
            width: `${clampedValue}%`,
            background: color
              ? color
              : `linear-gradient(90deg, var(--terra), var(--terra-light))`,
          }}
        />
      </div>
    </div>
  )
}

// components/CircularProgress.tsx
interface CircularProgressProps {
    value: number;
  }
  
  export function CircularProgress({ value }: CircularProgressProps) {
    const circumference = 2 * Math.PI * 58; // r=58
    const offset = circumference - (value / 100) * circumference;
  
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120">
        <circle
          className="text-gray-200"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r="58"
          cx="60"
          cy="60"
        />
        <circle
          className="text-blue-600"
          strokeWidth="8"
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="58"
          cx="60"
          cy="60"
          style={{
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset: offset,
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
          }}
        />
      </svg>
    );
  }
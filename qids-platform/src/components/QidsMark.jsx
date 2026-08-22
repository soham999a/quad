export default function QidsMark({ className = '', size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="1" y="1" width="26" height="26" stroke="currentColor" strokeWidth="1.5" />
      <line x1="14" y1="1" x2="14" y2="27" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      <line x1="1" y1="14" x2="27" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      <rect x="15" y="2" width="11" height="11" fill="#B8924A" />
    </svg>
  );
}

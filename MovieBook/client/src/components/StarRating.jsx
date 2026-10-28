import React from "react";

// A five-point star drawn in a 24 x 24 box (its left tip is at x = 2, its right tip at x = 22)
const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

// One star, filled from its left side. fill is 0 to 1 (0.5 = left half filled).
function Star({ fill, size, filledClass, emptyClass }) {
  // Clip between the star's own left and right tips, so 0.5 really is "half a star"
  const clipPercent = fill <= 0 ? 0 : fill >= 1 ? 100 : ((2 + fill * 20) / 24) * 100;

  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      {/* empty star underneath */}
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d={STAR_PATH} className={emptyClass} />
      </svg>
      {/* filled star on top, cut off at the fill percentage */}
      <span
        className="absolute top-0 left-0 h-full overflow-hidden"
        style={{ width: `${clipPercent}%` }}
      >
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path d={STAR_PATH} className={filledClass} />
        </svg>
      </span>
    </span>
  );
}

// Five stars showing a rating from 0 to 5 (decimals allowed, e.g. 3.7)
// Colors are Tailwind fill classes (see the colors in App.css).
export default function StarRating({
  rating = 0,
  size = 22,
  filledClass = "fill-star",
  emptyClass = "fill-line",
}) {
  const value = Math.min(5, Math.max(0, Number(rating) || 0));
  const label = `${value.toFixed(1)} out of 5`;

  return (
    <span role="img" aria-label={`Rated ${label}`} title={label} className="inline-flex gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          fill={Math.min(1, Math.max(0, value - i))}
          size={size}
          filledClass={filledClass}
          emptyClass={emptyClass}
        />
      ))}
    </span>
  );
}

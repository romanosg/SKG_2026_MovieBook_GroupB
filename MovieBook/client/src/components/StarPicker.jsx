import React, { useState } from "react";
import { Star } from "./StarRating";

// Five clickable stars to pick a whole-number rating from 1 to 5.
// value is the chosen rating (0 = none yet).
export default function StarPicker({ value, onChange, size = 28 }) {
  const [hover, setHover] = useState(null); // the star under the mouse, as a preview
  const shown = hover ?? value ?? 0;

  return (
    <div
      role="group"
      aria-label="Star rating"
      className="flex items-center gap-1"
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} out of 5`}
          aria-pressed={value === n}
          className="cursor-pointer p-0"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
        >
          <Star fill={shown >= n ? 1 : 0} size={size} filledClass="fill-star" emptyClass="fill-line" />
        </button>
      ))}
    </div>
  );
}

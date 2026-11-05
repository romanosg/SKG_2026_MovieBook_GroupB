import React from "react";

// A small blue label with a dropdown next to it (Genre, Sort by, Order, ...)
//
//   <SelectControl id="genre" label="Genre" value={genre} onChange={setGenre}
//                  options={[{ value: "", label: "All" }, ...]} />
export default function SelectControl({ id, label, value, onChange, options }) {
  return (
    <div className="flex items-center gap-2.5">
      <label htmlFor={id} className="label-brand border-b-2 border-brand pb-0.5">
        {label}
      </label>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

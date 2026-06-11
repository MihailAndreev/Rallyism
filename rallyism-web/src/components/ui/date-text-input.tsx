"use client";

import { useState } from "react";

type DateTextInputProps = {
  className: string;
  defaultValue?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
};

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function DateTextInput({
  className,
  defaultValue = "",
  name,
  placeholder = "dd/mm/yyyy",
  required = false,
}: DateTextInputProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <input
      className={className}
      inputMode="numeric"
      maxLength={10}
      name={name}
      onChange={(event) => setValue(formatDateInput(event.target.value))}
      placeholder={placeholder}
      required={required}
      type="text"
      value={value}
    />
  );
}

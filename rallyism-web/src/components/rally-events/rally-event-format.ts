export function formatChampionship(championship: "WRC" | "ERC" | "national" | "other") {
  if (championship === "national") {
    return "National rally";
  }

  if (championship === "other") {
    return "Other";
  }

  return championship;
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Date TBC";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function formatDateRange(startDate: string | null, endDate: string | null) {
  const start = formatDate(startDate);
  const normalizedEndDate = endDate ?? startDate;
  const end =
    normalizedEndDate && normalizedEndDate !== startDate
      ? formatDate(normalizedEndDate)
      : null;

  return end ? `${start} - ${end}` : start;
}

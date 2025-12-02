// Date Formatting

export function formatDateToString1 (opened_at: Date) {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const used_format = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone: userTimezone
  });
  // I want the date to be formatted to Jakarta Timezone, because it does not work 
  // with the default timezone in the server
  const date = used_format.format(new Date(opened_at));
  return date;
}

export function formatDateToString2 (opened_at: Date, ended_at: Date) {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const used_format = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone: userTimezone
  });
  const date0 = used_format.format(new Date(opened_at));
  const date1 = used_format.format(new Date(ended_at));

  return `${date0} - ${date1}`;
}

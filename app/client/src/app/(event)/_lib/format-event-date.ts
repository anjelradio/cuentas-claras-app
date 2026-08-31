const eventDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

export function formatEventDate(value: string): string {
  return eventDateFormatter.format(new Date(value))
}

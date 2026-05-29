/**
 * Pick black or white text for maximum legibility on an arbitrary hex
 * background, using WCAG relative luminance. Keeps user-chosen tag colours
 * readable in both light and dark mode.
 */
export function readableTextColor(hex: string): string {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex)
  if (!match) return '#ffffff'
  const int = parseInt(match[1], 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255

  const toLinear = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)

  const contrastWithWhite = 1.05 / (luminance + 0.05)
  const contrastWithBlack = (luminance + 0.05) / 0.05
  return contrastWithBlack >= contrastWithWhite ? '#000000' : '#ffffff'
}

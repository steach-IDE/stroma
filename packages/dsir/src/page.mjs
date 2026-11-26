// The tokens that paint the page and its text, found by name: `background` or the shortest `*-background`;
// `foreground`, `*-text-primary` or `*-foreground`. The Flutter emitter (emitter.dart, _pageTokens) holds the same rule.
// A DSIR whose tokens have no such names says its page colours in `tokens.page` instead.
export function pageTokenNames(colorTokens) {
  const names = Object.keys(colorTokens).sort();
  const find = (exact, suffixes) => {
    const hit = names.find((n) => exact.includes(n));
    if (hit) return hit;
    for (const suffix of suffixes) {
      const hits = names.filter((n) => n.endsWith(suffix)).sort((a, b) => a.length - b.length);
      if (hits.length) return hits[0];
    }
    return null;
  };
  return { background: find(['background'], ['-background']), foreground: find(['foreground'], ['-text-primary', '-foreground']) };
}

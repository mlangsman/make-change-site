/**
 * Retypes one word of the headline every few seconds, behind a blinking caret.
 *
 * Entries are written "Draft > Word": the draft is typed, the caret hesitates,
 * and it is corrected to the word. Corrections only delete back to the letters
 * the two share ("Hell" -> "Hel" -> "Helpful"), the way a person edits.
 * Entries ending in the home word are used for the trip back to it.
 */

export interface TypedWordOptions {
  /** The word the headline is written with, e.g. "Helpful". */
  home: string;
  /** "Draft > Word" entries, or plain words. */
  entries: string[];
  /** Milliseconds each word stays before the next change. */
  hold?: number;
  /** Milliseconds before the first change after page load. */
  firstDelay?: number;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function shuffle<T>(list: T[]) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function startTypedWord(host: HTMLElement, options: TypedWordOptions) {
  const { home, hold = 5000, firstDelay = 4000 } = options;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const parse = (entry: string) => entry.split('>').map((w) => w.trim()).filter(Boolean);
  const finalOf = (entry: string) => parse(entry).at(-1);
  const homes = options.entries.filter((e) => finalOf(e) === home);
  const alts = shuffle(options.entries.filter((e) => finalOf(e) !== home));
  if (!alts.length) return;

  host.textContent = '';
  const text = document.createElement('span');
  text.className = 'typed-text';
  text.textContent = home;
  const caret = document.createElement('span');
  caret.className = 'typed-caret';
  caret.setAttribute('aria-hidden', 'true');
  host.append(text, caret);

  let shown = home;
  let altIndex = 0;
  let homeIndex = 0;
  let onScreen = true;

  /** `alt` colours the word plum; leave it out to keep the current colour. */
  const show = (s: string, alt?: boolean) => {
    shown = s;
    text.textContent = s;
    if (alt !== undefined) text.classList.toggle('is-alt', alt);
  };

  const blink = (times: number) =>
    caret
      .animate(
        { opacity: Array.from({ length: times * 2 + 1 }, (_, i) => (i % 2 ? 0 : 1)) },
        { duration: times * 700, easing: `steps(${times * 2}, jump-none)` },
      )
      .finished.catch(() => undefined);

  const shared = (a: string, b: string) => {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return i;
  };

  const retype = async (word: string, eraseSpeed: number) => {
    const keep = shared(shown, word);
    for (let k = shown.length - 1; k >= keep; k--) {
      show(shown.slice(0, k));
      await wait(eraseSpeed);
    }
    await blink(1);
    for (let k = keep + 1; k <= word.length; k++) {
      show(word.slice(0, k), word !== home);
      await wait(70 + Math.random() * 60);
    }
  };

  const play = async (entry: string) => {
    const parts = parse(entry);
    caret.classList.add('is-on');
    await wait(350);
    let eraseSpeed = 50;
    for (const part of parts) {
      await retype(part, eraseSpeed);
      if (part !== parts.at(-1)) {
        await blink(1);
        await wait(150);
        eraseSpeed = 38;
      }
    }
    await blink(2);
    caret.classList.remove('is-on');
  };

  const next = () => {
    if (shown !== home) return homes.length ? homes[homeIndex++ % homes.length] : home;
    return alts[altIndex++ % alts.length];
  };

  const loop = async () => {
    if (document.visibilityState === 'visible' && onScreen) {
      await play(next());
      setTimeout(loop, hold);
    } else {
      setTimeout(loop, 1000);
    }
  };

  new IntersectionObserver(([e]) => (onScreen = e.isIntersecting)).observe(host);
  setTimeout(loop, firstDelay);
}

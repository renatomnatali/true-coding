// ---------------------------------------------------------------------------
// Keyword pairs for each discovery question.
// Each pair is [word1, word2] — both must appear in the response (case-insensitive,
// diacritics-stripped) for us to conclude Claude re-asked that question.
// Chosen to be unique per question and resilient to bold markers / minor rephrasing.
// ---------------------------------------------------------------------------
const QUESTION_KEYWORDS: Record<number, [string, string]> = {
  1: ['problema', 'para quem'],        // "Qual problema voce quer resolver e para quem?"
  2: ['funcionalidades', 'must-have'], // "3-5 funcionalidades principais (must-have)"
  3: ['diferenciar', 'concorrentes'],  // "O que vai diferenciar ... concorrentes?"
  4: ['nice-to-have', 'futuro'],       // "nice-to-have para o futuro?"
  5: ['monetizar', 'como pretende'],   // "Como pretende monetizar o projeto?"
}

/** Strip diacritics so "você" → "voce", "são" → "sao", etc. */
function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Returns true if Claude's response appears to re-ask question `n`.
 * Works regardless of diacritics, bold markdown, or minor rephrasing.
 */
export function claudeReAsked(questionNumber: number, response: string): boolean {
  const keywords = QUESTION_KEYWORDS[questionNumber]
  if (!keywords) return false
  const normalized = stripDiacritics(response.toLowerCase())
  return keywords.every((kw) => normalized.includes(kw.toLowerCase()))
}

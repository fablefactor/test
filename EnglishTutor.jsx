import React, { useState, useEffect, useRef, useCallback } from "react";

/* ============================================================
   PATHWAY TO B1 — Interactive English Tutor
   Levels A1 → A2 → B1 · Lessons · Conversation · Pronunciation
   ============================================================ */

const COLORS = {
  bg: "#F2F5F4",
  card: "#FFFFFF",
  ink: "#1C2B33",
  sub: "#5C6B72",
  teal: "#146C60",
  tealSoft: "#E0EEEB",
  amber: "#F4A93D",
  amberSoft: "#FBEFD9",
  coral: "#E2604C",
  coralSoft: "#FAE4E0",
  green: "#3FA873",
  greenSoft: "#E1F2E9",
  line: "#DDE5E3",
};

const FONT = "'Avenir Next','Segoe UI',system-ui,-apple-system,sans-serif";

/* ---------- UI translations (support languages) ---------- */
const T = {
  en: {
    appName: "Pathway to B1",
    tagline: "Your English journey, one level at a time",
    supportLang: "Help language",
    modes: "Practice modes",
    lessons: "Lessons",
    lessonsDesc: "Learn grammar & words, then take a quiz",
    talk: "Talk with your tutor",
    talkDesc: "A real conversation at your level",
    pron: "Pronunciation",
    pronDesc: "Say sentences, get word-by-word feedback",
    back: "Back",
    pickTopic: "Choose a topic",
    completed: "Done",
    loadingLesson: "Your tutor is writing the lesson…",
    examples: "Examples",
    startQuiz: "Start the quiz",
    check: "Check",
    next: "Next",
    correct: "Correct!",
    wrong: "Not quite.",
    quizDone: "Quiz finished!",
    score: "Score",
    finishLesson: "Finish lesson",
    tryAgain: "Try again",
    listen: "Listen",
    recordSay: "Tap the microphone and say the sentence",
    recording: "Listening… speak now",
    youSaid: "I heard",
    newSentence: "New sentence",
    pronTips: "Tutor tips",
    gettingTips: "Asking your tutor for tips…",
    micUnsupported:
      "Voice input is not available in this browser. Try Chrome, Edge or Safari. You can still use Lessons and type in the chat.",
    micDenied:
      "Microphone access was blocked. Allow microphone permission for this site in your browser settings, then try again.",
    micNoSpeech: "I didn't hear anything — try again, a little louder.",
    micGeneric: "The microphone ran into a problem",
    typeMessage: "Type in English…",
    send: "Send",
    speakBtn: "Speak",
    tutorThinking: "Tutor is typing…",
    readAloud: "Read replies aloud",
    xp: "XP",
    levelLabel: "Your level",
    apiError: "Something went wrong reaching your tutor. Tap to retry.",
    matchScore: "Match",
    perfect: "Excellent! Very clear.",
    good: "Good! A few words to polish.",
    keepGoing: "Keep practising — try slowly.",
    chatHint: "Speak or type. Your tutor corrects mistakes gently.",
  },
  da: {
    appName: "Pathway to B1",
    tagline: "Din engelsk-rejse, ét niveau ad gangen",
    supportLang: "Hjælpesprog",
    modes: "Øvelsesformer",
    lessons: "Lektioner",
    lessonsDesc: "Lær grammatik & ord, og tag en quiz",
    talk: "Tal med din tutor",
    talkDesc: "En rigtig samtale på dit niveau",
    pron: "Udtale",
    pronDesc: "Sig sætninger og få feedback ord for ord",
    back: "Tilbage",
    pickTopic: "Vælg et emne",
    completed: "Færdig",
    loadingLesson: "Din tutor skriver lektionen…",
    examples: "Eksempler",
    startQuiz: "Start quizzen",
    check: "Tjek",
    next: "Næste",
    correct: "Rigtigt!",
    wrong: "Ikke helt.",
    quizDone: "Quiz færdig!",
    score: "Resultat",
    finishLesson: "Afslut lektion",
    tryAgain: "Prøv igen",
    listen: "Lyt",
    recordSay: "Tryk på mikrofonen og sig sætningen",
    recording: "Lytter… tal nu",
    youSaid: "Jeg hørte",
    newSentence: "Ny sætning",
    pronTips: "Tutorens tips",
    gettingTips: "Spørger din tutor om tips…",
    micUnsupported:
      "Stemmeinput virker ikke i denne browser. Prøv Chrome, Edge eller Safari. Du kan stadig bruge lektioner og skrive i chatten.",
    micDenied:
      "Mikrofonadgang blev blokeret. Giv mikrofon-tilladelse til siden i browserens indstillinger og prøv igen.",
    micNoSpeech: "Jeg hørte ikke noget — prøv igen, lidt højere.",
    micGeneric: "Mikrofonen stødte på et problem",
    typeMessage: "Skriv på engelsk…",
    send: "Send",
    speakBtn: "Tal",
    tutorThinking: "Tutoren skriver…",
    readAloud: "Læs svar højt",
    xp: "XP",
    levelLabel: "Dit niveau",
    apiError: "Noget gik galt. Tryk for at prøve igen.",
    matchScore: "Match",
    perfect: "Fremragende! Meget tydeligt.",
    good: "Godt! Et par ord at pudse af.",
    keepGoing: "Bliv ved — prøv langsomt.",
    chatHint: "Tal eller skriv. Din tutor retter fejl på en venlig måde.",
  },
  es: {
    appName: "Pathway to B1",
    tagline: "Tu camino en inglés, nivel por nivel",
    supportLang: "Idioma de apoyo",
    modes: "Modos de práctica",
    lessons: "Lecciones",
    lessonsDesc: "Aprende gramática y palabras, luego haz un quiz",
    talk: "Habla con tu tutor",
    talkDesc: "Una conversación real a tu nivel",
    pron: "Pronunciación",
    pronDesc: "Di frases y recibe feedback palabra por palabra",
    back: "Atrás",
    pickTopic: "Elige un tema",
    completed: "Hecho",
    loadingLesson: "Tu tutor está escribiendo la lección…",
    examples: "Ejemplos",
    startQuiz: "Empezar el quiz",
    check: "Comprobar",
    next: "Siguiente",
    correct: "¡Correcto!",
    wrong: "No exactamente.",
    quizDone: "¡Quiz terminado!",
    score: "Resultado",
    finishLesson: "Terminar lección",
    tryAgain: "Intentar de nuevo",
    listen: "Escuchar",
    recordSay: "Toca el micrófono y di la frase",
    recording: "Escuchando… habla ahora",
    youSaid: "Escuché",
    newSentence: "Nueva frase",
    pronTips: "Consejos del tutor",
    gettingTips: "Pidiendo consejos a tu tutor…",
    micUnsupported:
      "La entrada de voz no funciona en este navegador. Prueba Chrome, Edge o Safari. Aún puedes usar las lecciones y escribir en el chat.",
    micDenied:
      "El acceso al micrófono fue bloqueado. Permite el micrófono para este sitio en los ajustes del navegador e inténtalo de nuevo.",
    micNoSpeech: "No escuché nada — inténtalo otra vez, un poco más alto.",
    micGeneric: "El micrófono tuvo un problema",
    typeMessage: "Escribe en inglés…",
    send: "Enviar",
    speakBtn: "Hablar",
    tutorThinking: "El tutor está escribiendo…",
    readAloud: "Leer respuestas en voz alta",
    xp: "XP",
    levelLabel: "Tu nivel",
    apiError: "Algo salió mal. Toca para reintentar.",
    matchScore: "Coincidencia",
    perfect: "¡Excelente! Muy claro.",
    good: "¡Bien! Unas palabras por pulir.",
    keepGoing: "Sigue practicando — inténtalo despacio.",
    chatHint: "Habla o escribe. Tu tutor corrige errores con amabilidad.",
  },
};

const LANG_NAMES = { en: "English only", da: "Dansk", es: "Español" };

/* ---------- Curriculum ---------- */
const LEVELS = ["A1", "A2", "B1"];

const TOPICS = {
  A1: [
    { id: "a1-greet", icon: "👋", en: "Greetings & introductions" },
    { id: "a1-num", icon: "🕒", en: "Numbers, days & time" },
    { id: "a1-fam", icon: "👨‍👩‍👧", en: "Family & people" },
    { id: "a1-food", icon: "🍞", en: "Food & drink" },
    { id: "a1-day", icon: "🌅", en: "Daily routines (present simple)" },
    { id: "a1-town", icon: "🏙️", en: "Places in town & prepositions" },
  ],
  A2: [
    { id: "a2-past", icon: "⏪", en: "Talking about the past" },
    { id: "a2-shop", icon: "🛒", en: "Shopping & money" },
    { id: "a2-travel", icon: "🧭", en: "Travel & directions" },
    { id: "a2-health", icon: "🩺", en: "Health & the body" },
    { id: "a2-work", icon: "💼", en: "Work & jobs" },
    { id: "a2-plans", icon: "📅", en: "Making plans (going to / will)" },
  ],
  B1: [
    { id: "b1-opinion", icon: "💬", en: "Giving opinions & agreeing" },
    { id: "b1-story", icon: "📖", en: "Telling stories (narrative tenses)" },
    { id: "b1-if", icon: "🔀", en: "Hypotheticals & conditionals" },
    { id: "b1-news", icon: "📰", en: "News, media & reported speech" },
    { id: "b1-email", icon: "✉️", en: "Emails & formal language" },
    { id: "b1-feel", icon: "🎭", en: "Feelings & experiences" },
  ],
};

const PRON_SENTENCES = {
  A1: [
    "Hello, my name is Anna and I am from Denmark.",
    "I would like a coffee with milk, please.",
    "The supermarket is next to the train station.",
    "She works every day from nine to five.",
    "We have three children and one dog.",
    "What time is it now?",
  ],
  A2: [
    "Yesterday I went to the cinema with my friends.",
    "Could you tell me how to get to the airport?",
    "I have a headache and a sore throat.",
    "We are going to visit my parents next weekend.",
    "How much does this jacket cost?",
    "I worked in a restaurant when I was younger.",
  ],
  B1: [
    "In my opinion, learning a language takes patience and practice.",
    "If I had more time, I would travel around the world.",
    "She told me that the meeting had been cancelled.",
    "I have been living in Copenhagen for three years.",
    "Although it was raining, we decided to walk home.",
    "I am writing to enquire about the position advertised online.",
  ],
};

/* ---------- Helpers ---------- */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return d[m][n];
}

const normalize = (s) =>
  s.toLowerCase().replace(/[^a-z0-9'\s]/g, "").replace(/\s+/g, " ").trim();

/* Compare target sentence to what speech recognition heard.
   Returns per-word status: 'good' | 'close' | 'missed' */
function scorePronunciation(target, heard) {
  const tw = normalize(target).split(" ").filter(Boolean);
  const hw = normalize(heard).split(" ").filter(Boolean);
  const used = new Array(hw.length).fill(false);
  const words = tw.map((w) => {
    let best = -1, bestDist = Infinity;
    hw.forEach((h, i) => {
      if (used[i]) return;
      const dist = levenshtein(w, h);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    const tol = w.length <= 3 ? 0 : w.length <= 6 ? 1 : 2;
    if (best >= 0 && bestDist === 0) { used[best] = true; return { w, s: "good" }; }
    if (best >= 0 && bestDist <= tol) { used[best] = true; return { w, s: "close" }; }
    return { w, s: "missed" };
  });
  const pts = words.reduce((a, x) => a + (x.s === "good" ? 1 : x.s === "close" ? 0.5 : 0), 0);
  return { words, pct: Math.round((pts / tw.length) * 100) };
}

/* ---------- Claude API ---------- */
async function askClaude(messages, maxTokens = 1000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages,
    }),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = (j.error && j.error.message) || JSON.stringify(j);
    } catch (e) {}
    throw new Error("HTTP " + res.status + (detail ? " — " + String(detail).slice(0, 180) : ""));
  }
  const data = await res.json();
  if (data.error) throw new Error(String(data.error.message || "Unknown API error").slice(0, 180));
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function parseJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  return JSON.parse(clean.slice(start, end + 1));
}

const langName = (c) => (c === "da" ? "Danish" : c === "es" ? "Spanish" : "English");

/* ---------- Speech (Web Speech API) ---------- */
const SR =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

function speak(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.92;
    const v = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang && v.lang.startsWith("en"));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

function useListen(onResult) {
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState(null);
  const recRef = useRef(null);
  const start = useCallback(async () => {
    if (!SR) return;
    setMicError(null);
    // Explicitly ask for microphone permission first — this triggers the
    // permission prompt in webviews/browsers where SpeechRecognition alone won't.
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((tr) => tr.stop());
      }
    } catch (e) {
      setMicError("permission");
      return;
    }
    try {
      const rec = new SR();
      recRef.current = rec;
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const t = e.results[0][0].transcript;
        setListening(false);
        onResult(t);
      };
      rec.onerror = (e) => {
        setListening(false);
        const code = (e && e.error) || "unknown";
        if (code === "not-allowed" || code === "service-not-allowed") setMicError("permission");
        else if (code === "no-speech") setMicError("nospeech");
        else if (code === "aborted") setMicError(null);
        else setMicError(code);
      };
      rec.onend = () => setListening(false);
      setListening(true);
      rec.start();
    } catch (e) {
      setListening(false);
      setMicError(String(e && e.message ? e.message : e).slice(0, 120));
    }
  }, [onResult]);
  const stop = useCallback(() => {
    try { recRef.current && recRef.current.stop(); } catch (e) {}
    setListening(false);
  }, []);
  return { listening, start, stop, supported: !!SR, micError };
}

function micErrorText(t, micError) {
  if (!micError) return null;
  if (micError === "permission") return t.micDenied;
  if (micError === "nospeech") return t.micNoSpeech;
  return t.micGeneric + " (" + micError + ")";
}

/* ============================================================
   Shared UI
   ============================================================ */
const S = {
  page: {
    minHeight: "100vh", background: COLORS.bg, color: COLORS.ink,
    fontFamily: FONT, display: "flex", justifyContent: "center",
  },
  shell: { width: "100%", maxWidth: 560, padding: "20px 16px 48px" },
  card: {
    background: COLORS.card, borderRadius: 18, padding: 18,
    boxShadow: "0 1px 3px rgba(28,43,51,0.08)", border: `1px solid ${COLORS.line}`,
  },
  btn: (bg, color = "#fff") => ({
    background: bg, color, border: "none", borderRadius: 12,
    padding: "12px 18px", fontSize: 16, fontWeight: 700, cursor: "pointer",
    fontFamily: FONT,
  }),
  ghostBtn: {
    background: "transparent", color: COLORS.teal, border: `1.5px solid ${COLORS.teal}`,
    borderRadius: 12, padding: "10px 16px", fontSize: 15, fontWeight: 700,
    cursor: "pointer", fontFamily: FONT,
  },
};

function BackBar({ t, title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <button onClick={onBack} aria-label={t.back}
        style={{ ...S.ghostBtn, padding: "8px 14px" }}>← {t.back}</button>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{title}</h2>
    </div>
  );
}

/* Signature element: the level pathway */
function LevelPath({ level, setLevel, progress, t }) {
  return (
    <div style={{ ...S.card, padding: "20px 18px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: COLORS.sub, textTransform: "uppercase", marginBottom: 14 }}>
        {t.levelLabel}
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        {LEVELS.map((lv, i) => {
          const done = (progress.completedTopics || []).filter((id) => id.startsWith(lv.toLowerCase())).length;
          const total = TOPICS[lv].length;
          const active = level === lv;
          return (
            <React.Fragment key={lv}>
              {i > 0 && (
                <div style={{ flex: 1, borderTop: `3px dotted ${COLORS.line}`, margin: "0 6px", transform: "translateY(-12px)" }} />
              )}
              <button onClick={() => setLevel(lv)}
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontFamily: FONT,
                }}>
                <div style={{
                  width: 58, height: 58, borderRadius: "50%",
                  background: active ? COLORS.teal : COLORS.tealSoft,
                  color: active ? "#fff" : COLORS.teal,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 18,
                  border: active ? `3px solid ${COLORS.amber}` : `3px solid transparent`,
                  transition: "all .2s",
                }}>{lv}</div>
                <div style={{ fontSize: 12, color: COLORS.sub, fontWeight: 600 }}>{done}/{total}</div>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function MicButton({ listening, onClick, disabled, label }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label}
      style={{
        width: 72, height: 72, borderRadius: "50%", border: "none", cursor: disabled ? "default" : "pointer",
        background: listening ? COLORS.coral : COLORS.teal, color: "#fff", fontSize: 30,
        boxShadow: listening ? `0 0 0 10px ${COLORS.coralSoft}` : "0 2px 6px rgba(0,0,0,0.15)",
        transition: "all .2s", opacity: disabled ? 0.4 : 1,
      }}>
      {listening ? "■" : "🎤"}
    </button>
  );
}

/* ============================================================
   Lessons
   ============================================================ */
function LessonScreen({ t, lang, level, progress, addXP, completeTopic, onBack }) {
  const [topic, setTopic] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [phase, setPhase] = useState("read"); // read | quiz | done
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState(null);
  const [checked, setChecked] = useState(false);
  const [right, setRight] = useState(0);

  const loadLesson = async (tp) => {
    setTopic(tp); setLesson(null); setLoading(true); setError(false);
    setPhase("read"); setQi(0); setPicked(null); setChecked(false); setRight(0);
    const support =
      lang === "en"
        ? "Write the short explanation in very simple English."
        : `Write the short explanation in ${langName(lang)} so the student fully understands, but all examples and exercises in English.`;
    try {
      const text = await askClaude([
        {
          role: "user",
          content:
            `You are an expert English teacher. Create a mini-lesson for a CEFR ${level} student on the topic: "${tp.en}".\n` +
            support + "\n" +
            `Respond ONLY with valid JSON, no markdown fences, no extra text, in exactly this shape:\n` +
            `{"title":"...","intro":"2-4 sentence explanation of the key grammar/vocabulary point",` +
            `"examples":[{"en":"English example sentence","note":"short translation or note in ${langName(lang)}"}] (4 examples),` +
            `"exercises":[{"q":"question or fill-the-gap sentence in English","options":["...","...","...","..."],"correct":0,"explain":"one short sentence in ${langName(lang)} explaining why"}] (5 exercises)}\n` +
            `Difficulty must genuinely match CEFR ${level}. Keep everything concise.`,
        },
      ], 1800);
      setLesson(parseJSON(text));
    } catch (e) {
      setError(String(e && e.message ? e.message : e));
    }
    setLoading(false);
  };

  if (!topic) {
    return (
      <div>
        <BackBar t={t} title={`${t.lessons} · ${level}`} onBack={onBack} />
        <div style={{ fontWeight: 700, color: COLORS.sub, marginBottom: 10 }}>{t.pickTopic}</div>
        <div style={{ display: "grid", gap: 10 }}>
          {TOPICS[level].map((tp) => {
            const done = (progress.completedTopics || []).includes(tp.id);
            return (
              <button key={tp.id} onClick={() => loadLesson(tp)}
                style={{ ...S.card, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left", fontFamily: FONT, fontSize: 16 }}>
                <span style={{ fontSize: 26 }}>{tp.icon}</span>
                <span style={{ flex: 1, fontWeight: 700 }}>{tp.en}</span>
                {done && (
                  <span style={{ background: COLORS.greenSoft, color: COLORS.green, fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 99 }}>
                    ✓ {t.completed}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div>
        <BackBar t={t} title={topic.en} onBack={() => setTopic(null)} />
        <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✏️</div>
          <div style={{ color: COLORS.sub, fontWeight: 600 }}>{t.loadingLesson}</div>
        </div>
      </div>
    );

  if (error)
    return (
      <div>
        <BackBar t={t} title={topic.en} onBack={() => setTopic(null)} />
        <button onClick={() => loadLesson(topic)} style={{ ...S.card, width: "100%", color: COLORS.coral, fontWeight: 700, cursor: "pointer", fontFamily: FONT, fontSize: 15 }}>
          ⚠️ {t.apiError}
          {typeof error === "string" && (
            <div style={{ fontSize: 12, color: COLORS.sub, fontWeight: 500, marginTop: 6, wordBreak: "break-word" }}>{error}</div>
          )}
        </button>
      </div>
    );

  if (phase === "read")
    return (
      <div>
        <BackBar t={t} title={lesson.title} onBack={() => setTopic(null)} />
        <div style={{ ...S.card, marginBottom: 12 }}>
          <p style={{ margin: 0, lineHeight: 1.6, fontSize: 16 }}>{lesson.intro}</p>
        </div>
        <div style={{ fontWeight: 800, margin: "16px 0 8px", color: COLORS.teal }}>{t.examples}</div>
        <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
          {lesson.examples.map((ex, i) => (
            <div key={i} style={{ ...S.card, padding: 14, display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={() => speak(ex.en)} aria-label={t.listen}
                style={{ background: COLORS.tealSoft, border: "none", borderRadius: 10, width: 38, height: 38, cursor: "pointer", fontSize: 16 }}>🔊</button>
              <div>
                <div style={{ fontWeight: 700 }}>{ex.en}</div>
                {ex.note && <div style={{ fontSize: 13, color: COLORS.sub }}>{ex.note}</div>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setPhase("quiz")} style={{ ...S.btn(COLORS.teal), width: "100%" }}>
          {t.startQuiz} →
        </button>
      </div>
    );

  if (phase === "quiz") {
    const ex = lesson.exercises[qi];
    const isRight = picked === ex.correct;
    return (
      <div>
        <BackBar t={t} title={`${qi + 1} / ${lesson.exercises.length}`} onBack={() => setPhase("read")} />
        <div style={{ ...S.card, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.5 }}>{ex.q}</div>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {ex.options.map((op, i) => {
            let bg = COLORS.card, border = COLORS.line;
            if (checked && i === ex.correct) { bg = COLORS.greenSoft; border = COLORS.green; }
            else if (checked && i === picked && !isRight) { bg = COLORS.coralSoft; border = COLORS.coral; }
            else if (!checked && i === picked) { bg = COLORS.tealSoft; border = COLORS.teal; }
            return (
              <button key={i} disabled={checked} onClick={() => setPicked(i)}
                style={{ background: bg, border: `2px solid ${border}`, borderRadius: 12, padding: "12px 14px", textAlign: "left", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
                {op}
              </button>
            );
          })}
        </div>
        {checked && (
          <div style={{ ...S.card, marginTop: 12, background: isRight ? COLORS.greenSoft : COLORS.coralSoft, border: "none" }}>
            <div style={{ fontWeight: 800, color: isRight ? COLORS.green : COLORS.coral }}>
              {isRight ? t.correct : t.wrong}
            </div>
            <div style={{ fontSize: 14, marginTop: 4 }}>{ex.explain}</div>
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          {!checked ? (
            <button disabled={picked == null}
              onClick={() => { setChecked(true); if (picked === ex.correct) setRight(right + 1); }}
              style={{ ...S.btn(picked == null ? COLORS.line : COLORS.teal), width: "100%" }}>
              {t.check}
            </button>
          ) : (
            <button onClick={() => {
                if (qi + 1 < lesson.exercises.length) { setQi(qi + 1); setPicked(null); setChecked(false); }
                else setPhase("done");
              }}
              style={{ ...S.btn(COLORS.teal), width: "100%" }}>
              {t.next} →
            </button>
          )}
        </div>
      </div>
    );
  }

  // done
  const total = lesson.exercises.length;
  const passed = right >= Math.ceil(total * 0.6);
  return (
    <div>
      <BackBar t={t} title={t.quizDone} onBack={() => setTopic(null)} />
      <div style={{ ...S.card, textAlign: "center", padding: 36 }}>
        <div style={{ fontSize: 48 }}>{passed ? "🎉" : "💪"}</div>
        <div style={{ fontSize: 22, fontWeight: 800, margin: "10px 0" }}>
          {t.score}: {right} / {total}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
          {passed ? (
            <button onClick={() => { completeTopic(topic.id); addXP(right * 10); setTopic(null); }}
              style={S.btn(COLORS.teal)}>
              {t.finishLesson} (+{right * 10} {t.xp})
            </button>
          ) : (
            <button onClick={() => loadLesson(topic)} style={S.btn(COLORS.amber, COLORS.ink)}>
              {t.tryAgain}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Conversation with the tutor
   ============================================================ */
function ChatScreen({ t, lang, level, addXP, onBack }) {
  const [msgs, setMsgs] = useState([]); // {role:'user'|'assistant', text}
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [voiceOut, setVoiceOut] = useState(true);
  const voiceOutRef = useRef(true);
  voiceOutRef.current = voiceOut;
  const bottomRef = useRef(null);
  const startedRef = useRef(false);

  const preamble =
    `You are a warm, patient English tutor. Your student is at CEFR level ${level} and wants to reach B1. ` +
    `Have a natural spoken-style conversation pitched exactly at ${level}. Keep replies short (max 60 words). ` +
    `If the student makes a mistake, briefly show the corrected sentence with a ✏️ before continuing. ` +
    (lang !== "en"
      ? `If the student seems confused, you may add one short clarification in ${langName(lang)} in parentheses. `
      : "") +
    `Always end with one simple question to keep the conversation going. Vary topics: daily life, travel, food, work, opinions.`;

  const buildApiMessages = (history) => [
    { role: "user", content: preamble + "\n\nStart by greeting me and asking an easy question." },
    ...history.map((m) => ({ role: m.role, content: m.text })),
  ];

  const callTutor = async (history) => {
    setBusy(true); setError(false);
    try {
      const reply = await askClaude(buildApiMessages(history), 400);
      setMsgs([...history, { role: "assistant", text: reply }]);
      if (voiceOutRef.current) speak(reply.replace(/✏️/g, ""));
      addXP(2);
    } catch (e) {
      setError(String(e && e.message ? e.message : e));
    }
    setBusy(false);
  };

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      callTutor([]);
    }
    return () => { try { window.speechSynthesis.cancel(); } catch (e) {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current && bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  const sendText = (text) => {
    const v = text.trim();
    if (!v || busy) return;
    const history = [...msgs, { role: "user", text: v }];
    setMsgs(history);
    setInput("");
    callTutor(history);
  };

  const { listening, start, stop, supported, micError } = useListen((heard) => sendText(heard));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 40px)", maxHeight: 760 }}>
      <BackBar t={t} title={`${t.talk} · ${level}`} onBack={onBack} />
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: COLORS.sub, marginBottom: 8, fontWeight: 600 }}>
        <input type="checkbox" checked={voiceOut} onChange={(e) => setVoiceOut(e.target.checked)} />
        🔊 {t.readAloud}
      </label>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "4px 2px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "82%",
            background: m.role === "user" ? COLORS.teal : COLORS.card,
            color: m.role === "user" ? "#fff" : COLORS.ink,
            borderRadius: 16,
            borderBottomRightRadius: m.role === "user" ? 4 : 16,
            borderBottomLeftRadius: m.role === "user" ? 16 : 4,
            padding: "10px 14px", fontSize: 15.5, lineHeight: 1.5,
            border: m.role === "user" ? "none" : `1px solid ${COLORS.line}`,
            whiteSpace: "pre-wrap",
          }}>
            {m.text}
            {m.role === "assistant" && (
              <button onClick={() => speak(m.text.replace(/✏️/g, ""))} aria-label={t.listen}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, marginLeft: 6 }}>🔊</button>
            )}
          </div>
        ))}
        {busy && <div style={{ color: COLORS.sub, fontSize: 14, fontStyle: "italic" }}>{t.tutorThinking}</div>}
        {error && (
          <div>
            <button onClick={() => callTutor(msgs)} style={{ ...S.ghostBtn, color: COLORS.coral, borderColor: COLORS.coral }}>
              ⚠️ {t.apiError}
            </button>
            <div style={{ fontSize: 12, color: COLORS.sub, marginTop: 4, wordBreak: "break-word" }}>{error}</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ fontSize: 12, color: COLORS.sub, margin: "6px 0", textAlign: "center" }}>{t.chatHint}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendText(input)}
          placeholder={t.typeMessage}
          style={{ flex: 1, borderRadius: 12, border: `1.5px solid ${COLORS.line}`, padding: "12px 14px", fontSize: 16, fontFamily: FONT, outline: "none", background: COLORS.card }}
        />
        <button onClick={() => sendText(input)} style={S.btn(COLORS.teal)}>{t.send}</button>
        {supported && (
          <button onClick={listening ? stop : start} aria-label={t.speakBtn}
            style={{
              width: 48, height: 48, borderRadius: "50%", border: "none", cursor: "pointer",
              background: listening ? COLORS.coral : COLORS.tealSoft, fontSize: 20,
              boxShadow: listening ? `0 0 0 6px ${COLORS.coralSoft}` : "none", transition: "all .2s",
            }}>
            {listening ? "■" : "🎤"}
          </button>
        )}
      </div>
      {!supported && (
        <div style={{ fontSize: 12, color: COLORS.sub, marginTop: 6 }}>{t.micUnsupported}</div>
      )}
      {micError && (
        <div style={{ fontSize: 12, color: COLORS.coral, marginTop: 6, fontWeight: 600 }}>
          {micErrorText(t, micError)}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Pronunciation practice
   ============================================================ */
function PronScreen({ t, lang, level, addXP, onBack }) {
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState(null); // {words, pct, heard}
  const [tips, setTips] = useState(null);
  const [tipsBusy, setTipsBusy] = useState(false);
  const sentences = PRON_SENTENCES[level];
  const target = sentences[idx % sentences.length];

  const { listening, start, stop, supported, micError } = useListen((heard) => {
    const r = scorePronunciation(target, heard);
    setResult({ ...r, heard });
    addXP(Math.round(r.pct / 10));
    fetchTips(heard, r);
  });

  const fetchTips = async (heard, r) => {
    setTips(null); setTipsBusy(true);
    const missed = r.words.filter((w) => w.s !== "good").map((w) => w.w);
    try {
      const text = await askClaude([
        {
          role: "user",
          content:
            `You are an English pronunciation coach. A CEFR ${level} student read this sentence aloud:\n"${target}"\n` +
            `A speech recognizer transcribed their speech as:\n"${heard}"\n` +
            `Words that did not match: ${missed.length ? missed.join(", ") : "none — it matched well"}.\n` +
            `Based on the differences, give at most 3 short, practical pronunciation tips (likely sounds to fix, mouth position, stress). ` +
            `Note: the transcript is from speech recognition, so be encouraging and don't over-claim. ` +
            (lang !== "en" ? `Write the tips in ${langName(lang)}.` : `Use very simple English.`) +
            ` Maximum 70 words total. No preamble.`,
        },
      ], 400);
      setTips(text);
    } catch (e) {
      setTips(null);
    }
    setTipsBusy(false);
  };

  const next = () => {
    setIdx(idx + 1); setResult(null); setTips(null);
    try { window.speechSynthesis.cancel(); } catch (e) {}
  };

  const wordColor = (s) =>
    s === "good"
      ? { background: COLORS.greenSoft, color: COLORS.green }
      : s === "close"
      ? { background: COLORS.amberSoft, color: "#9A6B12" }
      : { background: COLORS.coralSoft, color: COLORS.coral };

  return (
    <div>
      <BackBar t={t} title={`${t.pron} · ${level}`} onBack={onBack} />
      {!supported && (
        <div style={{ ...S.card, background: COLORS.amberSoft, border: "none", marginBottom: 12, fontSize: 14 }}>
          ⚠️ {t.micUnsupported}
        </div>
      )}
      <div style={{ ...S.card, textAlign: "center", padding: 26 }}>
        <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.5, marginBottom: 14 }}>
          "{target}"
        </div>
        <button onClick={() => speak(target)} style={{ ...S.ghostBtn, marginBottom: 20 }}>
          🔊 {t.listen}
        </button>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <MicButton listening={listening} disabled={!supported}
            onClick={listening ? stop : start} label={t.speakBtn} />
          <div style={{ fontSize: 13, color: listening ? COLORS.coral : COLORS.sub, fontWeight: 600 }}>
            {listening ? t.recording : t.recordSay}
          </div>
          {micError && (
            <div style={{ fontSize: 12.5, color: COLORS.coral, fontWeight: 600, maxWidth: 320 }}>
              {micErrorText(t, micError)}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div style={{ ...S.card, marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 800 }}>
              {t.matchScore}: <span style={{ color: result.pct >= 85 ? COLORS.green : result.pct >= 60 ? "#9A6B12" : COLORS.coral }}>{result.pct}%</span>
            </div>
            <div style={{ fontSize: 13, color: COLORS.sub, fontWeight: 600 }}>
              {result.pct >= 85 ? t.perfect : result.pct >= 60 ? t.good : t.keepGoing}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {result.words.map((w, i) => (
              <span key={i} style={{ ...wordColor(w.s), padding: "4px 10px", borderRadius: 99, fontWeight: 700, fontSize: 14 }}>
                {w.w}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 13, color: COLORS.sub }}>
            {t.youSaid}: "{result.heard}"
          </div>
          <div style={{ marginTop: 12, borderTop: `1px solid ${COLORS.line}`, paddingTop: 12 }}>
            <div style={{ fontWeight: 800, color: COLORS.teal, marginBottom: 6 }}>💡 {t.pronTips}</div>
            {tipsBusy && <div style={{ fontSize: 14, color: COLORS.sub, fontStyle: "italic" }}>{t.gettingTips}</div>}
            {tips && <div style={{ fontSize: 14.5, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{tips}</div>}
          </div>
          <button onClick={next} style={{ ...S.btn(COLORS.teal), width: "100%", marginTop: 14 }}>
            {t.newSentence} →
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Main App
   ============================================================ */
export default function EnglishTutor() {
  const [screen, setScreen] = useState("home");
  const [level, setLevel] = useState("A1");
  const [lang, setLang] = useState("da");
  const [progress, setProgress] = useState({ completedTopics: [], xp: 0 });
  const loadedRef = useRef(false);

  const t = T[lang];

  // Load saved progress
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("english-tutor:state");
        if (r && r.value) {
          const s = JSON.parse(r.value);
          if (s.progress) setProgress(s.progress);
          if (s.level) setLevel(s.level);
          if (s.lang) setLang(s.lang);
        }
      } catch (e) { /* first visit */ }
      loadedRef.current = true;
    })();
  }, []);

  // Save on change
  useEffect(() => {
    if (!loadedRef.current) return;
    (async () => {
      try {
        await window.storage.set("english-tutor:state", JSON.stringify({ progress, level, lang }));
      } catch (e) {}
    })();
  }, [progress, level, lang]);

  const addXP = (n) => setProgress((p) => ({ ...p, xp: (p.xp || 0) + n }));
  const completeTopic = (id) =>
    setProgress((p) => ({
      ...p,
      completedTopics: p.completedTopics.includes(id) ? p.completedTopics : [...p.completedTopics, id],
    }));

  const modes = [
    { id: "lessons", icon: "📚", title: t.lessons, desc: t.lessonsDesc },
    { id: "chat", icon: "🗣️", title: t.talk, desc: t.talkDesc },
    { id: "pron", icon: "🎤", title: t.pron, desc: t.pronDesc },
  ];

  return (
    <div style={S.page}>
      <div style={S.shell}>
        {screen === "home" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.5, color: COLORS.teal }}>
                  {t.appName}
                </h1>
                <div style={{ color: COLORS.sub, fontSize: 14, marginTop: 2 }}>{t.tagline}</div>
              </div>
              <div style={{ background: COLORS.amberSoft, color: "#9A6B12", fontWeight: 800, borderRadius: 99, padding: "6px 12px", fontSize: 14, whiteSpace: "nowrap" }}>
                ⭐ {progress.xp || 0} {t.xp}
              </div>
            </div>

            <div style={{ margin: "16px 0" }}>
              <LevelPath level={level} setLevel={setLevel} progress={progress} t={t} />
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: COLORS.sub, textTransform: "uppercase", margin: "18px 0 8px" }}>
              {t.modes}
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {modes.map((m) => (
                <button key={m.id} onClick={() => setScreen(m.id)}
                  style={{ ...S.card, display: "flex", gap: 14, alignItems: "center", cursor: "pointer", textAlign: "left", fontFamily: FONT }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: COLORS.tealSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                    {m.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{m.title}</div>
                    <div style={{ fontSize: 13.5, color: COLORS.sub }}>{m.desc}</div>
                  </div>
                  <div style={{ marginLeft: "auto", color: COLORS.teal, fontWeight: 800, fontSize: 20 }}>›</div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: COLORS.sub, textTransform: "uppercase", marginBottom: 8 }}>
                {t.supportLang}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {Object.keys(LANG_NAMES).map((c) => (
                  <button key={c} onClick={() => setLang(c)}
                    style={{
                      ...S.ghostBtn,
                      background: lang === c ? COLORS.teal : "transparent",
                      color: lang === c ? "#fff" : COLORS.teal,
                      borderColor: COLORS.teal, fontSize: 14, padding: "8px 14px",
                    }}>
                    {LANG_NAMES[c]}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {screen === "lessons" && (
          <LessonScreen t={t} lang={lang} level={level} progress={progress}
            addXP={addXP} completeTopic={completeTopic} onBack={() => setScreen("home")} />
        )}
        {screen === "chat" && (
          <ChatScreen t={t} lang={lang} level={level} addXP={addXP} onBack={() => setScreen("home")} />
        )}
        {screen === "pron" && (
          <PronScreen t={t} lang={lang} level={level} addXP={addXP} onBack={() => setScreen("home")} />
        )}
      </div>
    </div>
  );
}

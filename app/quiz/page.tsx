"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/api";

interface Question {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: string;
  explanation: string;
}

interface QuizData {
  memory_title: string;
  questions: Question[];
  total: number;
}

const IMPORTANCE_CONFIG = {
  high: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", label: "Must Know" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", label: "Good to Know" },
  low: { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", label: "Nice to Have" },
};

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const memoryId = searchParams.get("id");

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    if (!memoryId) { router.push("/dashboard"); return; }
    fetchQuiz();
  }, []);

  const fetchQuiz = async () => {
    try {
      const res = await api.post(`/memories/${memoryId}/quiz`);
      setQuiz(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (option: string) => {
    if (revealed) return;
    setSelected(option);
    setRevealed(true);
    if (quiz && option === quiz.questions[current].correct) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (!quiz) return;
    if (current + 1 >= quiz.questions.length) {
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const glass = {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
  };

  const q = quiz?.questions[current];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #0A1224, #0d1530)", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: "240px", flex: 1, padding: "28px", width: "calc(100% - 240px)", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>

          <div style={{ marginBottom: "24px" }}>
            <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "13px", padding: 0, marginBottom: "12px" }}>
              ← Back
            </button>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#F8FAFC" }}>🧠 AI Quiz</h2>
            {quiz && <p style={{ color: "#475569", fontSize: "13px" }}>{quiz.memory_title}</p>}
          </div>

          {loading ? (
            <div style={{ ...glass, padding: "60px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚡</div>
              <p style={{ color: "#475569" }}>Generating quiz from your memory...</p>
            </div>
          ) : !quiz ? (
            <div style={{ ...glass, padding: "60px", textAlign: "center" }}>
              <p style={{ color: "#ef4444" }}>Failed to generate quiz. Try again.</p>
            </div>
          ) : finished ? (
            <div style={{ ...glass, padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "52px", marginBottom: "16px" }}>
                {score === quiz.total ? "🏆" : score >= quiz.total * 0.7 ? "🎉" : "📚"}
              </div>
              <h3 style={{ color: "#F8FAFC", fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Quiz Complete!</h3>
              <p style={{ color: "#60A5FA", fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>{score} / {quiz.total}</p>
              <p style={{ color: "#475569", fontSize: "14px", marginBottom: "24px" }}>
                {score === quiz.total ? "Perfect score! You know this topic well."
                  : score >= quiz.total * 0.7 ? "Good job! Review the ones you missed."
                  : "Keep studying — review this memory again."}
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button
                  onClick={() => { setCurrent(0); setSelected(null); setRevealed(false); setScore(0); setFinished(false); }}
                  style={{ background: "linear-gradient(135deg, #2563EB, #1d4ed8)", border: "none", borderRadius: "12px", padding: "12px 24px", color: "white", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                >
                  Retry Quiz
                </button>
                <button
                  onClick={() => router.back()}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 24px", color: "#94A3B8", fontSize: "14px", cursor: "pointer" }}
                >
                  Back
                </button>
              </div>
            </div>
          ) : q ? (
            <>
              {/* Progress bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ color: "#475569", fontSize: "13px" }}>Question {current + 1} of {quiz.total}</span>
                <span style={{ color: "#60A5FA", fontSize: "13px", fontWeight: 600 }}>Score: {score}</span>
              </div>
              <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", marginBottom: "24px" }}>
                <div style={{
                  height: "100%",
                  width: `${((current + 1) / quiz.total) * 100}%`,
                  background: "linear-gradient(90deg, #2563EB, #60A5FA)",
                  borderRadius: "999px", transition: "width 0.3s",
                }} />
              </div>

              {/* Question */}
              <div style={{ ...glass, padding: "24px", marginBottom: "16px" }}>
                <p style={{ color: "#F8FAFC", fontSize: "16px", lineHeight: 1.6, margin: 0 }}>{q.question}</p>
              </div>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {Object.entries(q.options).map(([key, value]) => {
                  const isCorrect = key === q.correct;
                  const isSelected = key === selected;
                  let bg = "rgba(255,255,255,0.04)";
                  let border = "rgba(255,255,255,0.08)";
                  let color = "#94A3B8";

                  if (revealed) {
                    if (isCorrect) { bg = "rgba(16,185,129,0.12)"; border = "rgba(16,185,129,0.4)"; color = "#10b981"; }
                    else if (isSelected) { bg = "rgba(239,68,68,0.1)"; border = "rgba(239,68,68,0.3)"; color = "#ef4444"; }
                  } else if (isSelected) {
                    bg = "rgba(37,99,235,0.15)"; border = "rgba(37,99,235,0.4)"; color = "#60A5FA";
                  }

                  return (
                    <button key={key} onClick={() => handleAnswer(key)} disabled={revealed} style={{
                      background: bg, border: `1px solid ${border}`,
                      borderRadius: "12px", padding: "14px 18px",
                      display: "flex", gap: "12px", alignItems: "center",
                      cursor: revealed ? "default" : "pointer",
                      transition: "all 0.2s", textAlign: "left", width: "100%",
                    }}>
                      <span style={{
                        width: "28px", height: "28px", borderRadius: "50%",
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid ${border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", fontWeight: 700, color, flexShrink: 0,
                      }}>{key}</span>
                      <span style={{ color, fontSize: "14px" }}>{value}</span>
                      {revealed && isCorrect && <span style={{ marginLeft: "auto", color: "#10b981", fontSize: "16px" }}>✓</span>}
                      {revealed && isSelected && !isCorrect && <span style={{ marginLeft: "auto", color: "#ef4444", fontSize: "16px" }}>✗</span>}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {revealed && (
                <div style={{ ...glass, padding: "16px", background: "rgba(37,99,235,0.06)", borderColor: "rgba(37,99,235,0.2)", marginBottom: "16px" }}>
                  <p style={{ color: "#60A5FA", fontSize: "11px", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>💡 Explanation</p>
                  <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>{q.explanation}</p>
                </div>
              )}

              {revealed && (
                <button onClick={handleNext} style={{
                  width: "100%", background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
                  border: "none", borderRadius: "12px", padding: "14px",
                  color: "white", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                  boxShadow: "0 0 20px rgba(37,99,235,0.3)",
                }}>
                  {current + 1 >= quiz.total ? "See Results →" : "Next Question →"}
                </button>
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", minHeight: "100vh", background: "#0A1224", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#475569", fontSize: "14px" }}>Loading quiz...</p>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
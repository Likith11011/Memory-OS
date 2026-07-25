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
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    if (!memoryId) { router.push("/exam"); return; }
    fetchQuiz();
  }, []);

  const fetchQuiz = async () => {
    try {
      setError("");
      const res = await api.post(`/memories/${memoryId}/quiz`);
      setQuiz(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate quiz. Make sure this memory has enough content.");
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
      <main style={{ marginLeft: "240px", flex: 1, padding: "28px", width: "calc(100% - 240px)", boxSizing: "border-box", overflowX: "hidden" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>

          {/* Back button + header */}
          <div style={{ marginBottom: "24px" }}>
            <button
              onClick={() => router.back()}
              style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "13px", padding: 0, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}
            >
              ← Back to Exam
            </button>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#F8FAFC", marginBottom: "4px" }}>
              🧠 AI Quiz
            </h2>
            {quiz && (
              <p style={{ color: "#475569", fontSize: "13px" }}>
                Based on: <span style={{ color: "#60A5FA" }}>{quiz.memory_title}</span>
              </p>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ ...glass, padding: "60px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", marginBottom: "16px" }}>⚡</div>
              <p style={{ color: "#60A5FA", fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>
                Generating your quiz...
              </p>
              <p style={{ color: "#475569", fontSize: "13px" }}>
                AI is reading your memory and creating questions
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ ...glass, padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", marginBottom: "16px" }}>❌</div>
              <p style={{ color: "#f87171", fontSize: "15px", marginBottom: "20px" }}>{error}</p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button
                  onClick={() => { setError(""); setLoading(true); fetchQuiz(); }}
                  style={{
                    background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
                    border: "none", borderRadius: "10px", padding: "10px 22px",
                    color: "white", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.back()}
                  style={{
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px", padding: "10px 22px",
                    color: "#94A3B8", fontSize: "14px", cursor: "pointer",
                  }}
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {/* Finished screen */}
          {!loading && !error && finished && quiz && (
            <div style={{ ...glass, padding: "48px 40px", textAlign: "center" }}>
              <div style={{ fontSize: "56px", marginBottom: "20px" }}>
                {score === quiz.total ? "🏆" : score >= quiz.total * 0.7 ? "🎉" : score >= quiz.total * 0.5 ? "📚" : "💪"}
              </div>
              <h3 style={{ color: "#F8FAFC", fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>
                Quiz Complete!
              </h3>
              <div style={{
                display: "flex", alignItems: "baseline", gap: "8px",
                justifyContent: "center", marginBottom: "12px",
              }}>
                <span style={{ color: "#60A5FA", fontSize: "48px", fontWeight: 800 }}>{score}</span>
                <span style={{ color: "#334155", fontSize: "24px" }}>/ {quiz.total}</span>
              </div>
              <p style={{ color: "#475569", fontSize: "14px", marginBottom: "8px" }}>
                {Math.round((score / quiz.total) * 100)}% correct
              </p>
              <p style={{
                color: score === quiz.total ? "#10b981"
                  : score >= quiz.total * 0.7 ? "#60A5FA"
                  : "#f59e0b",
                fontSize: "15px", fontWeight: 500, marginBottom: "32px",
              }}>
                {score === quiz.total
                  ? "Perfect score! You have mastered this topic."
                  : score >= quiz.total * 0.7
                  ? "Great job! A little more review and you will nail it."
                  : score >= quiz.total * 0.5
                  ? "Good effort. Review this memory a few more times."
                  : "Keep studying. Read the memory again then retry."}
              </p>

              {/* Score breakdown */}
              <div style={{
                display: "flex", gap: "16px", justifyContent: "center",
                marginBottom: "28px",
              }}>
                <div style={{
                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                  borderRadius: "12px", padding: "12px 20px", textAlign: "center",
                }}>
                  <p style={{ color: "#10b981", fontSize: "22px", fontWeight: 700, margin: 0 }}>{score}</p>
                  <p style={{ color: "#475569", fontSize: "11px", margin: 0 }}>Correct</p>
                </div>
                <div style={{
                  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: "12px", padding: "12px 20px", textAlign: "center",
                }}>
                  <p style={{ color: "#ef4444", fontSize: "22px", fontWeight: 700, margin: 0 }}>{quiz.total - score}</p>
                  <p style={{ color: "#475569", fontSize: "11px", margin: 0 }}>Wrong</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => { setCurrent(0); setSelected(null); setRevealed(false); setScore(0); setFinished(false); }}
                  style={{
                    background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
                    border: "none", borderRadius: "12px", padding: "12px 28px",
                    color: "white", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                    boxShadow: "0 0 20px rgba(37,99,235,0.3)",
                  }}
                >
                  🔄 Retry Quiz
                </button>
                <button
                  onClick={() => router.push("/exam")}
                  style={{
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px", padding: "12px 28px",
                    color: "#94A3B8", fontSize: "14px", cursor: "pointer",
                  }}
                >
                  📚 Back to Exam
                </button>
              </div>
            </div>
          )}

          {/* Quiz in progress */}
          {!loading && !error && !finished && q && (
            <>
              {/* Progress bar */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ color: "#475569", fontSize: "13px" }}>
                    Question {current + 1} of {quiz!.total}
                  </span>
                  <span style={{ color: "#60A5FA", fontSize: "13px", fontWeight: 600 }}>
                    Score: {score} / {current}
                  </span>
                </div>
                <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${((current + 1) / quiz!.total) * 100}%`,
                    background: "linear-gradient(90deg, #2563EB, #60A5FA)",
                    borderRadius: "999px", transition: "width 0.4s ease",
                  }} />
                </div>
              </div>

              {/* Question card */}
              <div style={{ ...glass, padding: "28px", marginBottom: "16px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#60A5FA", fontSize: "14px", fontWeight: 700, flexShrink: 0,
                  }}>Q{current + 1}</span>
                  <p style={{ color: "#F8FAFC", fontSize: "16px", lineHeight: 1.65, margin: 0 }}>
                    {q.question}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {(["A", "B", "C", "D"] as const).map((key) => {
                  const value = q.options[key];
                  const isCorrect = key === q.correct;
                  const isSelected = key === selected;
                  let bg = "rgba(255,255,255,0.04)";
                  let border = "rgba(255,255,255,0.08)";
                  let labelColor = "#94A3B8";
                  let textColor = "#94A3B8";

                  if (revealed) {
                    if (isCorrect) {
                      bg = "rgba(16,185,129,0.12)";
                      border = "rgba(16,185,129,0.4)";
                      labelColor = "#10b981";
                      textColor = "#D1FAE5";
                    } else if (isSelected) {
                      bg = "rgba(239,68,68,0.1)";
                      border = "rgba(239,68,68,0.3)";
                      labelColor = "#ef4444";
                      textColor = "#FCA5A5";
                    }
                  } else if (isSelected) {
                    bg = "rgba(37,99,235,0.15)";
                    border = "rgba(37,99,235,0.4)";
                    labelColor = "#60A5FA";
                    textColor = "#DBEAFE";
                  }

                  return (
                    <button
                      key={key}
                      onClick={() => handleAnswer(key)}
                      disabled={revealed}
                      style={{
                        background: bg, border: `1px solid ${border}`,
                        borderRadius: "12px", padding: "14px 18px",
                        display: "flex", gap: "12px", alignItems: "center",
                        cursor: revealed ? "default" : "pointer",
                        transition: "all 0.2s", textAlign: "left", width: "100%",
                      }}
                      onMouseEnter={e => {
                        if (!revealed) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                      }}
                      onMouseLeave={e => {
                        if (!revealed) (e.currentTarget as HTMLButtonElement).style.background = bg;
                      }}
                    >
                      <span style={{
                        width: "30px", height: "30px", borderRadius: "8px",
                        background: `${labelColor}20`,
                        border: `1px solid ${labelColor}44`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", fontWeight: 700, color: labelColor, flexShrink: 0,
                      }}>{key}</span>
                      <span style={{ color: textColor, fontSize: "14px", flex: 1 }}>{value}</span>
                      {revealed && isCorrect && (
                        <span style={{ color: "#10b981", fontSize: "18px", flexShrink: 0 }}>✓</span>
                      )}
                      {revealed && isSelected && !isCorrect && (
                        <span style={{ color: "#ef4444", fontSize: "18px", flexShrink: 0 }}>✗</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {revealed && (
                <div style={{
                  ...glass, padding: "18px",
                  background: "rgba(37,99,235,0.06)",
                  borderColor: "rgba(37,99,235,0.2)",
                  marginBottom: "16px",
                  animation: "fadeIn 0.3s ease",
                }}>
                  <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                  <p style={{ color: "#60A5FA", fontSize: "11px", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    💡 Explanation
                  </p>
                  <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
                    {q.explanation}
                  </p>
                </div>
              )}

              {/* Next button */}
              {revealed && (
                <button
                  onClick={handleNext}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
                    border: "none", borderRadius: "12px", padding: "15px",
                    color: "white", fontSize: "15px", fontWeight: 600,
                    cursor: "pointer", transition: "all 0.2s",
                    boxShadow: "0 0 20px rgba(37,99,235,0.35)",
                    animation: "fadeIn 0.3s ease",
                  }}
                >
                  {current + 1 >= quiz!.total ? "🏁 See Final Results" : "Next Question →"}
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: "flex", minHeight: "100vh",
        background: "#0A1224",
        alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "16px",
      }}>
        <div style={{ fontSize: "32px" }}>⚡</div>
        <p style={{ color: "#475569", fontSize: "14px" }}>Loading quiz...</p>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
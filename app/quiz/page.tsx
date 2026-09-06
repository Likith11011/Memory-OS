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
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAF9", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: "240px", flex: 1, padding: "32px 40px", width: "calc(100% - 240px)", boxSizing: "border-box", overflowX: "hidden" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>

          {/* Back button + header */}
          <div style={{ marginBottom: "24px" }}>
            <button
              onClick={() => router.back()}
              style={{ background: "none", border: "none", color: "#52635C", cursor: "pointer", fontSize: "13px", padding: 0, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget.style.color = "#10231D")}
              onMouseLeave={e => (e.currentTarget.style.color = "#52635C")}
            >
              ← Back to Exam
            </button>
            <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#10231D", marginBottom: "4px" }}>
              🧠 AI Knowledge Quiz
            </h2>
            {quiz && (
              <p style={{ color: "#52635C", fontSize: "14px" }}>
                Based on: <span style={{ color: "#065F46", fontWeight: 600 }}>{quiz.memory_title}</span>
              </p>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ background: "#FFFFFF", border: "1px solid #DDE7E2", borderRadius: "16px", padding: "60px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: "36px", marginBottom: "16px" }}>⚡</div>
              <p style={{ color: "#064E3B", fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
                Generating your quiz...
              </p>
              <p style={{ color: "#52635C", fontSize: "13px" }}>
                AI is reading your memory and creating targeted assessment questions
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ background: "#FFFFFF", border: "1px solid #FECACA", borderRadius: "16px", padding: "40px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: "36px", marginBottom: "16px" }}>🍃</div>
              <p style={{ color: "#DC2626", fontSize: "15px", marginBottom: "20px" }}>{error}</p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button
                  onClick={() => { setError(""); setLoading(true); fetchQuiz(); }}
                  style={{
                    background: "#059669",
                    border: "none", borderRadius: "10px", padding: "10px 22px",
                    color: "white", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(5,150,105,0.2)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#047857")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#059669")}
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.back()}
                  style={{
                    background: "#F1F5F3", border: "1px solid #DDE7E2",
                    borderRadius: "10px", padding: "10px 22px",
                    color: "#52635C", fontSize: "14px", cursor: "pointer", fontWeight: 500,
                  }}
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {/* Finished screen */}
          {!loading && !error && finished && quiz && (
            <div style={{ background: "#FFFFFF", border: "1px solid #DDE7E2", borderRadius: "20px", padding: "48px 40px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: "56px", marginBottom: "20px" }}>
                {score === quiz.total ? "🏆" : score >= quiz.total * 0.7 ? "🎉" : score >= quiz.total * 0.5 ? "📚" : "💪"}
              </div>
              <h3 style={{ color: "#10231D", fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>
                Quiz Complete!
              </h3>
              <div style={{
                display: "flex", alignItems: "baseline", gap: "8px",
                justifyContent: "center", marginBottom: "12px",
              }}>
                <span style={{ color: "#059669", fontSize: "48px", fontWeight: 800 }}>{score}</span>
                <span style={{ color: "#7A8A84", fontSize: "24px" }}>/ {quiz.total}</span>
              </div>
              <p style={{ color: "#52635C", fontSize: "14px", marginBottom: "8px" }}>
                {Math.round((score / quiz.total) * 100)}% correct
              </p>
              <p style={{
                color: score === quiz.total ? "#059669"
                  : score >= quiz.total * 0.7 ? "#065F46"
                  : "#D97706",
                fontSize: "15px", fontWeight: 600, marginBottom: "32px",
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
                  background: "#ECFDF5", border: "1px solid #A7F3D0",
                  borderRadius: "12px", padding: "12px 24px", textAlign: "center",
                }}>
                  <p style={{ color: "#059669", fontSize: "24px", fontWeight: 700, margin: 0 }}>{score}</p>
                  <p style={{ color: "#065F46", fontSize: "11px", margin: 0, fontWeight: 600 }}>Correct</p>
                </div>
                <div style={{
                  background: "#FEF2F2", border: "1px solid #FECACA",
                  borderRadius: "12px", padding: "12px 24px", textAlign: "center",
                }}>
                  <p style={{ color: "#DC2626", fontSize: "24px", fontWeight: 700, margin: 0 }}>{quiz.total - score}</p>
                  <p style={{ color: "#991B1B", fontSize: "11px", margin: 0, fontWeight: 600 }}>Wrong</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => { setCurrent(0); setSelected(null); setRevealed(false); setScore(0); setFinished(false); }}
                  style={{
                    background: "#059669",
                    border: "none", borderRadius: "12px", padding: "12px 28px",
                    color: "white", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(5,150,105,0.25)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#047857")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#059669")}
                >
                  🔄 Retry Quiz
                </button>
                <button
                  onClick={() => router.push("/exam")}
                  style={{
                    background: "#F1F5F3", border: "1px solid #DDE7E2",
                    borderRadius: "12px", padding: "12px 28px",
                    color: "#52635C", fontSize: "14px", cursor: "pointer", fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#E2E8E5"; e.currentTarget.style.color = "#10231D"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#F1F5F3"; e.currentTarget.style.color = "#52635C"; }}
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
                  <span style={{ color: "#52635C", fontSize: "13px", fontWeight: 500 }}>
                    Question {current + 1} of {quiz!.total}
                  </span>
                  <span style={{ color: "#065F46", fontSize: "13px", fontWeight: 600 }}>
                    Score: {score} / {current}
                  </span>
                </div>
                <div style={{ height: "6px", background: "#E2E8E5", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${((current + 1) / quiz!.total) * 100}%`,
                    background: "linear-gradient(90deg, #059669, #10B981)",
                    borderRadius: "999px", transition: "width 0.4s ease",
                  }} />
                </div>
              </div>

              {/* Question card */}
              <div style={{ background: "#FFFFFF", border: "1px solid #DDE7E2", borderRadius: "16px", padding: "28px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    background: "#ECFDF5", border: "1px solid #A7F3D0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#065F46", fontSize: "13px", fontWeight: 700, flexShrink: 0,
                  }}>Q{current + 1}</span>
                  <p style={{ color: "#10231D", fontSize: "16px", lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
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
                  let bg = "#FFFFFF";
                  let border = "#DDE7E2";
                  let labelBg = "#F1F5F3";
                  let labelBorder = "#DDE7E2";
                  let labelColor = "#52635C";
                  let textColor = "#10231D";

                  if (revealed) {
                    if (isCorrect) {
                      bg = "#ECFDF5";
                      border = "#10B981";
                      labelBg = "#059669";
                      labelBorder = "#059669";
                      labelColor = "#FFFFFF";
                      textColor = "#064E3B";
                    } else if (isSelected) {
                      bg = "#FEF2F2";
                      border = "#F87171";
                      labelBg = "#DC2626";
                      labelBorder = "#DC2626";
                      labelColor = "#FFFFFF";
                      textColor = "#991B1B";
                    }
                  } else if (isSelected) {
                    bg = "#ECFDF5";
                    border = "#059669";
                    labelBg = "#059669";
                    labelBorder = "#059669";
                    labelColor = "#FFFFFF";
                    textColor = "#064E3B";
                  }

                  return (
                    <button
                      key={key}
                      onClick={() => handleAnswer(key)}
                      disabled={revealed}
                      style={{
                        background: bg, border: `1.5px solid ${border}`,
                        borderRadius: "12px", padding: "14px 18px",
                        display: "flex", gap: "12px", alignItems: "center",
                        cursor: revealed ? "default" : "pointer",
                        transition: "all 0.2s", textAlign: "left", width: "100%",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                      }}
                      onMouseEnter={e => {
                        if (!revealed) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#059669";
                          (e.currentTarget as HTMLButtonElement).style.background = "#F9FBFA";
                        }
                      }}
                      onMouseLeave={e => {
                        if (!revealed) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = isSelected ? "#059669" : "#DDE7E2";
                          (e.currentTarget as HTMLButtonElement).style.background = isSelected ? "#ECFDF5" : "#FFFFFF";
                        }
                      }}
                    >
                      <span style={{
                        width: "30px", height: "30px", borderRadius: "8px",
                        background: labelBg,
                        border: `1px solid ${labelBorder}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", fontWeight: 700, color: labelColor, flexShrink: 0,
                      }}>{key}</span>
                      <span style={{ color: textColor, fontSize: "14px", flex: 1, fontWeight: isSelected || (revealed && isCorrect) ? 600 : 400 }}>{value}</span>
                      {revealed && isCorrect && (
                        <span style={{ color: "#059669", fontSize: "18px", fontWeight: 700, flexShrink: 0 }}>✓</span>
                      )}
                      {revealed && isSelected && !isCorrect && (
                        <span style={{ color: "#DC2626", fontSize: "18px", fontWeight: 700, flexShrink: 0 }}>✗</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {revealed && (
                <div style={{
                  background: "#F1F5F3", border: "1px solid #DDE7E2", borderRadius: "14px",
                  padding: "18px", marginBottom: "16px",
                  animation: "fadeIn 0.3s ease",
                }}>
                  <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                  <p style={{ color: "#064E3B", fontSize: "11px", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    💡 Explanation
                  </p>
                  <p style={{ color: "#52635C", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
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
                    background: "#059669",
                    border: "none", borderRadius: "12px", padding: "15px",
                    color: "white", fontSize: "15px", fontWeight: 600,
                    cursor: "pointer", transition: "all 0.2s",
                    boxShadow: "0 2px 8px rgba(5,150,105,0.25)",
                    animation: "fadeIn 0.3s ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#047857")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#059669")}
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
        background: "#F8FAF9",
        alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "16px",
      }}>
        <div style={{ fontSize: "32px" }}>⚡</div>
        <p style={{ color: "#52635C", fontSize: "14px" }}>Loading quiz...</p>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import api, { getMemories } from "@/lib/api";
import Link from "next/link";

interface Question {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: string;
  explanation: string;
}

interface QuizData {
  memory_id?: number;
  memory_title: string;
  questions: Question[];
  total: number;
}

interface MemoryOption {
  id: number;
  title: string;
  content: string;
  file_type: string;
  memory_category?: string;
  subject?: string;
}

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMemoryId = searchParams.get("id");

  const [activeMemoryId, setActiveMemoryId] = useState<string | null>(initialMemoryId);
  const [availableMemories, setAvailableMemories] = useState<MemoryOption[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadAvailableMemories();
  }, [router]);

  useEffect(() => {
    if (activeMemoryId) {
      fetchQuiz(activeMemoryId);
    }
  }, [activeMemoryId]);

  const loadAvailableMemories = async () => {
    setLoadingMemories(true);
    try {
      const data = await getMemories();
      const list = data.memories || [];
      setAvailableMemories(list);
      // If no memory ID in URL and memories exist, default is selection screen
    } catch (err) {
      console.error("Failed to load memories for quiz picker", err);
    } finally {
      setLoadingMemories(false);
    }
  };

  const fetchQuiz = async (id: string) => {
    try {
      setError("");
      setLoadingQuiz(true);
      setFinished(false);
      setCurrent(0);
      setSelected(null);
      setRevealed(false);
      setScore(0);

      const res = await api.post(`/memories/${id}/quiz`, {}, { timeout: 30000 });
      if (res.data && res.data.questions && res.data.questions.length > 0) {
        setQuiz(res.data);
      } else {
        setError("Unable to generate quiz questions for this topic. Try another memory.");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate quiz. You can pick another topic.");
    } finally {
      setLoadingQuiz(false);
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

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setFinished(false);
  };

  const handleSelectDifferentMemory = () => {
    setActiveMemoryId(null);
    setQuiz(null);
    setError("");
    router.push("/quiz");
  };

  const q = quiz?.questions[current];

  const filteredList = availableMemories.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.subject && m.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.memory_category && m.memory_category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#09110E", color: "#F0FDF4", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: "250px", flex: 1, padding: "32px 40px", width: "calc(100% - 250px)", boxSizing: "border-box", overflowX: "hidden" }}>

        {/* Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "14px", color: "#10B981", fontWeight: 600 }}>🎯 Active Recall Test Mode</span>
            </div>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#F0FDF4", margin: 0, letterSpacing: "-0.02em" }}>
              AI Knowledge Quiz
            </h2>
            <p style={{ color: "#9EB3A8", fontSize: "14px", marginTop: "4px" }}>
              Test your retention with dynamically generated multi-choice questions grounded in your saved notes.
            </p>
          </div>

          {activeMemoryId && (
            <button
              onClick={handleSelectDifferentMemory}
              className="btn-secondary"
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              ← Choose Another Topic
            </button>
          )}
        </div>

        {/* VIEW 1: Memory Picker Screen (when no active quiz is running) */}
        {!activeMemoryId && (
          <div style={{ maxWidth: "960px" }}>
            {/* Search filter for memories */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: "20px", flexWrap: "wrap", gap: "12px",
            }}>
              <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#5D756C" }}>⌕</span>
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filter topics or subjects..."
                  className="input-field"
                  style={{ width: "100%", padding: "8px 14px 8px 34px", fontSize: "13px" }}
                />
              </div>
              <span style={{ color: "#9EB3A8", fontSize: "13px" }}>
                {filteredList.length} study {filteredList.length === 1 ? "source" : "sources"} available
              </span>
            </div>

            {loadingMemories ? (
              <div style={{ textAlign: "center", color: "#9EB3A8", padding: "80px" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }} className="animate-spin">🌲</div>
                <p style={{ fontSize: "15px", color: "#F0FDF4", fontWeight: 600 }}>Loading your study topics...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "70px 20px",
                background: "#111E1A", border: "1px dashed #1F3830",
                borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
              }}>
                <div style={{ fontSize: "48px", marginBottom: "14px" }}>📚</div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#F0FDF4", marginBottom: "6px" }}>
                  {searchTerm ? `No memories matching "${searchTerm}"` : "No study notes found yet"}
                </h3>
                <p style={{ fontSize: "13.5px", color: "#9EB3A8", maxWidth: "420px", margin: "0 auto 20px" }}>
                  Upload notes, PDFs, or exam material to generate targeted assessment quizzes automatically.
                </p>
                <Link href="/dashboard" className="btn-primary" style={{ padding: "10px 24px", fontSize: "13.5px" }}>
                  + Upload Memory on Dashboard
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "16px" }}>
                {filteredList.map((mem) => (
                  <div
                    key={mem.id}
                    className="memory-card"
                    style={{
                      background: "#111E1A",
                      border: "1px solid #1F3830",
                      borderRadius: "16px",
                      padding: "18px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span className="tag-pill" style={{ textTransform: "capitalize", fontSize: "10.5px" }}>
                          {mem.memory_category || "General"}
                        </span>
                        {mem.subject && (
                          <span style={{ color: "#FBBF24", fontSize: "11px", fontWeight: 600 }}>
                            📖 {mem.subject}
                          </span>
                        )}
                      </div>
                      <h4 style={{ color: "#F0FDF4", fontSize: "15px", fontWeight: 700, marginBottom: "8px", lineHeight: 1.3 }}>
                        {mem.title || "Untitled Memory"}
                      </h4>
                      <p style={{
                        color: "#9EB3A8", fontSize: "12px", lineHeight: 1.5,
                        display: "-webkit-box", WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical", overflow: "hidden",
                        marginBottom: "16px",
                      }}>
                        {mem.content}
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveMemoryId(String(mem.id))}
                      className="btn-primary"
                      style={{ width: "100%", padding: "9px 0", fontSize: "13px" }}
                    >
                      ⚡ Start AI Quiz →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Active Quiz Running Screen */}
        {activeMemoryId && (
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            {/* Loading Quiz Generation */}
            {loadingQuiz && (
              <div style={{
                background: "#111E1A", border: "1px solid #1F3830",
                borderRadius: "18px", padding: "60px 30px", textAlign: "center",
                boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
              }}>
                <div style={{ fontSize: "40px", marginBottom: "16px" }} className="animate-spin">⚡</div>
                <h3 style={{ color: "#34D399", fontSize: "18px", fontWeight: 700, marginBottom: "6px" }}>
                  Synthesizing Quiz Questions...
                </h3>
                <p style={{ color: "#9EB3A8", fontSize: "13.5px", maxWidth: "440px", margin: "0 auto" }}>
                  AI is analyzing your memory content, extracting key concepts, and crafting test scenarios.
                </p>
              </div>
            )}

            {/* Error state */}
            {!loadingQuiz && error && (
              <div style={{
                background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "16px", padding: "24px", textAlign: "center",
              }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>⚠</div>
                <h3 style={{ color: "#F87171", fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>
                  Quiz Generation Notice
                </h3>
                <p style={{ color: "#9EB3A8", fontSize: "13px", marginBottom: "18px" }}>
                  {error}
                </p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  <button onClick={() => fetchQuiz(activeMemoryId)} className="btn-primary" style={{ padding: "8px 18px", fontSize: "13px" }}>
                    Retry Generation
                  </button>
                  <button onClick={handleSelectDifferentMemory} className="btn-secondary" style={{ padding: "8px 18px", fontSize: "13px" }}>
                    Pick Another Topic
                  </button>
                </div>
              </div>
            )}

            {/* Active Questions Container */}
            {!loadingQuiz && !error && quiz && !finished && q && (
              <div className="glass-card animate-scaleIn" style={{
                background: "#111E1A",
                border: "1px solid #1F3830",
                borderRadius: "18px",
                padding: "28px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}>
                {/* Progress bar */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#34D399", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Question {current + 1} of {quiz.total}
                    </span>
                    <span style={{ fontSize: "12px", color: "#9EB3A8" }}>
                      Score: <strong style={{ color: "#F0FDF4" }}>{score}</strong>
                    </span>
                  </div>
                  <div style={{ height: "6px", background: "#0E1915", borderRadius: "999px", overflow: "hidden", border: "1px solid #1F3830" }}>
                    <div style={{
                      height: "100%",
                      width: `${((current + 1) / quiz.total) * 100}%`,
                      background: "linear-gradient(90deg, #059669, #10B981)",
                      transition: "width 0.3s ease",
                      borderRadius: "999px",
                    }} />
                  </div>
                </div>

                {/* Topic context */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                  <span style={{ fontSize: "12px", color: "#5D756C" }}>Topic:</span>
                  <span style={{ fontSize: "12px", color: "#34D399", fontWeight: 600 }}>{quiz.memory_title}</span>
                </div>

                {/* Question title */}
                <h3 style={{
                  color: "#F0FDF4", fontSize: "17px", fontWeight: 700,
                  lineHeight: 1.45, marginBottom: "22px",
                }}>
                  {q.question}
                </h3>

                {/* Options List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  {(["A", "B", "C", "D"] as const).map((key) => {
                    const text = q.options[key];
                    if (!text) return null;
                    const isSelected = selected === key;
                    const isCorrect = q.correct === key;

                    let bg = "#0E1915";
                    let borderColor = "#1F3830";
                    let textColor = "#F0FDF4";

                    if (revealed) {
                      if (isCorrect) {
                        bg = "rgba(16, 185, 129, 0.18)";
                        borderColor = "#10B981";
                        textColor = "#34D399";
                      } else if (isSelected && !isCorrect) {
                        bg = "rgba(239, 68, 68, 0.18)";
                        borderColor = "#EF4444";
                        textColor = "#F87171";
                      }
                    } else if (isSelected) {
                      bg = "#172923";
                      borderColor = "#10B981";
                    }

                    return (
                      <button
                        key={key}
                        onClick={() => handleAnswer(key)}
                        disabled={revealed}
                        style={{
                          background: bg,
                          border: `1.5px solid ${borderColor}`,
                          borderRadius: "12px",
                          padding: "12px 16px",
                          color: textColor,
                          textAlign: "left",
                          cursor: revealed ? "default" : "pointer",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          transition: "all 0.18s ease",
                        }}
                      >
                        <span style={{
                          width: "24px", height: "24px", borderRadius: "6px",
                          background: isSelected || (revealed && isCorrect) ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.06)",
                          border: `1px solid ${borderColor}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "12px", fontWeight: 700, flexShrink: 0,
                        }}>
                          {key}
                        </span>
                        <span style={{ fontSize: "14px", lineHeight: 1.45, flex: 1 }}>
                          {text}
                        </span>
                        {revealed && isCorrect && <span style={{ color: "#10B981", fontWeight: 700 }}>✓</span>}
                        {revealed && isSelected && !isCorrect && <span style={{ color: "#EF4444", fontWeight: 700 }}>✗</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Box on Reveal */}
                {revealed && (
                  <div className="animate-fadeIn" style={{
                    background: "#0E1915",
                    border: "1px solid #1F3830",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    marginBottom: "20px",
                  }}>
                    <p style={{
                      color: selected === q.correct ? "#34D399" : "#F87171",
                      fontSize: "12px", fontWeight: 700, marginBottom: "4px",
                      textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>
                      {selected === q.correct ? "✓ Correct Answer" : `✗ Incorrect (Correct: ${q.correct})`}
                    </p>
                    <p style={{ color: "#9EB3A8", fontSize: "13px", lineHeight: 1.5, margin: 0 }}>
                      {q.explanation}
                    </p>
                  </div>
                )}

                {/* Next Button */}
                {revealed && (
                  <button
                    onClick={handleNext}
                    className="btn-primary"
                    style={{ width: "100%", padding: "12px 0", fontSize: "14px" }}
                  >
                    {current + 1 >= quiz.total ? "View Final Score →" : "Next Question →"}
                  </button>
                )}
              </div>
            )}

            {/* Final Score Report */}
            {!loadingQuiz && finished && quiz && (
              <div className="glass-card animate-scaleIn" style={{
                background: "#111E1A",
                border: "1px solid #1F3830",
                borderRadius: "18px",
                padding: "40px 30px",
                textAlign: "center",
                boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
              }}>
                <div style={{ fontSize: "52px", marginBottom: "16px" }}>
                  {score === quiz.total ? "🏆" : score >= quiz.total * 0.7 ? "🎉" : "📚"}
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: 800, color: "#F0FDF4", marginBottom: "6px" }}>
                  Quiz Complete!
                </h3>
                <p style={{ color: "#9EB3A8", fontSize: "14px", marginBottom: "24px" }}>
                  Topic: <strong style={{ color: "#34D399" }}>{quiz.memory_title}</strong>
                </p>

                {/* Score badge */}
                <div style={{
                  display: "inline-block",
                  background: "#0E1915", border: "1px solid #1F3830",
                  borderRadius: "16px", padding: "16px 36px",
                  marginBottom: "28px",
                }}>
                  <div style={{ fontSize: "36px", fontWeight: 800, color: score >= quiz.total * 0.7 ? "#34D399" : "#FBBF24" }}>
                    {score} / {quiz.total}
                  </div>
                  <div style={{ fontSize: "12px", color: "#9EB3A8", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                    {Math.round((score / quiz.total) * 100)}% Accuracy
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={handleRestart} className="btn-primary" style={{ padding: "10px 24px", fontSize: "14px" }}>
                    🔄 Retake Quiz
                  </button>
                  <button onClick={handleSelectDifferentMemory} className="btn-secondary" style={{ padding: "10px 24px", fontSize: "14px" }}>
                    📑 Pick Another Topic
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#09110E", color: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Loading Quiz Workspace...</p>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
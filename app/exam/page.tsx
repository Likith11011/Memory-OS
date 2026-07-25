"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getExamRevision, markReviewed } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/api";

interface Memory {
  id: number;
  title: string;
  content: string;
  file_type: string;
  tags: string;
  subject?: string;
  difficulty?: string;
  explanation?: string;
  review_count?: number;
  last_reviewed?: string;
  created_at: string;
}

const difficultyConfig = {
  easy: { color: "#10b981", glow: "rgba(16,185,129,0.3)", icon: "🟢", label: "Easy" },
  medium: { color: "#f59e0b", glow: "rgba(245,158,11,0.3)", icon: "🟡", label: "Medium" },
  hard: { color: "#ef4444", glow: "rgba(239,68,68,0.3)", icon: "🔴", label: "Hard" },
};

export default function ExamPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<string | null>(null);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<"cards" | "flashcard">("cards");
  const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchExamMemories();
  }, []);

const fetchExamMemories = async () => {
  try {
    const data = await getExamRevision();
    setMemories(data.memories || []);
  } catch (err: any) {
    if (err.code === "ERR_NETWORK" || err.message?.includes("Network")) {
      setError("Server is waking up. Please wait 30 seconds and refresh.");
    } else {
      setError("Failed to load exam memories.");
    }
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const handleReview = async (id: number) => {
    try {
      await markReviewed(id);
      setReviewedIds(prev => new Set([...prev, id]));
      setMemories(prev => prev.map(m =>
        m.id === id ? { ...m, review_count: (m.review_count || 0) + 1 } : m
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const subjects = Array.from(new Set(memories.map(m => m.subject).filter(Boolean))) as string[];

  const filtered = memories.filter(m => {
    if (activeSubject && m.subject !== activeSubject) return false;
    if (activeDifficulty && m.difficulty !== activeDifficulty) return false;
    return true;
  });

  const currentCard = filtered[flashcardIndex];

  const glass = {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #0A1224 0%, #0d1530 100%)", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: "240px", flex: 1, padding: "32px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#F8FAFC", marginBottom: "4px", letterSpacing: "-0.02em" }}>
              📚 Exam Revision
            </h2>
            <p style={{ color: "#475569", fontSize: "14px" }}>
              {filtered.length} memories to review
              {reviewedIds.size > 0 && <span style={{ color: "#10b981", marginLeft: "8px" }}>• {reviewedIds.size} reviewed today</span>}
            </p>
          </div>

          {/* Mode toggle */}
          <div style={{
            display: "flex", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px", padding: "4px",
          }}>
            {(["cards", "flashcard"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setFlashcardIndex(0); setFlipped(false); }} style={{
                padding: "8px 18px", borderRadius: "8px", border: "none",
                background: mode === m ? "rgba(37,99,235,0.25)" : "transparent",
                color: mode === m ? "#60A5FA" : "#475569",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s", textTransform: "capitalize",
              }}>
                {m === "cards" ? "⊞ Cards" : "🃏 Flashcard"}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "28px", flexWrap: "wrap" }}>
          {/* Subject filter */}
          {subjects.length > 0 && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#334155", fontSize: "12px", fontWeight: 600 }}>Subject:</span>
              <button onClick={() => setActiveSubject(null)} style={{
                background: !activeSubject ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${!activeSubject ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "999px", color: !activeSubject ? "#60A5FA" : "#475569",
                padding: "4px 12px", fontSize: "12px", cursor: "pointer",
              }}>All</button>
              {subjects.map(s => (
                <button key={s} onClick={() => setActiveSubject(activeSubject === s ? null : s)} style={{
                  background: activeSubject === s ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${activeSubject === s ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "999px", color: activeSubject === s ? "#60A5FA" : "#475569",
                  padding: "4px 12px", fontSize: "12px", cursor: "pointer",
                }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Difficulty filter */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ color: "#334155", fontSize: "12px", fontWeight: 600 }}>Difficulty:</span>
            <button onClick={() => setActiveDifficulty(null)} style={{
              background: !activeDifficulty ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${!activeDifficulty ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: "999px", color: !activeDifficulty ? "#60A5FA" : "#475569",
              padding: "4px 12px", fontSize: "12px", cursor: "pointer",
            }}>All</button>
            {["easy", "medium", "hard"].map(d => {
              const dc = difficultyConfig[d as keyof typeof difficultyConfig];
              return (
                <button key={d} onClick={() => setActiveDifficulty(activeDifficulty === d ? null : d)} style={{
                  background: activeDifficulty === d ? `${dc.color}18` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${activeDifficulty === d ? dc.color + "44" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "999px",
                  color: activeDifficulty === d ? dc.color : "#475569",
                  padding: "4px 12px", fontSize: "12px", cursor: "pointer",
                }}>
                  {dc.icon} {dc.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#475569", padding: "80px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
            Loading revision materials...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px",
            ...glass,
          }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>📚</div>
            <p style={{ fontSize: "18px", fontWeight: 600, color: "#64748b", marginBottom: "8px" }}>
              No exam memories yet
            </p>
            <p style={{ fontSize: "14px", color: "#334155" }}>
              Upload notes with "Exam Revision" category to get started
            </p>
          </div>
        ) : mode === "cards" ? (
          // Card view
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {filtered.map((memory) => {
              const dc = difficultyConfig[memory.difficulty as keyof typeof difficultyConfig];
              const isReviewed = reviewedIds.has(memory.id);
              return (
                <div key={memory.id} style={{
                  ...glass,
                  padding: "22px",
                  transition: "all 0.3s",
                  position: "relative",
                  overflow: "hidden",
                  opacity: isReviewed ? 0.7 : 1,
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,99,235,0.3)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 30px rgba(0,0,0,0.3)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  }}
                >
                  {/* Top accent */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                    background: dc ? `linear-gradient(90deg, ${dc.color}, transparent)` : "linear-gradient(90deg, #2563EB, transparent)",
                  }} />

                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {memory.subject && (
                        <span style={{
                          background: "rgba(37,99,235,0.12)",
                          border: "1px solid rgba(37,99,235,0.25)",
                          color: "#60A5FA", fontSize: "11px",
                          padding: "2px 8px", borderRadius: "999px", fontWeight: 600,
                        }}>
                          📖 {memory.subject}
                        </span>
                      )}
                      {dc && (
                        <span style={{
                          background: `${dc.color}15`,
                          border: `1px solid ${dc.color}33`,
                          color: dc.color, fontSize: "11px",
                          padding: "2px 8px", borderRadius: "999px", fontWeight: 600,
                        }}>
                          {dc.icon} {dc.label}
                        </span>
                      )}
                    </div>
                    {isReviewed && (
                      <span style={{
                        background: "rgba(16,185,129,0.12)",
                        border: "1px solid rgba(16,185,129,0.25)",
                        color: "#10b981", fontSize: "10px",
                        padding: "2px 8px", borderRadius: "999px",
                      }}>✓ Reviewed</span>
                    )}
                  </div>

                  <h3 style={{ color: "#F8FAFC", fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>
                    {memory.title}
                  </h3>

                  <p style={{
                    color: "#64748b", fontSize: "13px", lineHeight: 1.6, marginBottom: "12px",
                    display: "-webkit-box", WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {memory.content}
                  </p>

                  {/* AI Explanation */}
                  {memory.explanation && (
                    <div style={{
                      background: "rgba(37,99,235,0.06)",
                      border: "1px solid rgba(37,99,235,0.15)",
                      borderRadius: "10px", padding: "12px",
                      marginBottom: "14px",
                    }}>
                      <p style={{ color: "#475569", fontSize: "10px", fontWeight: 600, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        🤖 AI Explanation ({memory.difficulty})
                      </p>
                      <p style={{ color: "#94A3B8", fontSize: "12px", lineHeight: 1.6, margin: 0 }}>
                        {memory.explanation}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#334155", fontSize: "11px" }}>
                      {(memory.review_count || 0) > 0 ? `reviewed ${memory.review_count}×` : "not reviewed yet"}
                    </span>
                    <button
                      onClick={() => handleReview(memory.id)}
                      disabled={isReviewed}
                      style={{
                        background: isReviewed ? "rgba(16,185,129,0.12)" : "rgba(37,99,235,0.15)",
                        border: `1px solid ${isReviewed ? "rgba(16,185,129,0.3)" : "rgba(37,99,235,0.3)"}`,
                        color: isReviewed ? "#10b981" : "#60A5FA",
                        borderRadius: "8px", padding: "6px 14px",
                        fontSize: "12px", fontWeight: 600,
                        cursor: isReviewed ? "default" : "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {isReviewed ? "✓ Done" : "Mark reviewed"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Flashcard mode
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            {/* Progress */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <span style={{ color: "#475569", fontSize: "13px" }}>
                Card {flashcardIndex + 1} of {filtered.length}
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
                {filtered.map((_, i) => (
                  <div key={i} style={{
                    width: i === flashcardIndex ? "20px" : "8px",
                    height: "8px", borderRadius: "999px",
                    background: i < flashcardIndex ? "#10b981" : i === flashcardIndex ? "#2563EB" : "rgba(255,255,255,0.1)",
                    transition: "all 0.3s",
                  }} />
                ))}
              </div>
              <span style={{ color: "#475569", fontSize: "13px" }}>
                {Math.round((flashcardIndex / filtered.length) * 100)}%
              </span>
            </div>

            {currentCard && (
              <>
                {/* Flashcard */}
                <div
                  onClick={() => setFlipped(!flipped)}
                  style={{
                    ...glass,
                    padding: "48px 40px",
                    minHeight: "300px",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    position: "relative",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "16px",
                    marginBottom: "24px",
                    boxShadow: flipped
                      ? "0 0 40px rgba(37,99,235,0.2), 0 20px 40px rgba(0,0,0,0.3)"
                      : "0 10px 30px rgba(0,0,0,0.2)",
                    borderColor: flipped ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.08)",
                  }}
                >
                  {/* Card indicator */}
                  <div style={{
                    position: "absolute", top: "16px", right: "16px",
                    background: flipped ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${flipped ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: "8px", padding: "4px 10px",
                    color: flipped ? "#60A5FA" : "#475569",
                    fontSize: "11px", fontWeight: 600,
                  }}>
                    {flipped ? "Answer" : "Question"}
                  </div>

                  {/* Difficulty */}
                  {currentCard.difficulty && (
                    <span style={{
                      background: `${difficultyConfig[currentCard.difficulty as keyof typeof difficultyConfig]?.color || "#2563EB"}15`,
                      border: `1px solid ${difficultyConfig[currentCard.difficulty as keyof typeof difficultyConfig]?.color || "#2563EB"}33`,
                      color: difficultyConfig[currentCard.difficulty as keyof typeof difficultyConfig]?.color || "#60A5FA",
                      fontSize: "11px", padding: "3px 10px", borderRadius: "999px",
                    }}>
                      {difficultyConfig[currentCard.difficulty as keyof typeof difficultyConfig]?.icon} {currentCard.difficulty}
                    </span>
                  )}

                  {!flipped ? (
                    <>
                      <h3 style={{ color: "#F8FAFC", fontSize: "22px", fontWeight: 700, lineHeight: 1.3 }}>
                        {currentCard.title}
                      </h3>
                      {currentCard.subject && (
                        <span style={{ color: "#475569", fontSize: "13px" }}>📖 {currentCard.subject}</span>
                      )}
                      <p style={{ color: "#334155", fontSize: "13px", marginTop: "8px" }}>
                        Tap to reveal answer
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ color: "#94A3B8", fontSize: "15px", lineHeight: 1.7, maxWidth: "500px" }}>
                        {currentCard.content}
                      </p>
                      {currentCard.explanation && (
                        <div style={{
                          background: "rgba(37,99,235,0.06)",
                          border: "1px solid rgba(37,99,235,0.15)",
                          borderRadius: "10px", padding: "14px",
                          maxWidth: "500px", width: "100%",
                        }}>
                          <p style={{ color: "#475569", fontSize: "10px", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase" }}>
                            🤖 AI Explanation
                          </p>
                          <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
                            {currentCard.explanation}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Navigation */}
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                  <button
                    onClick={() => { setFlashcardIndex(Math.max(0, flashcardIndex - 1)); setFlipped(false); }}
                    disabled={flashcardIndex === 0}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px", padding: "12px 24px",
                      color: flashcardIndex === 0 ? "#334155" : "#94A3B8",
                      fontSize: "14px", cursor: flashcardIndex === 0 ? "not-allowed" : "pointer",
                      fontWeight: 500, transition: "all 0.2s",
                    }}
                  >
                    ← Previous
                  </button>

                  <button
                    onClick={() => handleReview(currentCard.id)}
                    style={{
                      background: reviewedIds.has(currentCard.id) ? "rgba(16,185,129,0.12)" : "rgba(37,99,235,0.15)",
                      border: `1px solid ${reviewedIds.has(currentCard.id) ? "rgba(16,185,129,0.3)" : "rgba(37,99,235,0.3)"}`,
                      borderRadius: "12px", padding: "12px 24px",
                      color: reviewedIds.has(currentCard.id) ? "#10b981" : "#60A5FA",
                      fontSize: "14px", cursor: "pointer", fontWeight: 600,
                      transition: "all 0.2s",
                    }}
                  >
                    {reviewedIds.has(currentCard.id) ? "✓ Reviewed" : "✓ Mark reviewed"}
                  </button>

                  <button
                    onClick={() => {
                      if (flashcardIndex < filtered.length - 1) {
                        setFlashcardIndex(flashcardIndex + 1);
                        setFlipped(false);
                      }
                    }}
                    disabled={flashcardIndex === filtered.length - 1}
                    style={{
                      background: flashcardIndex === filtered.length - 1 ? "rgba(255,255,255,0.02)" : "linear-gradient(135deg, #2563EB, #1d4ed8)",
                      border: "none", borderRadius: "12px", padding: "12px 24px",
                      color: flashcardIndex === filtered.length - 1 ? "#334155" : "white",
                      fontSize: "14px",
                      cursor: flashcardIndex === filtered.length - 1 ? "not-allowed" : "pointer",
                      fontWeight: 600, transition: "all 0.2s",
                      boxShadow: flashcardIndex < filtered.length - 1 ? "0 0 20px rgba(37,99,235,0.3)" : "none",
                    }}
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
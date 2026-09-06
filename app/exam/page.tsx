"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getExamRevision, markReviewed } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

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
  easy: { color: "#34D399", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)", icon: "🟢", label: "Easy" },
  medium: { color: "#FBBF24", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)", icon: "🟡", label: "Medium" },
  hard: { color: "#F87171", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)", icon: "🔴", label: "Hard" },
};

export default function ExamPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<string | null>(null);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<"cards" | "flashcard">("cards");
  const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchExamMemories();
  }, []);

  const fetchExamMemories = async () => {
    try {
      setError("");
      const data = await getExamRevision();
      setMemories(data.memories || []);
    } catch (err: any) {
      if (err.code === "ERR_NETWORK" || err.message?.includes("Network")) {
        setError("Server is waking up. Please wait 30 seconds and try again.");
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

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#09110E", color: "#F0FDF4", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: "250px", flex: 1, padding: "32px 40px", width: "calc(100% - 250px)", boxSizing: "border-box", overflowX: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#F0FDF4", marginBottom: "4px", letterSpacing: "-0.02em" }}>
              📚 Exam Revision
            </h2>
            <p style={{ color: "#9EB3A8", fontSize: "14px" }}>
              {filtered.length} memories to review
              {reviewedIds.size > 0 && (
                <span style={{ color: "#34D399", marginLeft: "8px", fontWeight: 600 }}>• {reviewedIds.size} reviewed today</span>
              )}
            </p>
          </div>

          {/* Mode toggle */}
          <div style={{
            display: "flex", background: "#0E1915",
            border: "1px solid #1F3830",
            borderRadius: "12px", padding: "4px",
          }}>
            {(["cards", "flashcard"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setFlashcardIndex(0); setFlipped(false); }} style={{
                padding: "8px 18px", borderRadius: "8px", border: "none",
                background: mode === m ? "#172923" : "transparent",
                color: mode === m ? "#34D399" : "#9EB3A8",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.4)" : "none",
                transition: "all 0.2s", textTransform: "capitalize",
              }}>
                {m === "cards" ? "⊞ Cards" : "🃏 Flashcard"}
              </button>
            ))}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "12px", padding: "14px 20px",
            color: "#FBBF24", fontSize: "14px", marginBottom: "20px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>⚠ {error}</span>
            <button
              onClick={() => { setError(""); setLoading(true); fetchExamMemories(); }}
              style={{
                background: "rgba(245, 158, 11, 0.3)", border: "1px solid #F59E0B",
                borderRadius: "8px", padding: "5px 14px", color: "#FDE68A",
                cursor: "pointer", fontSize: "12px", fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "28px", flexWrap: "wrap", alignItems: "center" }}>
          {subjects.length > 0 && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#9EB3A8", fontSize: "12px", fontWeight: 600 }}>Subject:</span>
              <button onClick={() => setActiveSubject(null)} style={{
                background: !activeSubject ? "rgba(16, 185, 129, 0.15)" : "#111E1A",
                border: `1px solid ${!activeSubject ? "#10B981" : "#1F3830"}`,
                borderRadius: "999px", color: !activeSubject ? "#34D399" : "#9EB3A8",
                fontWeight: !activeSubject ? 600 : 500,
                padding: "4px 14px", fontSize: "12px", cursor: "pointer",
                transition: "all 0.2s",
              }}>All</button>
              {subjects.map(s => (
                <button key={s} onClick={() => setActiveSubject(activeSubject === s ? null : s)} style={{
                  background: activeSubject === s ? "rgba(16, 185, 129, 0.15)" : "#111E1A",
                  border: `1px solid ${activeSubject === s ? "#10B981" : "#1F3830"}`,
                  borderRadius: "999px", color: activeSubject === s ? "#34D399" : "#9EB3A8",
                  fontWeight: activeSubject === s ? 600 : 500,
                  padding: "4px 14px", fontSize: "12px", cursor: "pointer",
                  transition: "all 0.2s",
                }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ color: "#9EB3A8", fontSize: "12px", fontWeight: 600 }}>Difficulty:</span>
            <button onClick={() => setActiveDifficulty(null)} style={{
              background: !activeDifficulty ? "rgba(16, 185, 129, 0.15)" : "#111E1A",
              border: `1px solid ${!activeDifficulty ? "#10B981" : "#1F3830"}`,
              borderRadius: "999px", color: !activeDifficulty ? "#34D399" : "#9EB3A8",
              fontWeight: !activeDifficulty ? 600 : 500,
              padding: "4px 14px", fontSize: "12px", cursor: "pointer",
              transition: "all 0.2s",
            }}>All</button>
            {["easy", "medium", "hard"].map(d => {
              const dc = difficultyConfig[d as keyof typeof difficultyConfig];
              const isSel = activeDifficulty === d;
              return (
                <button key={d} onClick={() => setActiveDifficulty(isSel ? null : d)} style={{
                  background: isSel ? dc.bg : "#111E1A",
                  border: `1px solid ${isSel ? dc.color : "#1F3830"}`,
                  borderRadius: "999px", color: isSel ? dc.color : "#9EB3A8",
                  fontWeight: isSel ? 600 : 500,
                  padding: "4px 14px", fontSize: "12px", cursor: "pointer",
                  transition: "all 0.2s",
                }}>
                  {dc.icon} {dc.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#9EB3A8", padding: "80px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
            Loading revision materials...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px",
            background: "#111E1A", border: "1.5px dashed #1F3830", borderRadius: "20px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>📚</div>
            <p style={{ fontSize: "18px", fontWeight: 600, color: "#F0FDF4", marginBottom: "8px" }}>
              No exam memories yet
            </p>
            <p style={{ fontSize: "14px", color: "#9EB3A8" }}>
              Upload notes with "Exam Revision" category to get started
            </p>
          </div>
        ) : mode === "cards" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {filtered.map((memory) => {
              const dc = difficultyConfig[memory.difficulty as keyof typeof difficultyConfig];
              const isReviewed = reviewedIds.has(memory.id);
              return (
                <div key={memory.id} style={{
                  background: "#111E1A",
                  border: "1px solid #1F3830",
                  borderRadius: "16px",
                  padding: "22px",
                  transition: "all 0.25s", position: "relative",
                  overflow: "hidden", opacity: isReviewed ? 0.8 : 1,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#10B981";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(16,185,129,0.15)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#1F3830";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";
                  }}
                >
                  {/* Top accent */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                    background: dc ? dc.color : "#059669",
                  }} />

                  {/* Header badges */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {memory.subject && (
                        <span style={{
                          background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)",
                          color: "#34D399", fontSize: "11px", padding: "2px 8px",
                          borderRadius: "999px", fontWeight: 600,
                        }}>
                          📖 {memory.subject}
                        </span>
                      )}
                      {dc && (
                        <span style={{
                          background: dc.bg, border: `1px solid ${dc.border}`,
                          color: dc.color, fontSize: "11px", padding: "2px 8px",
                          borderRadius: "999px", fontWeight: 600,
                        }}>
                          {dc.icon} {dc.label}
                        </span>
                      )}
                    </div>
                    {isReviewed && (
                      <span style={{
                        background: "rgba(16, 185, 129, 0.15)", border: "1px solid #1F3830",
                        color: "#34D399", fontSize: "10px", padding: "2px 8px", borderRadius: "999px",
                        fontWeight: 600,
                      }}>✓ Reviewed</span>
                    )}
                  </div>

                  <h3 style={{ color: "#F0FDF4", fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>
                    {memory.title}
                  </h3>

                  <p style={{
                    color: "#9EB3A8", fontSize: "13px", lineHeight: 1.6, marginBottom: "12px",
                    display: "-webkit-box", WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {memory.content}
                  </p>

                  {/* AI Explanation */}
                  {memory.explanation && (
                    <div style={{
                      background: "#0E1915", border: "1px solid #1F3830",
                      borderRadius: "10px", padding: "12px", marginBottom: "14px",
                    }}>
                      <p style={{ color: "#34D399", fontSize: "10px", fontWeight: 700, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        🤖 AI Explanation ({memory.difficulty})
                      </p>
                      <p style={{ color: "#9EB3A8", fontSize: "12px", lineHeight: 1.6, margin: 0 }}>
                        {memory.explanation}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginTop: "auto" }}>
                    <span style={{ color: "#5D756C", fontSize: "11px" }}>
                      {(memory.review_count || 0) > 0 ? `reviewed ${memory.review_count}×` : "not reviewed yet"}
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {/* Quiz button */}
                      <button
                        onClick={() => router.push(`/quiz?id=${memory.id}`)}
                        style={{
                          background: "#172923",
                          border: "1px solid #1F3830",
                          color: "#34D399", borderRadius: "8px",
                          padding: "6px 12px", fontSize: "12px",
                          fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(16, 185, 129, 0.2)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#10B981"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#172923"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#1F3830"; }}
                      >
                        🧠 Quiz
                      </button>

                      {/* Review button */}
                      <button
                        onClick={() => handleReview(memory.id)}
                        disabled={isReviewed}
                        style={{
                          background: isReviewed ? "rgba(16, 185, 129, 0.15)" : "#059669",
                          border: `1px solid ${isReviewed ? "#1F3830" : "transparent"}`,
                          color: isReviewed ? "#34D399" : "#FFFFFF",
                          borderRadius: "8px", padding: "6px 12px",
                          fontSize: "12px", fontWeight: 600,
                          cursor: isReviewed ? "default" : "pointer",
                          transition: "all 0.2s",
                          boxShadow: !isReviewed ? "0 2px 8px rgba(16,185,129,0.3)" : "none",
                        }}
                        onMouseEnter={e => { if (!isReviewed) (e.currentTarget as HTMLButtonElement).style.background = "#10B981"; }}
                        onMouseLeave={e => { if (!isReviewed) (e.currentTarget as HTMLButtonElement).style.background = "#059669"; }}
                      >
                        {isReviewed ? "✓ Done" : "Mark reviewed"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Flashcard mode */
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            {/* Progress */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <span style={{ color: "#9EB3A8", fontSize: "13px", fontWeight: 500 }}>
                Card {flashcardIndex + 1} of {filtered.length}
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
                {filtered.map((_, i) => (
                  <div key={i} style={{
                    width: i === flashcardIndex ? "20px" : "8px",
                    height: "8px", borderRadius: "999px",
                    background: i < flashcardIndex ? "#059669" : i === flashcardIndex ? "#10B981" : "#1F3830",
                    transition: "all 0.3s",
                  }} />
                ))}
              </div>
              <span style={{ color: "#9EB3A8", fontSize: "13px", fontWeight: 600 }}>
                {Math.round((flashcardIndex / filtered.length) * 100)}%
              </span>
            </div>

            {currentCard && (
              <>
                {/* Flashcard */}
                <div
                  onClick={() => setFlipped(!flipped)}
                  style={{
                    background: flipped ? "#0E1915" : "#111E1A",
                    border: `1.5px solid ${flipped ? "#10B981" : "#1F3830"}`,
                    borderRadius: "20px",
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
                      ? "0 8px 30px rgba(0,0,0,0.6), 0 0 25px rgba(16,185,129,0.15)"
                      : "0 4px 20px rgba(0,0,0,0.5)",
                  }}
                >
                  <div style={{
                    position: "absolute", top: "16px", right: "16px",
                    background: flipped ? "rgba(16, 185, 129, 0.15)" : "#0E1915",
                    border: `1px solid ${flipped ? "#10B981" : "#1F3830"}`,
                    borderRadius: "8px", padding: "4px 10px",
                    color: flipped ? "#34D399" : "#9EB3A8",
                    fontSize: "11px", fontWeight: 600,
                  }}>
                    {flipped ? "Answer" : "Question"}
                  </div>

                  {currentCard.difficulty && (
                    <span style={{
                      background: difficultyConfig[currentCard.difficulty as keyof typeof difficultyConfig]?.bg || "rgba(16,185,129,0.15)",
                      border: `1px solid ${difficultyConfig[currentCard.difficulty as keyof typeof difficultyConfig]?.border || "#1F3830"}`,
                      color: difficultyConfig[currentCard.difficulty as keyof typeof difficultyConfig]?.color || "#34D399",
                      fontSize: "11px", padding: "3px 10px", borderRadius: "999px",
                      fontWeight: 600,
                    }}>
                      {difficultyConfig[currentCard.difficulty as keyof typeof difficultyConfig]?.icon} {currentCard.difficulty}
                    </span>
                  )}

                  {!flipped ? (
                    <>
                      <h3 style={{ color: "#F0FDF4", fontSize: "22px", fontWeight: 700, lineHeight: 1.3 }}>
                        {currentCard.title}
                      </h3>
                      {currentCard.subject && (
                        <span style={{ color: "#9EB3A8", fontSize: "13px" }}>📖 {currentCard.subject}</span>
                      )}
                      <p style={{ color: "#5D756C", fontSize: "13px", marginTop: "8px" }}>
                        Tap to reveal answer
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ color: "#F0FDF4", fontSize: "15px", lineHeight: 1.7, maxWidth: "500px" }}>
                        {currentCard.content}
                      </p>
                      {currentCard.explanation && (
                        <div style={{
                          background: "#0E1915", border: "1px solid #1F3830",
                          borderRadius: "10px", padding: "14px", maxWidth: "500px", width: "100%",
                        }}>
                          <p style={{ color: "#34D399", fontSize: "10px", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase" }}>
                            🤖 AI Explanation
                          </p>
                          <p style={{ color: "#9EB3A8", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
                            {currentCard.explanation}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Navigation */}
                <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={() => { setFlashcardIndex(Math.max(0, flashcardIndex - 1)); setFlipped(false); }}
                    disabled={flashcardIndex === 0}
                    style={{
                      background: "#111E1A", border: "1px solid #1F3830",
                      borderRadius: "12px", padding: "12px 20px",
                      color: flashcardIndex === 0 ? "#5D756C" : "#9EB3A8",
                      fontSize: "14px", cursor: flashcardIndex === 0 ? "not-allowed" : "pointer",
                      fontWeight: 600, transition: "all 0.2s",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    }}
                  >
                    ← Previous
                  </button>

                  {/* Quiz button in flashcard mode */}
                  <button
                    onClick={() => router.push(`/quiz?id=${currentCard.id}`)}
                    style={{
                      background: "#172923",
                      border: "1px solid #1F3830",
                      borderRadius: "12px", padding: "12px 20px",
                      color: "#34D399", fontSize: "14px",
                      cursor: "pointer", fontWeight: 600, transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(16, 185, 129, 0.2)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#172923"; }}
                  >
                    🧠 Quiz
                  </button>

                  <button
                    onClick={() => handleReview(currentCard.id)}
                    style={{
                      background: reviewedIds.has(currentCard.id) ? "rgba(16, 185, 129, 0.15)" : "#111E1A",
                      border: `1px solid ${reviewedIds.has(currentCard.id) ? "#10B981" : "#1F3830"}`,
                      borderRadius: "12px", padding: "12px 20px",
                      color: reviewedIds.has(currentCard.id) ? "#34D399" : "#F0FDF4",
                      fontSize: "14px", cursor: "pointer", fontWeight: 600, transition: "all 0.2s",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
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
                      background: flashcardIndex === filtered.length - 1
                        ? "#1F3830"
                        : "#059669",
                      border: "none", borderRadius: "12px", padding: "12px 20px",
                      color: flashcardIndex === filtered.length - 1 ? "#5D756C" : "white",
                      fontSize: "14px",
                      cursor: flashcardIndex === filtered.length - 1 ? "not-allowed" : "pointer",
                      fontWeight: 600, transition: "all 0.2s",
                      boxShadow: flashcardIndex < filtered.length - 1 ? "0 2px 10px rgba(16,185,129,0.3)" : "none",
                    }}
                    onMouseEnter={e => { if (flashcardIndex < filtered.length - 1) (e.currentTarget as HTMLButtonElement).style.background = "#10B981"; }}
                    onMouseLeave={e => { if (flashcardIndex < filtered.length - 1) (e.currentTarget as HTMLButtonElement).style.background = "#059669"; }}
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
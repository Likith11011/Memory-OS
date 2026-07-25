"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/api";

interface Topic {
  name: string;
  importance: "high" | "medium" | "low";
  description: string;
  subtopics: string[];
}

interface Phase {
  phase: number;
  title: string;
  duration: string;
  description: string;
  topics: Topic[];
}

interface Resource {
  title: string;
  type: string;
  description: string;
  free: boolean;
}

interface Roadmap {
  job_title: string;
  experience_level: string;
  overview: string;
  phases: Phase[];
  timeline: string;
  resources: Resource[];
  salary_range: string;
}

const EXPERIENCE_LEVELS = [
  { id: "fresher", label: "Fresher", desc: "0 experience, just graduated", icon: "🌱" },
  { id: "junior", label: "Junior", desc: "0-2 years experience", icon: "🚀" },
  { id: "mid", label: "Mid-level", desc: "2-5 years experience", icon: "⚡" },
  { id: "senior", label: "Senior", desc: "5+ years experience", icon: "🏆" },
];

const IMPORTANCE_CONFIG = {
  high: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", label: "Must Know" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", label: "Good to Know" },
  low: { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", label: "Nice to Have" },
};

const TYPE_ICONS: Record<string, string> = {
  course: "🎓", book: "📚", platform: "💻", youtube: "▶️", website: "🌐",
};

export default function RoadmapPage() {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("fresher");
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [popularJobs, setPopularJobs] = useState<string[]>([]);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchPopularJobs();
  }, []);

  const fetchPopularJobs = async () => {
    try {
      const res = await api.get("/roadmap/popular-jobs");
      setPopularJobs(res.data.jobs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const generateRoadmap = async () => {
    if (!jobTitle.trim()) { setError("Please enter a job title"); return; }
    setError("");
    setLoading(true);
    setRoadmap(null);

    try {
      const res = await api.post("/roadmap/generate", {
        job_title: jobTitle.trim(),
        experience_level: experienceLevel,
      }, { timeout: 60000 });
      setRoadmap(res.data);
      setExpandedPhase(0);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate roadmap. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const glass = {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
  };

  const phaseColors = ["#2563EB", "#7C3AED", "#059669", "#D97706"];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #0A1224, #0d1530)", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: "240px", flex: 1, padding: "28px", width: "calc(100% - 240px)", boxSizing: "border-box", overflowX: "hidden" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#F8FAFC", letterSpacing: "-0.02em", marginBottom: "4px" }}>
            🗺️ Learning Roadmap
          </h2>
          <p style={{ color: "#475569", fontSize: "14px" }}>
            Enter your target job title and get a complete topic-by-topic study plan
          </p>
        </div>

        {/* Input section */}
        <div style={{ ...glass, padding: "24px", marginBottom: "24px" }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#94A3B8", fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Target Job Title
            </label>
            <input
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generateRoadmap()}
              placeholder="e.g. Machine Learning Engineer, Backend Developer..."
              style={{
                width: "100%", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
                padding: "12px 16px", color: "#F8FAFC", fontSize: "14px",
                outline: "none", boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(37,99,235,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          {/* Popular job suggestions */}
          {popularJobs.length > 0 && !roadmap && (
            <div style={{ marginBottom: "20px" }}>
              <p style={{ color: "#334155", fontSize: "11px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Quick Pick
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {popularJobs.slice(0, 8).map(job => (
                  <button key={job} onClick={() => setJobTitle(job)} style={{
                    background: jobTitle === job ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${jobTitle === job ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "999px", padding: "4px 12px",
                    color: jobTitle === job ? "#60A5FA" : "#475569",
                    fontSize: "12px", cursor: "pointer", transition: "all 0.2s",
                  }}>
                    {job}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Experience level */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#94A3B8", fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Experience Level
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {EXPERIENCE_LEVELS.map(level => (
                <button key={level.id} onClick={() => setExperienceLevel(level.id)} style={{
                  background: experienceLevel === level.id ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${experienceLevel === level.id ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: "12px", padding: "12px 8px",
                  cursor: "pointer", transition: "all 0.2s",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                }}>
                  <span style={{ fontSize: "20px" }}>{level.icon}</span>
                  <span style={{ color: experienceLevel === level.id ? "#60A5FA" : "#94A3B8", fontSize: "12px", fontWeight: 600 }}>
                    {level.label}
                  </span>
                  <span style={{ color: "#334155", fontSize: "10px", textAlign: "center" }}>
                    {level.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "10px", padding: "10px 14px",
              color: "#f87171", fontSize: "13px", marginBottom: "16px",
            }}>
              ⚠ {error}
            </div>
          )}

          <button
            onClick={generateRoadmap}
            disabled={loading || !jobTitle.trim()}
            style={{
              width: "100%",
              background: loading || !jobTitle.trim()
                ? "rgba(37,99,235,0.3)"
                : "linear-gradient(135deg, #2563EB, #1d4ed8)",
              border: "none", borderRadius: "12px", padding: "14px",
              color: loading || !jobTitle.trim() ? "rgba(255,255,255,0.4)" : "white",
              fontSize: "14px", fontWeight: 600,
              cursor: loading || !jobTitle.trim() ? "not-allowed" : "pointer",
              boxShadow: !loading && jobTitle.trim() ? "0 0 20px rgba(37,99,235,0.3)" : "none",
              transition: "all 0.2s",
            }}
          >
            {loading ? "⚡ Generating your roadmap..." : "🗺️ Generate Learning Roadmap"}
          </button>
        </div>

        {/* Roadmap result */}
        {roadmap && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Overview card */}
            <div style={{ ...glass, padding: "24px", background: "rgba(37,99,235,0.06)", borderColor: "rgba(37,99,235,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ color: "#F8FAFC", fontSize: "20px", fontWeight: 700, margin: 0 }}>
                    {roadmap.job_title}
                  </h3>
                  <p style={{ color: "#60A5FA", fontSize: "13px", margin: "4px 0 0", textTransform: "capitalize" }}>
                    {roadmap.experience_level} level roadmap
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{
                    background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                    borderRadius: "10px", padding: "8px 14px", textAlign: "center",
                  }}>
                    <p style={{ color: "#475569", fontSize: "10px", textTransform: "uppercase", margin: 0 }}>Timeline</p>
                    <p style={{ color: "#10b981", fontSize: "13px", fontWeight: 700, margin: 0 }}>{roadmap.timeline}</p>
                  </div>
                  <div style={{
                    background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
                    borderRadius: "10px", padding: "8px 14px", textAlign: "center",
                  }}>
                    <p style={{ color: "#475569", fontSize: "10px", textTransform: "uppercase", margin: 0 }}>Salary (India)</p>
                    <p style={{ color: "#f59e0b", fontSize: "13px", fontWeight: 700, margin: 0 }}>{roadmap.salary_range}</p>
                  </div>
                </div>
              </div>
              <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
                {roadmap.overview}
              </p>
            </div>

            {/* Phase navigator */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
              {roadmap.phases.map((phase, i) => (
                <button key={i} onClick={() => setExpandedPhase(expandedPhase === i ? null : i)} style={{
                  background: expandedPhase === i ? `${phaseColors[i % phaseColors.length]}22` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${expandedPhase === i ? phaseColors[i % phaseColors.length] + "44" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "12px", padding: "10px 18px",
                  cursor: "pointer", whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: "8px",
                }}>
                  <span style={{
                    width: "22px", height: "22px", borderRadius: "50%",
                    background: phaseColors[i % phaseColors.length],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: "11px", fontWeight: 700, flexShrink: 0,
                  }}>{phase.phase}</span>
                  <span style={{ color: expandedPhase === i ? "#F8FAFC" : "#64748B", fontSize: "13px", fontWeight: 500 }}>
                    {phase.title}
                  </span>
                  <span style={{ color: "#334155", fontSize: "11px" }}>{phase.duration}</span>
                </button>
              ))}
            </div>

            {/* Expanded phase */}
            {expandedPhase !== null && roadmap.phases[expandedPhase] && (() => {
              const phase = roadmap.phases[expandedPhase];
              const color = phaseColors[expandedPhase % phaseColors.length];
              return (
                <div style={{ ...glass, padding: "24px", borderColor: `${color}33` }}>
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "12px",
                      background: `${color}22`, border: `1px solid ${color}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color, fontSize: "18px", fontWeight: 700, flexShrink: 0,
                    }}>{phase.phase}</div>
                    <div>
                      <h3 style={{ color: "#F8FAFC", fontSize: "18px", fontWeight: 700, margin: 0 }}>
                        {phase.title}
                      </h3>
                      <p style={{ color, fontSize: "12px", margin: "2px 0 0" }}>⏱ {phase.duration}</p>
                    </div>
                  </div>
                  <p style={{ color: "#64748B", fontSize: "13px", lineHeight: 1.6, marginBottom: "20px" }}>
                    {phase.description}
                  </p>

                  {/* Topics */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {phase.topics.map((topic, ti) => {
                      const imp = IMPORTANCE_CONFIG[topic.importance] || IMPORTANCE_CONFIG.medium;
                      const topicKey = `${expandedPhase}-${ti}`;
                      const isExpanded = expandedTopic === topicKey;

                      return (
                        <div key={ti} style={{
                          background: "rgba(255,255,255,0.03)",
                          border: `1px solid ${isExpanded ? color + "33" : "rgba(255,255,255,0.06)"}`,
                          borderRadius: "12px", overflow: "hidden",
                          transition: "border-color 0.2s",
                        }}>
                          <div
                            onClick={() => setExpandedTopic(isExpanded ? null : topicKey)}
                            style={{
                              padding: "14px 18px", cursor: "pointer",
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ color: "#F8FAFC", fontSize: "14px", fontWeight: 600 }}>
                                {topic.name}
                              </span>
                              <span style={{
                                background: imp.bg, border: `1px solid ${imp.border}`,
                                color: imp.color, fontSize: "10px", fontWeight: 600,
                                padding: "2px 8px", borderRadius: "999px",
                              }}>
                                {imp.label}
                              </span>
                            </div>
                            <span style={{ color: "#334155", fontSize: "16px" }}>
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>

                          {isExpanded && (
                            <div style={{ padding: "0 18px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                              <p style={{ color: "#64748B", fontSize: "13px", lineHeight: 1.6, marginBottom: "12px", paddingTop: "12px" }}>
                                {topic.description}
                              </p>
                              <p style={{ color: "#334155", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                                What to learn:
                              </p>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {topic.subtopics.map((sub, si) => (
                                  <span key={si} style={{
                                    background: `${color}12`,
                                    border: `1px solid ${color}28`,
                                    color: "#94A3B8", borderRadius: "8px",
                                    padding: "4px 10px", fontSize: "12px",
                                  }}>
                                    {sub}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Resources */}
            {roadmap.resources.length > 0 && (
              <div style={{ ...glass, padding: "24px" }}>
                <h3 style={{ color: "#F8FAFC", fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>
                  📚 Recommended Resources
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                  {roadmap.resources.map((res, i) => (
                    <div key={i} style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "12px", padding: "14px 16px",
                      display: "flex", flexDirection: "column", gap: "6px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "16px" }}>
                            {TYPE_ICONS[res.type.toLowerCase()] || "📌"}
                          </span>
                          <span style={{ color: "#F8FAFC", fontSize: "13px", fontWeight: 600 }}>
                            {res.title}
                          </span>
                        </div>
                        {res.free && (
                          <span style={{
                            background: "rgba(16,185,129,0.1)",
                            border: "1px solid rgba(16,185,129,0.25)",
                            color: "#10b981", fontSize: "10px",
                            fontWeight: 700, padding: "2px 8px",
                            borderRadius: "999px", flexShrink: 0,
                          }}>FREE</span>
                        )}
                      </div>
                      <span style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#475569", fontSize: "10px",
                        padding: "2px 8px", borderRadius: "6px",
                        width: "fit-content", textTransform: "capitalize",
                      }}>
                        {res.type}
                      </span>
                      <p style={{ color: "#64748B", fontSize: "12px", lineHeight: 1.5, margin: 0 }}>
                        {res.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Try another */}
            <button
              onClick={() => { setRoadmap(null); setJobTitle(""); }}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px", padding: "12px",
                color: "#475569", fontSize: "14px",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              Generate another roadmap →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
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
  high: { color: "#F87171", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)", label: "Must Know" },
  medium: { color: "#FBBF24", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)", label: "Good to Know" },
  low: { color: "#34D399", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)", label: "Nice to Have" },
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

  const phaseColors = ["#10B981", "#34D399", "#38BDF8", "#FBBF24"];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#09110E", color: "#F0FDF4", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: "250px", flex: 1, padding: "32px 40px", width: "calc(100% - 250px)", boxSizing: "border-box", overflowX: "hidden" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#F0FDF4", letterSpacing: "-0.02em", marginBottom: "4px" }}>
            🗺️ Learning Roadmap
          </h2>
          <p style={{ color: "#9EB3A8", fontSize: "14px" }}>
            Enter your target job title and get a structured, step-by-step curriculum generated for your career goals
          </p>
        </div>

        {/* Input section */}
        <div style={{ background: "#111E1A", border: "1px solid #1F3830", borderRadius: "16px", padding: "28px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#F0FDF4", fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Target Job Title
            </label>
            <input
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generateRoadmap()}
              placeholder="e.g. Machine Learning Engineer, Backend Developer, Product Manager..."
              style={{
                width: "100%", background: "#0E1915",
                border: "1.5px solid #1F3830", borderRadius: "12px",
                padding: "13px 18px", color: "#F0FDF4", fontSize: "14px",
                outline: "none", boxSizing: "border-box", transition: "all 0.2s",
              }}
              onFocus={e => { e.target.style.borderColor = "#10B981"; e.target.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.15)"; }}
              onBlur={e => { e.target.style.borderColor = "#1F3830"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Popular job suggestions */}
          {popularJobs.length > 0 && !roadmap && (
            <div style={{ marginBottom: "20px" }}>
              <p style={{ color: "#9EB3A8", fontSize: "11px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                Quick Suggestions
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {popularJobs.slice(0, 8).map(job => (
                  <button key={job} onClick={() => setJobTitle(job)} style={{
                    background: jobTitle === job ? "rgba(16, 185, 129, 0.15)" : "#0E1915",
                    border: `1px solid ${jobTitle === job ? "#10B981" : "#1F3830"}`,
                    borderRadius: "999px", padding: "5px 14px",
                    color: jobTitle === job ? "#34D399" : "#9EB3A8",
                    fontSize: "12px", cursor: "pointer", transition: "all 0.2s",
                    fontWeight: jobTitle === job ? 600 : 500,
                  }}>
                    {job}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Experience level */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#F0FDF4", fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Experience Level
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
              {EXPERIENCE_LEVELS.map(level => {
                const isSel = experienceLevel === level.id;
                return (
                  <button key={level.id} onClick={() => setExperienceLevel(level.id)} style={{
                    background: isSel ? "rgba(16, 185, 129, 0.15)" : "#0E1915",
                    border: `1.5px solid ${isSel ? "#10B981" : "#1F3830"}`,
                    borderRadius: "12px", padding: "14px 10px",
                    cursor: "pointer", transition: "all 0.2s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                    boxShadow: isSel ? "0 2px 8px rgba(16,185,129,0.2)" : "none",
                  }}>
                    <span style={{ fontSize: "22px" }}>{level.icon}</span>
                    <span style={{ color: isSel ? "#34D399" : "#F0FDF4", fontSize: "13px", fontWeight: 600 }}>
                      {level.label}
                    </span>
                    <span style={{ color: isSel ? "#A7F3D0" : "#5D756C", fontSize: "11px", textAlign: "center" }}>
                      {level.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div style={{
              background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "10px", padding: "12px 16px",
              color: "#F87171", fontSize: "13px", marginBottom: "16px",
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
                ? "#2B473D"
                : "#059669",
              border: "none", borderRadius: "12px", padding: "15px",
              color: "white",
              fontSize: "14px", fontWeight: 600,
              cursor: loading || !jobTitle.trim() ? "not-allowed" : "pointer",
              boxShadow: !loading && jobTitle.trim() ? "0 2px 10px rgba(16,185,129,0.3)" : "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (!loading && jobTitle.trim()) e.currentTarget.style.background = "#10B981"; }}
            onMouseLeave={e => { if (!loading && jobTitle.trim()) e.currentTarget.style.background = "#059669"; }}
          >
            {loading ? "⚡ Generating your structured roadmap..." : "🗺️ Generate Learning Roadmap"}
          </button>
        </div>

        {/* Roadmap result */}
        {roadmap && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Overview card */}
            <div style={{ background: "#111E1A", border: "1px solid #1F3830", borderRadius: "16px", padding: "28px", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ color: "#F0FDF4", fontSize: "22px", fontWeight: 700, margin: 0 }}>
                    {roadmap.job_title}
                  </h3>
                  <p style={{ color: "#34D399", fontSize: "13px", margin: "4px 0 0", textTransform: "capitalize", fontWeight: 600 }}>
                    {roadmap.experience_level} Level Curriculum
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{
                    background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10B981",
                    borderRadius: "10px", padding: "8px 16px", textAlign: "center",
                  }}>
                    <p style={{ color: "#A7F3D0", fontSize: "10px", textTransform: "uppercase", margin: 0, fontWeight: 700 }}>Estimated Timeline</p>
                    <p style={{ color: "#34D399", fontSize: "14px", fontWeight: 700, margin: 0 }}>{roadmap.timeline}</p>
                  </div>
                  <div style={{
                    background: "rgba(245, 158, 11, 0.15)", border: "1px solid #F59E0B",
                    borderRadius: "10px", padding: "8px 16px", textAlign: "center",
                  }}>
                    <p style={{ color: "#FDE68A", fontSize: "10px", textTransform: "uppercase", margin: 0, fontWeight: 700 }}>Salary Expectation</p>
                    <p style={{ color: "#FBBF24", fontSize: "14px", fontWeight: 700, margin: 0 }}>{roadmap.salary_range}</p>
                  </div>
                </div>
              </div>
              <p style={{ color: "#9EB3A8", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
                {roadmap.overview}
              </p>
            </div>

            {/* Phase navigator */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
              {roadmap.phases.map((phase, i) => {
                const color = phaseColors[i % phaseColors.length];
                const isSel = expandedPhase === i;
                return (
                  <button key={i} onClick={() => setExpandedPhase(expandedPhase === i ? null : i)} style={{
                    background: isSel ? "#172923" : "#0E1915",
                    border: `1.5px solid ${isSel ? color : "#1F3830"}`,
                    borderRadius: "12px", padding: "10px 18px",
                    cursor: "pointer", whiteSpace: "nowrap",
                    display: "flex", alignItems: "center", gap: "8px",
                    boxShadow: isSel ? "0 2px 8px rgba(0,0,0,0.4)" : "none",
                    transition: "all 0.2s",
                  }}>
                    <span style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: isSel ? color : "#1F3830",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isSel ? "#09110E" : "#9EB3A8", fontSize: "11px", fontWeight: 700, flexShrink: 0,
                    }}>{phase.phase}</span>
                    <span style={{ color: isSel ? "#F0FDF4" : "#9EB3A8", fontSize: "13px", fontWeight: 600 }}>
                      {phase.title}
                    </span>
                    <span style={{ color: isSel ? "#34D399" : "#5D756C", fontSize: "11px" }}>{phase.duration}</span>
                  </button>
                );
              })}
            </div>

            {/* Expanded phase */}
            {expandedPhase !== null && roadmap.phases[expandedPhase] && (() => {
              const phase = roadmap.phases[expandedPhase];
              const color = phaseColors[expandedPhase % phaseColors.length];
              return (
                <div style={{ background: "#111E1A", border: `1.5px solid ${color}`, borderRadius: "16px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "12px",
                      background: "rgba(16, 185, 129, 0.15)", border: `1px solid rgba(16, 185, 129, 0.3)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#34D399", fontSize: "18px", fontWeight: 700, flexShrink: 0,
                    }}>{phase.phase}</div>
                    <div>
                      <h3 style={{ color: "#F0FDF4", fontSize: "18px", fontWeight: 700, margin: 0 }}>
                        {phase.title}
                      </h3>
                      <p style={{ color, fontSize: "13px", margin: "2px 0 0", fontWeight: 600 }}>⏱ {phase.duration}</p>
                    </div>
                  </div>
                  <p style={{ color: "#9EB3A8", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
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
                          background: "#0E1915",
                          border: `1px solid ${isExpanded ? "#10B981" : "#1F3830"}`,
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
                              <span style={{ color: "#F0FDF4", fontSize: "14px", fontWeight: 600 }}>
                                {topic.name}
                              </span>
                              <span style={{
                                background: imp.bg, border: `1px solid ${imp.border}`,
                                color: imp.color, fontSize: "10px", fontWeight: 700,
                                padding: "2px 8px", borderRadius: "999px",
                              }}>
                                {imp.label}
                              </span>
                            </div>
                            <span style={{ color: "#9EB3A8", fontSize: "14px" }}>
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>

                          {isExpanded && (
                            <div style={{ padding: "0 18px 16px", borderTop: "1px solid #1F3830", background: "#0B1612" }}>
                              <p style={{ color: "#9EB3A8", fontSize: "13px", lineHeight: 1.6, marginBottom: "12px", paddingTop: "12px" }}>
                                {topic.description}
                              </p>
                              <p style={{ color: "#34D399", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                                Key Concepts & Subtopics:
                              </p>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {topic.subtopics.map((sub, si) => (
                                  <span key={si} style={{
                                    background: "rgba(16, 185, 129, 0.15)",
                                    border: `1px solid rgba(16, 185, 129, 0.3)`,
                                    color: "#34D399", borderRadius: "8px",
                                    padding: "4px 10px", fontSize: "12px",
                                    fontWeight: 500,
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
              <div style={{ background: "#111E1A", border: "1px solid #1F3830", borderRadius: "16px", padding: "28px", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                <h3 style={{ color: "#F0FDF4", fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>
                  📚 Recommended Study Resources
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                  {roadmap.resources.map((res, i) => (
                    <div key={i} style={{
                      background: "#0E1915",
                      border: "1px solid #1F3830",
                      borderRadius: "12px", padding: "14px 16px",
                      display: "flex", flexDirection: "column", gap: "6px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "16px" }}>
                            {TYPE_ICONS[res.type.toLowerCase()] || "📌"}
                          </span>
                          <span style={{ color: "#F0FDF4", fontSize: "13px", fontWeight: 600 }}>
                            {res.title}
                          </span>
                        </div>
                        {res.free && (
                          <span style={{
                            background: "rgba(16, 185, 129, 0.15)",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            color: "#34D399", fontSize: "10px",
                            fontWeight: 700, padding: "2px 8px",
                            borderRadius: "999px", flexShrink: 0,
                          }}>FREE</span>
                        )}
                      </div>
                      <span style={{
                        background: "#172923",
                        border: "1px solid #1F3830",
                        color: "#9EB3A8", fontSize: "10px",
                        padding: "2px 8px", borderRadius: "6px",
                        width: "fit-content", textTransform: "capitalize",
                        fontWeight: 600,
                      }}>
                        {res.type}
                      </span>
                      <p style={{ color: "#9EB3A8", fontSize: "12px", lineHeight: 1.5, margin: 0 }}>
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
                background: "#172923",
                border: "1px solid #1F3830",
                borderRadius: "12px", padding: "14px",
                color: "#9EB3A8", fontSize: "14px", fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#10B981"; e.currentTarget.style.color = "#34D399"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#1F3830"; e.currentTarget.style.color = "#9EB3A8"; }}
            >
              ← Generate another career roadmap
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
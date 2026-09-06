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
  high: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", label: "Must Know" },
  medium: { color: "#D97706", bg: "#FEF3C7", border: "#FDE68A", label: "Good to Know" },
  low: { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", label: "Nice to Have" },
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

  const phaseColors = ["#059669", "#065F46", "#0284C7", "#D97706"];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAF9", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: "240px", flex: 1, padding: "32px 40px", width: "calc(100% - 240px)", boxSizing: "border-box", overflowX: "hidden" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#10231D", letterSpacing: "-0.02em", marginBottom: "4px" }}>
            🗺️ Learning Roadmap
          </h2>
          <p style={{ color: "#52635C", fontSize: "14px" }}>
            Enter your target job title and get a structured, step-by-step curriculum generated for your career goals
          </p>
        </div>

        {/* Input section */}
        <div style={{ background: "#FFFFFF", border: "1px solid #DDE7E2", borderRadius: "16px", padding: "28px", marginBottom: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#10231D", fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Target Job Title
            </label>
            <input
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generateRoadmap()}
              placeholder="e.g. Machine Learning Engineer, Backend Developer, Product Manager..."
              style={{
                width: "100%", background: "#FFFFFF",
                border: "1.5px solid #DDE7E2", borderRadius: "12px",
                padding: "13px 18px", color: "#10231D", fontSize: "14px",
                outline: "none", boxSizing: "border-box", transition: "all 0.2s",
              }}
              onFocus={e => { e.target.style.borderColor = "#059669"; e.target.style.boxShadow = "0 0 0 3px rgba(5,150,105,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "#DDE7E2"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Popular job suggestions */}
          {popularJobs.length > 0 && !roadmap && (
            <div style={{ marginBottom: "20px" }}>
              <p style={{ color: "#7A8A84", fontSize: "11px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                Quick Suggestions
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {popularJobs.slice(0, 8).map(job => (
                  <button key={job} onClick={() => setJobTitle(job)} style={{
                    background: jobTitle === job ? "#ECFDF5" : "#FFFFFF",
                    border: `1px solid ${jobTitle === job ? "#059669" : "#DDE7E2"}`,
                    borderRadius: "999px", padding: "5px 14px",
                    color: jobTitle === job ? "#065F46" : "#52635C",
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
            <label style={{ color: "#10231D", fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Experience Level
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
              {EXPERIENCE_LEVELS.map(level => {
                const isSel = experienceLevel === level.id;
                return (
                  <button key={level.id} onClick={() => setExperienceLevel(level.id)} style={{
                    background: isSel ? "#ECFDF5" : "#FFFFFF",
                    border: `1.5px solid ${isSel ? "#059669" : "#DDE7E2"}`,
                    borderRadius: "12px", padding: "14px 10px",
                    cursor: "pointer", transition: "all 0.2s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                    boxShadow: isSel ? "0 2px 8px rgba(5,150,105,0.12)" : "0 1px 3px rgba(0,0,0,0.02)",
                  }}>
                    <span style={{ fontSize: "22px" }}>{level.icon}</span>
                    <span style={{ color: isSel ? "#064E3B" : "#10231D", fontSize: "13px", fontWeight: 600 }}>
                      {level.label}
                    </span>
                    <span style={{ color: isSel ? "#065F46" : "#7A8A84", fontSize: "11px", textAlign: "center" }}>
                      {level.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: "10px", padding: "12px 16px",
              color: "#DC2626", fontSize: "13px", marginBottom: "16px",
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
                ? "#9CA3AF"
                : "#059669",
              border: "none", borderRadius: "12px", padding: "15px",
              color: "white",
              fontSize: "14px", fontWeight: 600,
              cursor: loading || !jobTitle.trim() ? "not-allowed" : "pointer",
              boxShadow: !loading && jobTitle.trim() ? "0 2px 8px rgba(5,150,105,0.25)" : "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (!loading && jobTitle.trim()) e.currentTarget.style.background = "#047857"; }}
            onMouseLeave={e => { if (!loading && jobTitle.trim()) e.currentTarget.style.background = "#059669"; }}
          >
            {loading ? "⚡ Generating your structured roadmap..." : "🗺️ Generate Learning Roadmap"}
          </button>
        </div>

        {/* Roadmap result */}
        {roadmap && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Overview card */}
            <div style={{ background: "#FFFFFF", border: "1px solid #DDE7E2", borderRadius: "16px", padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ color: "#10231D", fontSize: "22px", fontWeight: 700, margin: 0 }}>
                    {roadmap.job_title}
                  </h3>
                  <p style={{ color: "#059669", fontSize: "13px", margin: "4px 0 0", textTransform: "capitalize", fontWeight: 600 }}>
                    {roadmap.experience_level} Level Curriculum
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{
                    background: "#ECFDF5", border: "1px solid #A7F3D0",
                    borderRadius: "10px", padding: "8px 16px", textAlign: "center",
                  }}>
                    <p style={{ color: "#065F46", fontSize: "10px", textTransform: "uppercase", margin: 0, fontWeight: 700 }}>Estimated Timeline</p>
                    <p style={{ color: "#059669", fontSize: "14px", fontWeight: 700, margin: 0 }}>{roadmap.timeline}</p>
                  </div>
                  <div style={{
                    background: "#FEF3C7", border: "1px solid #FDE68A",
                    borderRadius: "10px", padding: "8px 16px", textAlign: "center",
                  }}>
                    <p style={{ color: "#92400E", fontSize: "10px", textTransform: "uppercase", margin: 0, fontWeight: 700 }}>Salary Expectation</p>
                    <p style={{ color: "#D97706", fontSize: "14px", fontWeight: 700, margin: 0 }}>{roadmap.salary_range}</p>
                  </div>
                </div>
              </div>
              <p style={{ color: "#52635C", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
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
                    background: isSel ? "#FFFFFF" : "#F1F5F3",
                    border: `1.5px solid ${isSel ? color : "#DDE7E2"}`,
                    borderRadius: "12px", padding: "10px 18px",
                    cursor: "pointer", whiteSpace: "nowrap",
                    display: "flex", alignItems: "center", gap: "8px",
                    boxShadow: isSel ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
                    transition: "all 0.2s",
                  }}>
                    <span style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: isSel ? color : "#DDE7E2",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isSel ? "white" : "#52635C", fontSize: "11px", fontWeight: 700, flexShrink: 0,
                    }}>{phase.phase}</span>
                    <span style={{ color: isSel ? "#10231D" : "#52635C", fontSize: "13px", fontWeight: 600 }}>
                      {phase.title}
                    </span>
                    <span style={{ color: "#7A8A84", fontSize: "11px" }}>{phase.duration}</span>
                  </button>
                );
              })}
            </div>

            {/* Expanded phase */}
            {expandedPhase !== null && roadmap.phases[expandedPhase] && (() => {
              const phase = roadmap.phases[expandedPhase];
              const color = phaseColors[expandedPhase % phaseColors.length];
              return (
                <div style={{ background: "#FFFFFF", border: `1.5px solid ${color}`, borderRadius: "16px", padding: "28px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "12px",
                      background: "#ECFDF5", border: `1px solid #A7F3D0`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#059669", fontSize: "18px", fontWeight: 700, flexShrink: 0,
                    }}>{phase.phase}</div>
                    <div>
                      <h3 style={{ color: "#10231D", fontSize: "18px", fontWeight: 700, margin: 0 }}>
                        {phase.title}
                      </h3>
                      <p style={{ color, fontSize: "13px", margin: "2px 0 0", fontWeight: 600 }}>⏱ {phase.duration}</p>
                    </div>
                  </div>
                  <p style={{ color: "#52635C", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
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
                          background: "#F8FAF9",
                          border: `1px solid ${isExpanded ? "#059669" : "#DDE7E2"}`,
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
                              <span style={{ color: "#10231D", fontSize: "14px", fontWeight: 600 }}>
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
                            <span style={{ color: "#7A8A84", fontSize: "14px" }}>
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>

                          {isExpanded && (
                            <div style={{ padding: "0 18px 16px", borderTop: "1px solid #DDE7E2", background: "#FFFFFF" }}>
                              <p style={{ color: "#52635C", fontSize: "13px", lineHeight: 1.6, marginBottom: "12px", paddingTop: "12px" }}>
                                {topic.description}
                              </p>
                              <p style={{ color: "#064E3B", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                                Key Concepts & Subtopics:
                              </p>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {topic.subtopics.map((sub, si) => (
                                  <span key={si} style={{
                                    background: "#ECFDF5",
                                    border: `1px solid #A7F3D0`,
                                    color: "#065F46", borderRadius: "8px",
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
              <div style={{ background: "#FFFFFF", border: "1px solid #DDE7E2", borderRadius: "16px", padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <h3 style={{ color: "#10231D", fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>
                  📚 Recommended Study Resources
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                  {roadmap.resources.map((res, i) => (
                    <div key={i} style={{
                      background: "#F8FAF9",
                      border: "1px solid #DDE7E2",
                      borderRadius: "12px", padding: "14px 16px",
                      display: "flex", flexDirection: "column", gap: "6px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "16px" }}>
                            {TYPE_ICONS[res.type.toLowerCase()] || "📌"}
                          </span>
                          <span style={{ color: "#10231D", fontSize: "13px", fontWeight: 600 }}>
                            {res.title}
                          </span>
                        </div>
                        {res.free && (
                          <span style={{
                            background: "#ECFDF5",
                            border: "1px solid #A7F3D0",
                            color: "#059669", fontSize: "10px",
                            fontWeight: 700, padding: "2px 8px",
                            borderRadius: "999px", flexShrink: 0,
                          }}>FREE</span>
                        )}
                      </div>
                      <span style={{
                        background: "#FFFFFF",
                        border: "1px solid #DDE7E2",
                        color: "#52635C", fontSize: "10px",
                        padding: "2px 8px", borderRadius: "6px",
                        width: "fit-content", textTransform: "capitalize",
                        fontWeight: 600,
                      }}>
                        {res.type}
                      </span>
                      <p style={{ color: "#52635C", fontSize: "12px", lineHeight: 1.5, margin: 0 }}>
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
                background: "#FFFFFF",
                border: "1px solid #DDE7E2",
                borderRadius: "12px", padding: "14px",
                color: "#52635C", fontSize: "14px", fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#059669"; e.currentTarget.style.color = "#064E3B"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#DDE7E2"; e.currentTarget.style.color = "#52635C"; }}
            >
              ← Generate another career roadmap
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
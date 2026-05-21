export function MemoryCardSkeleton() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "16px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <div className="skeleton" style={{ width: "32px", height: "32px", borderRadius: "8px" }} />
        <div className="skeleton" style={{ width: "60px", height: "14px" }} />
      </div>
      <div className="skeleton" style={{ width: "75%", height: "16px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div className="skeleton" style={{ width: "100%", height: "12px" }} />
        <div className="skeleton" style={{ width: "90%", height: "12px" }} />
        <div className="skeleton" style={{ width: "60%", height: "12px" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="skeleton" style={{ width: "80px", height: "11px" }} />
        <div style={{ display: "flex", gap: "6px" }}>
          <div className="skeleton" style={{ width: "50px", height: "20px", borderRadius: "999px" }} />
          <div className="skeleton" style={{ width: "50px", height: "20px", borderRadius: "999px" }} />
        </div>
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "12px",
      padding: "16px 12px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
    }}>
      <div className="skeleton" style={{ width: "40px", height: "10px" }} />
      <div className="skeleton" style={{ width: "32px", height: "28px" }} />
    </div>
  );
}
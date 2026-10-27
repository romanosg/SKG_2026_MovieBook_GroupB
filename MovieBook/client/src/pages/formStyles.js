// Shared styles for the pages
const formStyles = {
  page: {
    width: "100%",
    boxSizing: "border-box",
    color: "var(--page-text)",
    padding: 24,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
  title: { margin: "0 0 20px", fontSize: 24, fontWeight: 600 },
  form: { display: "flex", flexDirection: "column", gap: 14, maxWidth: 360 },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 14 },
  input: {
    boxSizing: "border-box",
    background: "var(--page-surface)",
    color: "var(--page-text)",
    border: "1px solid var(--page-border)",
    borderRadius: 6,
    padding: "10px 12px",
    fontSize: 14,
  },
  authTitle: {
    margin: "0 0 20px",
    fontSize: 24,
    fontWeight: 600,
    textAlign: "center",
  },
  authForm: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    width: 360,
    maxWidth: "100%",
    margin: "0 auto",
  },
  hint: { fontSize: 12, color: "var(--page-text-muted)" },
  error: { fontSize: 12, color: "var(--page-danger-text)" },
  button: {
    background: "var(--page-accent)",
    color: "var(--page-text-on-accent)",
    border: "none",
    borderRadius: 6,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default formStyles;

import React, { useEffect, useRef, useState } from "react";

const styles = {
  card: {
    background: "#242424",
    color: "#e8e8e8",
    borderLeft: "3px solid #4a4a4a",
    padding: "20px 24px",
    flex: 1,
    width: "100%",
    boxSizing: "border-box",
    textAlign: "left",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    fontSize: 14,
    lineHeight: 1.5,
  },
  heading: {
    margin: "0 0 20px",
    fontSize: 20,
    fontWeight: 600,
  },
  photoRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#8b95a7",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    padding: 0,
    border: "none",
    cursor: "pointer",
    overflow: "hidden",
    flexShrink: 0,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  linkButton: {
    background: "none",
    border: "none",
    padding: 0,
    color: "#8ab4f8",
    cursor: "pointer",
    font: "inherit",
    textDecoration: "underline",
  },
  hint: { fontSize: 12, color: "#9a9a9a", marginTop: 2 },
  row: { margin: "0 0 12px" },
  aboutHeading: { margin: "24px 0 8px", fontSize: 16, fontWeight: 700 },
  aboutInput: {
    display: "block",
    width: "100%",
    minHeight: 280,
    boxSizing: "border-box",
    background: "#1b1b1b",
    color: "#e8e8e8",
    border: "1px solid #4a4a4a",
    borderRadius: 6,
    padding: "10px 12px",
    font: "inherit",
    lineHeight: 1.5,
    resize: "none",
    overflow: "hidden",
    tabSize: 4,
  },
  label: { fontWeight: 700, marginRight: 4 },
};

const MAX_SIZE_MB = 5;

export default function Profile({
  name = "Original",
  email = "originalemail@gmail.com",
  age = 44,
  avatarUrl = "",
  about: initialAbout = "",
  onAboutChange, // optional: called with the new About me text
  onPhotoChange, // optional: called with the new photo as a data URL
}) {
  const [photo, setPhoto] = useState(avatarUrl);
  const [about, setAbout] = useState(initialAbout);
  const aboutRef = useRef(null);

  // Grow the About me box to fit its text (never smaller than minHeight)
  const fitAbout = () => {
    const el = aboutRef.current;
    if (!el) return;
    el.style.height = "auto";
    const borders = el.offsetHeight - el.clientHeight;
    el.style.height = `${el.scrollHeight + borders}px`;
  };

  useEffect(fitAbout, [about]); // whenever the text changes
  useEffect(() => {
    // text wraps differently when the window width changes
    window.addEventListener("resize", fitAbout);
    return () => window.removeEventListener("resize", fitAbout);
  }, []);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const initial = name.trim().charAt(0).toUpperCase();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_SIZE_MB} MB.`);
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      onPhotoChange?.(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const updateAbout = (value) => {
    setAbout(value);
    onAboutChange?.(value);
  };

  // Enter already makes a new line in a textarea.
  // Tab normally moves focus away, so insert a tab character instead.
  const handleAboutKeyDown = (e) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.target;
    const { selectionStart, selectionEnd, value } = el;
    updateAbout(value.slice(0, selectionStart) + "\t" + value.slice(selectionEnd));
    // put the cursor right after the inserted tab
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = selectionStart + 1;
    });
  };

  return (
    <section style={styles.card}>
      <h2 style={styles.heading}>Your Profile</h2>

      <div style={styles.photoRow}>
        <button
          type="button"
          style={styles.avatar}
          onClick={() => inputRef.current?.click()}
          aria-label="Change profile photo"
        >
          {photo ? (
            <img src={photo} alt={`${name}'s photo`} style={styles.avatarImg} />
          ) : (
            initial
          )}
        </button>

        <div>
          <button
            type="button"
            style={styles.linkButton}
            onClick={() => inputRef.current?.click()}
          >
            {photo ? "Change photo" : "Upload photo"}
          </button>
          <div style={styles.hint}>
            {error ? <span style={{ color: "#ff8a80" }}>{error}</span> : "JPG or PNG, up to 5 MB"}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: "none" }}
        />
      </div>

      <p style={styles.row}>
        <span style={styles.label}>Email:</span>
        {email}
      </p>
      <p style={styles.row}>
        <span style={styles.label}>Age:</span>
        {age}
      </p>

      <h3 style={styles.aboutHeading}>About me</h3>
      <textarea
        ref={aboutRef}
        style={styles.aboutInput}
        aria-label="About me"
        placeholder="Write something about yourself..."
        value={about}
        onChange={(e) => updateAbout(e.target.value)}
        onKeyDown={handleAboutKeyDown}
      />
    </section>
  );
}

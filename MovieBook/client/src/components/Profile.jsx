import React, { useRef, useState } from "react";

const styles = {
  card: {
    background: "#242424",
    color: "#e8e8e8",
    borderLeft: "3px solid #4a4a4a",
    padding: "20px 24px",
    maxWidth: 420,
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
  label: { fontWeight: 700, marginRight: 4 },
};

const MAX_SIZE_MB = 5;

export default function Profile({
  name = "Original",
  email = "originalemail@gmail.com",
  age = 44,
  avatarUrl = "",
  onPhotoChange, // optional: called with the new photo as a data URL
}) {
  const [photo, setPhoto] = useState(avatarUrl);
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
    </section>
  );
}

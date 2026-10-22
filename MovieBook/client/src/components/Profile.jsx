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
  avatarStatic: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#8b95a7",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    overflow: "hidden",
    flexShrink: 0,
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
  aboutReadOnly: {
    display: "block",
    width: "100%",
    minHeight: 100,
    boxSizing: "border-box",
    background: "#1b1b1b",
    color: "#9a9a9a",
    border: "1px solid #3a3a3a",
    borderRadius: 6,
    padding: "10px 12px",
    font: "inherit",
    lineHeight: 1.5,
  },
  // Filled blue, like the Search and Sign up buttons
  saveButton: {
    background: "#8ab4f8",
    color: "#1b1b1b",
    border: "none",
    borderRadius: 6,
    padding: "6px 14px",
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  label: { fontWeight: 700, marginRight: 4 },
  heading: { margin: "0 0 20px", fontSize: 20, fontWeight: 600 },
  // Email / Age on the left, its "hide" checkbox on the right
  dataRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    margin: "0 0 12px",
  },
  rowText: { margin: 0 },
  // "Save about me" on the left, "Hide about me" on the right
  aboutActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12,
  },
  checkLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "#bdbdbd",
    fontSize: 13,
    cursor: "pointer",
    flexShrink: 0,
  },
  checkbox: { accentColor: "#8ab4f8", cursor: "pointer", margin: 0, width: 26, height: 26 },
  // Header row: title on the left, Delete account on the right
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    margin: "0 0 20px",
  },
  deleteButton: {
    background: "#e5534b",
    color: "#ffffff",
    border: "none",
    borderRadius: 6,
    padding: "8px 16px",
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  // The confirmation popup, centered on the screen over a dimmed background
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 1000,
  },
  dialog: {
    background: "#242424",
    color: "#e8e8e8",
    border: "1px solid #4a4a4a",
    borderRadius: 10,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    boxSizing: "border-box",
    textAlign: "center",
  },
  dialogTitle: { margin: "0 0 8px", fontSize: 18, fontWeight: 700 },
  dialogText: { margin: "0 0 20px" },
  dialogButtons: { display: "flex", justifyContent: "center", gap: 12 },
  yesButton: {
    background: "#e5534b",
    color: "#ffffff",
    border: "none",
    borderRadius: 6,
    padding: "8px 24px",
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  // Filled blue, like the Search and Sign up buttons
  noButton: {
    background: "#8ab4f8",
    color: "#1b1b1b",
    border: "none",
    borderRadius: 6,
    padding: "8px 24px",
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};

const MAX_SIZE_MB = 5;

export default function Profile({
  name = "Original",
  email = "originalemail@gmail.com",
  age = null,
  avatarUrl = "",
  about: initialAbout = "",
  canEdit = false,        // neo prop: an false, read-only mode
  onAboutChange, // optional: called with the new About me text
  onPhotoChange, // optional: called with the new photo as a data URL
  onDeleteAccount, // optional: called after the user confirms deleting their account
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

  useEffect(fitAbout, [about, canEdit]); // whenever the text changes
  useEffect(() => {
    // text wraps differently when the window width changes
    window.addEventListener("resize", fitAbout);
    return () => window.removeEventListener("resize", fitAbout);
  }, []);

  const [error, setError] = useState("");
  const inputRef = useRef(null);

  // Delete account popup
  const [confirmOpen, setConfirmOpen] = useState(false);
  const noButtonRef = useRef(null);

  useEffect(() => {
    if (!confirmOpen) return;
    noButtonRef.current?.focus(); // "No" is focused first: the safe choice
    const handleKey = (e) => {
      if (e.key === "Escape") setConfirmOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [confirmOpen]);

  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    onDeleteAccount?.(); // for now the page only logs the user out (see ProfilePage)
  };

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

  // Not functional yet: there is nowhere to store this information
  const handleSavePhoto = () => {
    // TODO: save the photo for this user once the server supports it
  };
  const handleSaveAbout = () => {
    // TODO: save "About me" for this user once the server supports it
  };
  const handleSeeReviews = () => {
    // TODO: go to this user's reviews page once it exists
  };

  return (
    <section style={styles.card}>
      <div style={styles.headerRow}>
        <h2 style={{ ...styles.heading, margin: 0 }}>User's Profile</h2>
        {/* Only for the profile's owner */}
        {canEdit && (
          <button
            type="button"
            style={styles.deleteButton}
            onClick={() => setConfirmOpen(true)}
          >
            Delete account
          </button>
        )}
      </div>

      <div style={styles.photoRow}>
        {/* canEdit=true: avatar einai koumpi, canEdit=false: aplo div */}
        {canEdit ? (
          <button
            type="button"
            style={styles.avatar}
            onClick={() => inputRef.current?.click()}
            aria-label="Change profile photo"
          >
            {photo ? (
              <img src={photo} alt={`${name}'s photo`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initial
            )}
          </button>
        ) : (
          <div style={styles.avatarStatic}>
            {photo ? (
              <img src={photo} alt={`${name}'s photo`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initial
            )}
          </div>
        )}

        {/* 'Change photo' mono an canEdit=true */}
        {canEdit && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
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
            <button type="button" style={styles.saveButton} onClick={handleSavePhoto}>
              Save photo
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: "none" }}
        />
      </div>

      <div style={styles.dataRow}>
        <p style={styles.rowText}>
          <span style={styles.label}>Email:</span>
          {email}
        </p>
        {/* Only for the profile's owner. Not functional yet: nothing is stored for it. */}
        {canEdit && (
          <label style={styles.checkLabel}>
            Hide email
            <input type="checkbox" style={styles.checkbox} />
          </label>
        )}
      </div>
      {/* ilikia mono an exoume timi */}
      {age !== null && (
        <div style={styles.dataRow}>
          <p style={styles.rowText}>
            <span style={styles.label}>Age:</span>
            {age}
          </p>
          {canEdit && (
            <label style={styles.checkLabel}>
              Hide age
              <input type="checkbox" style={styles.checkbox} />
            </label>
          )}
        </div>
      )}

      <h3 style={styles.aboutHeading}>About me</h3>

      {/* canEdit=true: textarea, canEdit=false: read-only div */}
      {canEdit ? (
        <>
          <textarea
            ref={aboutRef}
            style={styles.aboutInput}
            aria-label="About me"
            placeholder="Write something about yourself..."
            value={about}
            onChange={(e) => updateAbout(e.target.value)}
            onKeyDown={handleAboutKeyDown}
          />
          <div style={styles.aboutActions}>
            <button type="button" style={styles.saveButton} onClick={handleSaveAbout}>
              Save about me
            </button>
            {/* Not functional yet: nothing is stored for it */}
            <label style={styles.checkLabel}>
              Hide about me
              <input type="checkbox" style={styles.checkbox} />
            </label>
          </div>
        </>
      ) : (
        <div style={styles.aboutReadOnly}>
          {about || <span style={{ color: "#5a5a5a" }}>Nothing written yet.</span>}
        </div>
      )}

      {/* Not functional yet: there is no reviews page */}
      <div style={{ marginTop: 24 }}>
        <button type="button" style={styles.saveButton} onClick={handleSeeReviews}>
          Go See My Reviews
        </button>
      </div>

      {confirmOpen && (
        <div style={styles.overlay} onClick={() => setConfirmOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            style={styles.dialog}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-account-title" style={styles.dialogTitle}>
              Delete account
            </h3>
            <p style={styles.dialogText}>
              Are you sure you want to delete your account?
            </p>
            <div style={styles.dialogButtons}>
              <button type="button" style={styles.yesButton} onClick={handleConfirmDelete}>
                Yes
              </button>
              <button
                type="button"
                ref={noButtonRef}
                style={styles.noButton}
                onClick={() => setConfirmOpen(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

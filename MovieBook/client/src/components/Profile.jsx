import React, { useEffect, useRef, useState } from "react";

// Shared look of the profile photo circle
const AVATAR_CLASS =
  "flex size-18 shrink-0 items-center justify-center overflow-hidden rounded-full bg-avatar p-0 text-[28px] text-strong";

// "Hide email" / "Hide age" / "Hide about me": text first, then the checkbox
const CHECK_LABEL_CLASS =
  "inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-[13px] text-soft";
const CHECKBOX_CLASS = "m-0 size-[26px] cursor-pointer accent-brand";

const MAX_SIZE_MB = 5;

export default function Profile({
  name = "Original",
  email = "originalemail@gmail.com",
  age = null,
  avatarUrl = "",
  about: initialAbout = "",
  canEdit = false, // neo prop: an false, read-only mode
  onAboutChange, // optional: called with the new About me text
  onPhotoChange, // optional: called with the new photo as a data URL
  onDeleteAccount, // optional: called after the user confirms deleting their account
  onSeeReviews, // optional: called when "Go See My Reviews" is clicked
}) {
  const [photo, setPhoto] = useState(avatarUrl);
  const [about, setAbout] = useState(initialAbout);
  const aboutRef = useRef(null);

  // Grow the About me box to fit its text (never smaller than its minimum height)
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
    onSeeReviews?.(); // the page decides where this leads (see ProfilePage)
  };

  // The photo, or the first letter of the name
  const avatarContent = photo ? (
    <img src={photo} alt={`${name}'s photo`} className="size-full object-cover" />
  ) : (
    initial
  );

  return (
    <section className="w-full flex-1 border-l-[3px] border-line bg-surface px-6 py-5 text-left text-sm leading-normal text-main">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold">User's Profile</h2>
        {/* Only for the profile's owner */}
        {canEdit && (
          <button
            type="button"
            className="btn btn-danger px-4 py-2"
            onClick={() => setConfirmOpen(true)}
          >
            Delete account
          </button>
        )}
      </div>

      <div className="mb-6 flex items-center gap-3.5">
        {/* canEdit=true: avatar einai koumpi, canEdit=false: aplo div */}
        {canEdit ? (
          <button
            type="button"
            className={`${AVATAR_CLASS} cursor-pointer`}
            onClick={() => inputRef.current?.click()}
            aria-label="Change profile photo"
          >
            {avatarContent}
          </button>
        ) : (
          <div className={AVATAR_CLASS}>{avatarContent}</div>
        )}

        {/* 'Change photo' mono an canEdit=true */}
        {canEdit && (
          <div className="flex flex-col items-start gap-1.5">
            <button
              type="button"
              className="cursor-pointer text-brand underline"
              onClick={() => inputRef.current?.click()}
            >
              {photo ? "Change photo" : "Upload photo"}
            </button>
            <div className="hint">
              {error ? <span className="text-danger-text">{error}</span> : "JPG or PNG, up to 5 MB"}
            </div>
            <button type="button" className="btn py-1.5" onClick={handleSavePhoto}>
              Save photo
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="m-0">
          <span className="mr-1 font-bold">Email:</span>
          {email}
        </p>
        {/* Only for the profile's owner. Not functional yet: nothing is stored for it. */}
        {canEdit && (
          <label className={CHECK_LABEL_CLASS}>
            Hide email
            <input type="checkbox" className={CHECKBOX_CLASS} />
          </label>
        )}
      </div>
      {/* ilikia mono an exoume timi */}
      {age !== null && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="m-0">
            <span className="mr-1 font-bold">Age:</span>
            {age}
          </p>
          {canEdit && (
            <label className={CHECK_LABEL_CLASS}>
              Hide age
              <input type="checkbox" className={CHECKBOX_CLASS} />
            </label>
          )}
        </div>
      )}

      <h3 className="mt-6 mb-2 text-base font-bold">About me</h3>

      {/* canEdit=true: textarea, canEdit=false: read-only box */}
      {canEdit ? (
        <>
          <textarea
            ref={aboutRef}
            className="block min-h-[280px] w-full resize-none overflow-hidden rounded-md border border-line bg-field px-3 py-2.5 leading-normal text-main [tab-size:4] placeholder:text-muted"
            aria-label="About me"
            placeholder="Write something about yourself..."
            value={about}
            onChange={(e) => updateAbout(e.target.value)}
            onKeyDown={handleAboutKeyDown}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <button type="button" className="btn py-1.5" onClick={handleSaveAbout}>
              Save about me
            </button>
            {/* Not functional yet: nothing is stored for it */}
            <label className={CHECK_LABEL_CLASS}>
              Hide about me
              <input type="checkbox" className={CHECKBOX_CLASS} />
            </label>
          </div>
        </>
      ) : (
        <div className="block min-h-[100px] w-full rounded-md border border-line-soft bg-field px-3 py-2.5 leading-normal whitespace-pre-wrap text-muted [tab-size:4]">
          {about || <span className="text-faint">Nothing written yet.</span>}
        </div>
      )}

      {/* Only for the profile's owner */}
      {canEdit && (
        <div className="mt-6">
          <button type="button" className="btn py-1.5" onClick={handleSeeReviews}>
            Go See My Reviews
          </button>
        </div>
      )}

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-overlay p-4"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="box-border w-full max-w-[380px] rounded-[10px] border border-line bg-surface p-6 text-center text-main"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-account-title" className="mb-2 text-lg font-bold">
              Delete account
            </h3>
            <p className="mb-5">Are you sure you want to delete your account?</p>
            <div className="flex justify-center gap-3">
              <button type="button" className="btn btn-danger px-6 py-2" onClick={handleConfirmDelete}>
                Yes
              </button>
              <button
                type="button"
                ref={noButtonRef}
                className="btn px-6 py-2"
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

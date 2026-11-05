import React, { useEffect, useRef, useState } from "react";
import { resizeImage } from "../utils/image";

const AVATAR_CLASS =
  "flex size-18 shrink-0 items-center justify-center overflow-hidden rounded-full bg-avatar p-0 text-[28px] text-strong";

const CHECK_LABEL_CLASS =
  "inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-[13px] text-soft";
const CHECKBOX_CLASS = "m-0 size-[26px] cursor-pointer accent-brand";

const MAX_SIZE_MB = 5;
const ABOUT_MAX_LENGTH = 500;

function StatusText({ status }) {
  if (!status) return null;
  const color =
    status.kind === "ok" ? "text-success" : status.kind === "error" ? "text-danger-text" : "text-muted";
  return (
    <span role="status" className={`text-xs ${color}`}>
      {status.text}
    </span>
  );
}

export default function Profile({
  name = "Original",
  title = "User's Profile",
  email = "originalemail@gmail.com",
  age = null,
  photo: initialPhoto = "",
  about: initialAbout = "",
  aboutHidden = false,
  hideEmail = false,
  hideAge = false,
  hideAboutMe = false,
  canEdit = false,
  onSavePhoto,
  onSaveAbout,
  onChangeHide,
  onDeleteAccount,
  onSeeReviews,
  onSeeWatched,
  isOwner = false,
}) {
  const [photo, setPhoto] = useState(initialPhoto);
  const [savedPhoto, setSavedPhoto] = useState(initialPhoto);
  const [photoStatus, setPhotoStatus] = useState(null);
  const [fileError, setFileError] = useState("");
  const inputRef = useRef(null);

  const [about, setAbout] = useState(initialAbout);
  const [savedAbout, setSavedAbout] = useState(initialAbout);
  const [aboutStatus, setAboutStatus] = useState(null);
  const aboutRef = useRef(null);

  const [hide, setHide] = useState({ hideEmail, hideAge, hideAboutMe });
  const [hideError, setHideError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const noButtonRef = useRef(null);

  const fitAbout = () => {
    const el = aboutRef.current;
    if (!el) return;
    el.style.height = "auto";
    const borders = el.offsetHeight - el.clientHeight;
    el.style.height = `${el.scrollHeight + borders}px`;
  };

  useEffect(fitAbout, [about, canEdit]);
  useEffect(() => {
    window.addEventListener("resize", fitAbout);
    return () => window.removeEventListener("resize", fitAbout);
  }, []);

  useEffect(() => {
    if (!confirmOpen) return;
    noButtonRef.current?.focus();
    const handleKey = (e) => {
      if (e.key === "Escape" && !deleting) setConfirmOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [confirmOpen, deleting]);

  const initial = name.trim().charAt(0).toUpperCase();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFileError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`Image must be under ${MAX_SIZE_MB} MB.`);
      return;
    }

    setFileError("");
    try {
      setPhoto(await resizeImage(file));
      setPhotoStatus(null);
    } catch (err) {
      setFileError(err.message);
    }
  };

  const handleSavePhoto = async () => {
    setPhotoStatus({ kind: "saving", text: "Saving..." });
    try {
      await onSavePhoto?.(photo);
      setSavedPhoto(photo);
      setPhotoStatus({ kind: "ok", text: "Photo saved." });
    } catch (err) {
      setPhotoStatus({ kind: "error", text: err.message || "Could not save the photo." });
    }
  };

  const updateAbout = (value) => {
    setAbout(value);
    setAboutStatus(null);
  };

  const handleAboutKeyDown = (e) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.target;
    const { selectionStart, selectionEnd, value } = el;
    if (value.length - (selectionEnd - selectionStart) + 1 > ABOUT_MAX_LENGTH) return;
    updateAbout(value.slice(0, selectionStart) + "\t" + value.slice(selectionEnd));
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = selectionStart + 1;
    });
  };

  const handleSaveAbout = async () => {
    setAboutStatus({ kind: "saving", text: "Saving..." });
    try {
      await onSaveAbout?.(about);
      setSavedAbout(about);
      setAboutStatus({ kind: "ok", text: "About me saved." });
    } catch (err) {
      setAboutStatus({ kind: "error", text: err.message || "Could not save About me." });
    }
  };

  const handleHideChange = async (field, checked) => {
    setHide((previous) => ({ ...previous, [field]: checked }));
    setHideError("");
    try {
      await onChangeHide?.(field, checked);
    } catch (err) {
      setHide((previous) => ({ ...previous, [field]: !checked }));
      setHideError(err.message || "Could not save this setting.");
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await onDeleteAccount?.();
      setConfirmOpen(false);
    } catch (err) {
      setDeleteError(err.message || "Could not delete the account.");
    } finally {
      setDeleting(false);
    }
  };

  const closeDialog = () => {
    if (!deleting) setConfirmOpen(false);
  };

  const avatarContent = photo ? (
    <img src={photo} alt={`${name}'s photo`} className="size-full object-cover" />
  ) : (
    initial
  );

  return (
    <section className="w-full flex-1 border-l-[3px] border-line bg-surface px-6 py-5 text-left text-sm leading-normal text-main">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold">{title}</h2>
        {canEdit && (
          <button
            type="button"
            className="btn btn-danger px-4 py-2"
            onClick={() => {
              setDeleteError("");
              setConfirmOpen(true);
            }}
          >
            Delete account
          </button>
        )}
      </div>

      <div className="mb-6 flex items-center gap-3.5">
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
              {fileError ? (
                <span className="text-danger-text">{fileError}</span>
              ) : (
                "JPG or PNG, up to 5 MB"
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn py-1.5"
                disabled={photo === savedPhoto || photoStatus?.kind === "saving"}
                onClick={handleSavePhoto}
              >
                Save photo
              </button>
              <StatusText status={photoStatus} />
            </div>
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
        {canEdit && (
          <label className={CHECK_LABEL_CLASS}>
            Hide email
            <input
              type="checkbox"
              className={CHECKBOX_CLASS}
              checked={hide.hideEmail}
              onChange={(e) => handleHideChange("hideEmail", e.target.checked)}
            />
          </label>
        )}
      </div>

      {age !== null && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="m-0">
            <span className="mr-1 font-bold">Age:</span>
            {age}
          </p>
          {canEdit && (
            <label className={CHECK_LABEL_CLASS}>
              Hide age
              <input
                type="checkbox"
                className={CHECKBOX_CLASS}
                checked={hide.hideAge}
                onChange={(e) => handleHideChange("hideAge", e.target.checked)}
              />
            </label>
          )}
        </div>
      )}
      {hideError && <p className="mb-3 text-xs text-danger-text">{hideError}</p>}

      <h3 className="mt-6 mb-2 text-base font-bold">About me</h3>

      {canEdit ? (
        <>
          <textarea
            ref={aboutRef}
            className="block min-h-[280px] w-full resize-none overflow-hidden rounded-md border border-line bg-field px-3 py-2.5 leading-normal text-main [tab-size:4] placeholder:text-muted"
            aria-label="About me"
            placeholder="Write something about yourself..."
            maxLength={ABOUT_MAX_LENGTH}
            value={about}
            onChange={(e) => updateAbout(e.target.value)}
            onKeyDown={handleAboutKeyDown}
          />
          <p className="hint mt-1 text-right">
            {about.length} / {ABOUT_MAX_LENGTH}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn py-1.5"
                disabled={about === savedAbout || aboutStatus?.kind === "saving"}
                onClick={handleSaveAbout}
              >
                Save about me
              </button>
              <StatusText status={aboutStatus} />
            </div>
            <label className={CHECK_LABEL_CLASS}>
              Hide about me
              <input
                type="checkbox"
                className={CHECKBOX_CLASS}
                checked={hide.hideAboutMe}
                onChange={(e) => handleHideChange("hideAboutMe", e.target.checked)}
              />
            </label>
          </div>
        </>
      ) : (
        <div className="block min-h-[100px] w-full rounded-md border border-line-soft bg-field px-3 py-2.5 leading-normal whitespace-pre-wrap text-muted [tab-size:4]">
          {aboutHidden ? (
            <span className="text-faint">Hidden by this user.</span>
          ) : (
            initialAbout || <span className="text-faint">Nothing written yet.</span>
          )}
        </div>
      )}

      {/* Action Buttons for Reviews and Watched Movies */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onSeeReviews && (
          <button type="button" className="btn py-1.5 px-4" onClick={onSeeReviews}>
            {isOwner ? "Go See My Reviews" : `Go See ${name}'s Reviews`}
          </button>
        )}
        {onSeeWatched && (
          <button type="button" className="btn py-1.5 px-4" onClick={onSeeWatched}>
            {isOwner ? "Go See My Watched Movies" : `Go See ${name}'s Watched Movies`}
          </button>
        )}
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-overlay p-4"
          onClick={closeDialog}
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
            <p className="mb-5">
              Are you sure you want to delete your account? Your reviews will be deleted too.
            </p>
            {deleteError && <p className="mb-4 text-danger-text">{deleteError}</p>}
            <div className="flex justify-center gap-3">
              <button
                type="button"
                className="btn btn-danger px-6 py-2"
                disabled={deleting}
                onClick={handleConfirmDelete}
              >
                {deleting ? "Deleting..." : "Yes"}
              </button>
              <button
                type="button"
                ref={noButtonRef}
                className="btn px-6 py-2"
                disabled={deleting}
                onClick={closeDialog}
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
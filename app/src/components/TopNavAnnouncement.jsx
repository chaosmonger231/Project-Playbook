import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../auth/firebase";
import { useUser } from "../auth/UserContext";

const DEFAULT_MESSAGE = "No announcement set.";

export default function TopNavAnnouncement() {
  const { orgId, role, loading: userLoading } = useUser();

  const [bannerMessage, setBannerMessage] = useState(DEFAULT_MESSAGE);
  const [bannerUpdatedAt, setBannerUpdatedAt] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");

  const textareaRef = useRef(null);
  const isCoordinator = role === "coordinator";

  useEffect(() => {
    let cancelled = false;

    async function loadBanner() {
      if (userLoading) return;

      if (!orgId) {
        if (!cancelled) {
          setBannerMessage(DEFAULT_MESSAGE);
          setBannerUpdatedAt(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const orgRef = doc(db, "orgs", orgId);
        const orgSnap = await getDoc(orgRef);

        if (!orgSnap.exists()) {
          if (!cancelled) {
            setBannerMessage(DEFAULT_MESSAGE);
            setBannerUpdatedAt(null);
          }
          return;
        }

        const data = orgSnap.data();
        const nextMessage =
          typeof data.bannerMessage === "string" && data.bannerMessage.trim()
            ? data.bannerMessage.trim()
            : DEFAULT_MESSAGE;

        if (!cancelled) {
          setBannerMessage(nextMessage);
          setBannerUpdatedAt(data.bannerUpdatedAt || null);
        }
      } catch (error) {
        console.error("Failed to load announcement", error);
        if (!cancelled) {
          setBannerMessage(DEFAULT_MESSAGE);
          setBannerUpdatedAt(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBanner();

    return () => {
      cancelled = true;
    };
  }, [orgId, userLoading]);

  useEffect(() => {
    if (!isModalOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !saving) {
        setIsModalOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    const timer = window.setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }, 20);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(timer);
    };
  }, [isModalOpen, saving]);

  const announcementText = useMemo(() => {
    if (loading) return "Loading announcement...";
    return bannerMessage || DEFAULT_MESSAGE;
  }, [bannerMessage, loading]);

  function openEditModal() {
    setDraftMessage(
      bannerMessage && bannerMessage !== DEFAULT_MESSAGE ? bannerMessage : ""
    );
    setIsModalOpen(true);
  }

  function closeEditModal() {
    if (saving) return;
    setIsModalOpen(false);
  }

  async function handleSave() {
    if (!orgId || !isCoordinator) return;

    setSaving(true);

    try {
      const orgRef = doc(db, "orgs", orgId);
      const trimmed = draftMessage.trim();

      await updateDoc(orgRef, {
        bannerMessage: trimmed,
        bannerUpdatedAt: serverTimestamp(),
      });

      setBannerMessage(trimmed || DEFAULT_MESSAGE);
      setBannerUpdatedAt(new Date().toISOString());
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save announcement", error);
      alert("Unable to save the announcement right now.");
    } finally {
      setSaving(false);
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closeEditModal();
    }
  }

  const modalMarkup = isModalOpen
    ? createPortal(
        <div
          className="topnav-announcement-editor__backdrop"
          onClick={handleBackdropClick}
        >
          <div
            className="topnav-announcement-editor"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-editor-title"
          >
            <div className="topnav-announcement-editor__head">
              <h3
                id="announcement-editor-title"
                className="topnav-announcement-editor__title"
              >
                Edit Announcement
              </h3>
            </div>

            <textarea
              ref={textareaRef}
              className="topnav-announcement-editor__textarea"
              rows={5}
              maxLength={300}
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              placeholder="Type the organization announcement here..."
              disabled={saving}
            />

            <div className="topnav-announcement-editor__footer">
              <span className="topnav-announcement-editor__count">
                {draftMessage.length}/300 characters
              </span>

              <div className="topnav-announcement-editor__actions">
                <button
                  type="button"
                  className="topnav-announcement-editor__btn topnav-announcement-editor__btn--secondary"
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="topnav-announcement-editor__btn topnav-announcement-editor__btn--primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className="topnav-announcement">
        <div className="topnav-announcement__label-wrap">
          <span className="topnav-announcement__label">Announcement</span>
          {bannerUpdatedAt ? (
            <span className="topnav-announcement__updated" aria-hidden="true">
              Updated
            </span>
          ) : null}
        </div>

        <div className="topnav-announcement__pill-wrap">
          <div
            className="topnav-announcement__pill"
            aria-label="Current organization announcement"
          >
            {announcementText}
          </div>
        </div>

        {isCoordinator && (
          <button
            type="button"
            className="topnav-announcement__edit-btn"
            onClick={openEditModal}
          >
            Edit
          </button>
        )}
      </div>

      {modalMarkup}
    </>
  );
}
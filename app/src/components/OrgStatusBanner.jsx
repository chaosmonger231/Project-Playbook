import { useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../auth/firebase";
import { useUser } from "../auth/UserContext";

export default function OrgStatusBanner() {
  const { orgId, role } = useUser();

  const [banner, setBanner] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // local-only image preview for now (storage later)
  const DEFAULT_AVATAR = "/images/profileimage.png"; // put in /public/profileimage.png
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  // hover states
  const [avatarHover, setAvatarHover] = useState(false);
  const [editHover, setEditHover] = useState(false);

  const orgDocRef = useMemo(() => {
    if (!orgId) return null;
    return doc(db, "orgs", orgId);
  }, [orgId]);

  useEffect(() => {
    if (!orgDocRef) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      orgDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const message = data.bannerMessage || "";
          setBanner(message);
          if (!editing) setDraft(message);
        } else {
          setBanner("");
          if (!editing) setDraft("");
        }
        setLoading(false);
      },
      (err) => {
        console.error("[OrgStatusBanner] onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [orgDocRef, editing]);

  const isCoordinator = role === "coordinator";
  const isChanged = draft.trim() !== banner;

  const openModal = () => {
    setDraft(banner);
    setEditing(true);
  };

  const closeModal = () => {
    setDraft(banner);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!orgDocRef) return;

    try {
      setSaving(true);
      await setDoc(
        orgDocRef,
        {
          bannerMessage: draft.trim(),
          bannerUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  };

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  if (loading) return null;
  if (!isCoordinator && !banner) return null;

  // ===== sizing tokens =====
  const avatarSize = 88; // bigger
  const pillHeight = 48;

  const avatarSrc = imagePreviewUrl || DEFAULT_AVATAR;

  return (
    <>
      {/* Main Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginBottom: "16px",
          width: "100%",
        }}
      >
        {/* Avatar + tooltip */}
        <div style={{ position: "relative", flex: "0 0 auto" }}>
          <div
            onClick={handlePickImage}
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: "50%",
              border: "2px solid #111827",
              overflow: "hidden",
              cursor: "pointer",
              background: "#ffffff",
            }}
            title="Change profile image"
          >
            <img
              src={avatarSrc}
              alt="Profile"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          {avatarHover && (
            <div
              style={{
                position: "absolute",
                top: "-10px",
                left: "50%",
                transform: "translate(-50%, -100%)",
                background: "#111827",
                color: "#ffffff",
                fontSize: "12px",
                padding: "6px 10px",
                borderRadius: "999px",
                whiteSpace: "nowrap",
                boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                pointerEvents: "none",
              }}
            >
              Change profile image
            </div>
          )}
        </div>

        {/* Middle column: label + pill row */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#6b7280",
              marginLeft: "12px",
              marginBottom: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
            }}
          >
            Announcement
          </div>

          {/* ✅ Pill row ensures EDIT is centered to pill height */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              width: "100%",
            }}
          >
            <div
              style={{
                flex: 1,
                height: pillHeight,
                borderRadius: "999px",
                border: "2px solid #111827",
                background: "#eaf4ff",
                display: "flex",
                alignItems: "center",
                padding: "0 18px",
                fontSize: "15px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {banner || (isCoordinator ? "No announcement set." : "")}
            </div>

            {isCoordinator && (
              <button
                onClick={openModal}
                onMouseEnter={() => setEditHover(true)}
                onMouseLeave={() => setEditHover(false)}
                style={{
                  height: "30px", // smaller
                  padding: "0 12px",
                  borderRadius: "999px",
                  border: "1.5px solid #1e293b",
                  background: editHover ? "#dbeafe" : "#e0ecff", // subtle color
                  fontWeight: 800,
                  fontSize: "11px",
                  cursor: "pointer",
                  color: editHover ? "#1d4ed8" : "#1e293b",
                  transition: "0.15s ease",
                  flex: "0 0 auto",
                }}
                type="button"
              >
                EDIT
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {editing && isCoordinator && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(3px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              width: "420px",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "18px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: "12px" }}>
              Edit Announcement
            </h3>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              maxLength={300}
              placeholder="Update announcement..."
              style={{
                width: "100%",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                padding: "10px",
                resize: "vertical",
                fontFamily: "inherit",
                outline: "none",
              }}
            />

            <div style={{ marginTop: "6px", fontSize: "12px", color: "#6b7280" }}>
              {draft.length}/300 characters
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "14px",
              }}
            >
              <button
                onClick={closeModal}
                disabled={saving}
                style={{
                  height: "36px",
                  padding: "0 12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={!isChanged || saving}
                style={{
                  height: "36px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  border: "1px solid #111827",
                  background: isChanged ? "#111827" : "#9ca3af",
                  color: "#ffffff",
                  cursor: !isChanged || saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.9 : 1,
                }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
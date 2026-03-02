// src/pages/Lessons.jsx

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../auth/UserContext";
import moduleRegistry from "../learningContent/moduleRegistry.json";

/**
 * Lessons Landing Page
 * 
 * Responsibilities:
 * - Display learning modules as cards
 * - Group by category
 * - Gate access based on allowedOrgTypes
 * - Navigate to /learning/:moduleId
 */

export default function Lessons() {
  const navigate = useNavigate();
  const { role, orgType, loading } = useUser(); // assumes orgType exists in context

  console.log("LESSONS useUser()", { role, orgType });

  if (loading) return <p>Loading…</p>;

  const modules = moduleRegistry.modules || [];

  // Group modules by category
  const modulesByCategory = useMemo(() => {
    const grouped = {};
    modules.forEach((m) => {
      if (!grouped[m.category]) {
        grouped[m.category] = [];
      }
      grouped[m.category].push(m);
    });
    return grouped;
  }, [modules]);

  const canAccess = (module) => {
    if (!module.allowedOrgTypes || module.allowedOrgTypes.includes("all")) {
      return true;
    }
    if (!orgType) return false;
    return module.allowedOrgTypes.includes(orgType);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Learning Modules</h2>

      {Object.entries(modulesByCategory).map(([category, categoryModules]) => (
        <div key={category} style={{ marginTop: 32 }}>
          <h3 style={{ textTransform: "capitalize" }}>{category}</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
              marginTop: 16,
            }}
          >
            {categoryModules.map((module) => {
              const allowed = canAccess(module);

              return (
                <div
                  key={module.moduleId}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: 12,
                    padding: 16,
                    background: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 180,
                  }}
                >
                  <div>
                    <h4>{module.title}</h4>
                    <p style={{ fontSize: "0.9rem", marginTop: 8 }}>
                      {module.synopsis}
                    </p>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    {allowed ? (
                      <button
                        onClick={() =>
                          navigate(`/learning/${module.moduleId}`)
                        }
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      >
                        Start Learning
                      </button>
                    ) : (
                      <>
                        <button
                          disabled
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            opacity: 0.5,
                            cursor: "not-allowed",
                          }}
                        >
                          Locked
                        </button>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            marginTop: 6,
                            color: "#6b7280",
                          }}
                        >
                          Ask your coordinator to enable this module.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
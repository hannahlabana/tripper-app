"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TripFormData = {
  [key: string]: any;
};

export default function SummaryPage() {
  const [data, setData] = useState<TripFormData | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem("tripFormData");
    if (!raw) return;

    try {
      setData(JSON.parse(raw));
    } catch (e) {
      console.error("Failed to parse stored trip data", e);
    }
  }, []);

  const handleSubmit = async () => {
    if (!data) return;
    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch(
        "https://hannahlabana.app.n8n.cloud/webhook/fc55e808-3dd6-4e56-a823-4b20f450ad19",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setStatus("success");
    } catch (e: any) {
      console.error("Failed to submit trip data", e);
      setStatus("error");
      setError(e?.message ?? "Something went wrong");
    }
  };

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="flex items-center justify-between gap-4">
        <Link className="text-sm text-blue-600" href="/form">
          &larr; Back to form
        </Link>

        <div className="text-sm text-gray-500">Review &amp; submit</div>
      </div>

      <h1 className="mt-4 text-xl font-semibold">Your trip details</h1>

      {!data ? (
        <p className="mt-4 text-sm text-gray-600">
          No trip data found. Please fill out the form first.
        </p>
      ) : (
        <>
          <div className="mt-4 rounded-md bg-gray-50 p-4 text-sm">
            <div className="font-medium text-gray-900">Current state object</div>
            <pre className="mt-2 max-h-80 overflow-auto text-xs text-gray-700">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status === "submitting"}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg font-inter cursor-pointer hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-300"
            >
              {status === "submitting" ? "Submitting..." : "Confirm & Submit"}
            </button>

            {status === "success" && (
              <span className="text-sm text-green-600">Submitted successfully!</span>
            )}
            {status === "error" && (
              <span className="text-sm text-red-600">
                {error ?? "There was an error submitting your data."}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}


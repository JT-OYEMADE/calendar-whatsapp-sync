// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  useEffect(() => {
    // Check auth status
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => setAuthStatus(data))
      .catch((err) => console.error("Auth check failed:", err));

    // Check for auth callback
    const auth = searchParams.get("auth");
    if (auth === "success") {
      setResult({
        success: true,
        message: "✅ Google Calendar connected successfully!",
      });
      // Refresh auth status
      setTimeout(() => {
        fetch("/api/auth/status")
          .then((res) => res.json())
          .then((data) => setAuthStatus(data));
      }, 1000);
    } else if (auth === "error") {
      setResult({
        error: "❌ Authentication failed. Please try again.",
      });
    }

    // Load upcoming events
    loadUpcomingEvents();
  }, [searchParams]);

  const loadUpcomingEvents = async () => {
    try {
      const res = await fetch("/api/calendar/events?days=14");
      const data = await res.json();
      if (data.success) {
        setUpcomingEvents(data.events.slice(0, 10));
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  };

  const handleBirthdayUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/upload/birthdays", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Reload events after successful upload
        setTimeout(loadUpcomingEvents, 1000);
        // Reset form
        e.currentTarget.reset();
      }
    } catch (error) {
      setResult({ error: "Upload failed. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateMonthlyDesigns = async () => {
    setSyncing(true);
    setResult(null);

    try {
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_monthly_designs",
          data: { year: new Date().getFullYear() },
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setTimeout(loadUpcomingEvents, 1000);
      }
    } catch (error) {
      setResult({ error: "Sync failed. Please try again." });
    } finally {
      setSyncing(false);
    }
  };

  const handleTestReminders = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch("/api/cron/check-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ""}`,
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Test failed. Please try again." });
    } finally {
      setTesting(false);
    }
  };

  const handleTestWhatsApp = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch("/api/whatsapp/test", {
        method: "POST",
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        error: "WhatsApp test failed. Please check your configuration.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ⛪ Church Media Team Dashboard
          </h1>
          <p className="text-gray-600">
            Automated reminder system for birthdays, designs, meetings & more
          </p>
        </div>

        {/* Auth Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">
                {authStatus?.authenticated
                  ? "✅ Connected"
                  : "⚠️ Not Connected"}
              </h3>
              <p className="text-sm text-gray-600">
                {authStatus?.message || "Checking connection..."}
              </p>
            </div>
            {!authStatus?.authenticated && (
              <a
                href="/api/auth"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Connect Google Calendar
              </a>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Upload Birthdays */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🎂</span>
              <h2 className="text-xl font-semibold">Upload Birthdays</h2>
            </div>
            <form onSubmit={handleBirthdayUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Excel File (Name & Birthday columns)
                </label>
                <input
                  type="file"
                  name="file"
                  accept=".xlsx,.xls"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Expected columns: Name, Birthday
                </p>
              </div>
              <button
                type="submit"
                disabled={uploading || !authStatus?.authenticated}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
              >
                {uploading ? "⏳ Uploading..." : "📤 Upload & Sync to Calendar"}
              </button>
            </form>
          </div>

          {/* Create Monthly Designs */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🎨</span>
              <h2 className="text-xl font-semibold">Monthly Designs</h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Create "Happy New Month" events for all 12 months of{" "}
              {new Date().getFullYear()}
            </p>
            <button
              onClick={handleCreateMonthlyDesigns}
              disabled={syncing || !authStatus?.authenticated}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
            >
              {syncing ? "⏳ Creating..." : "✨ Create All Monthly Events"}
            </button>
          </div>
        </div>

        {/* Testing Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">⚡</span>
            <h2 className="text-xl font-semibold">Test System</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={handleTestWhatsApp}
              disabled={testing}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition font-medium"
            >
              {testing ? "⏳ Testing..." : "📱 Test WhatsApp Connection"}
            </button>
            <button
              onClick={handleTestReminders}
              disabled={testing || !authStatus?.authenticated}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition font-medium"
            >
              {testing ? "⏳ Testing..." : "🔔 Check Pending Reminders"}
            </button>
          </div>
        </div>

        {/* Results Display */}
        {result && (
          <div
            className={`rounded-lg shadow-md p-6 mb-6 ${
              result.error
                ? "bg-red-50 border-l-4 border-red-500"
                : "bg-green-50 border-l-4 border-green-500"
            }`}
          >
            <h3 className="font-semibold mb-3 text-lg">
              {result.error ? "❌ Error" : "✅ Success"}
            </h3>
            {result.message && (
              <p className="mb-2 text-gray-800">{result.message}</p>
            )}
            {result.error && (
              <p className="mb-2 text-red-700">{result.error}</p>
            )}
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                View Details
              </summary>
              <pre className="text-xs overflow-auto mt-2 p-3 bg-white rounded border max-h-64">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              📅 Upcoming Events (Next 14 Days)
            </h2>
            <div className="space-y-2">
              {upcomingEvents.map((event, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-blue-400 pl-4 py-2 hover:bg-gray-50 transition"
                >
                  <div className="font-medium text-gray-900">{event.title}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(
                      event.start?.dateTime || event.start?.date
                    ).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: event.start?.dateTime ? "2-digit" : undefined,
                      minute: event.start?.dateTime ? "2-digit" : undefined,
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <h3 className="font-semibold mb-3 text-lg">📖 How It Works</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>1. ✅ Connect Google Calendar (if not already connected)</p>
            <p>2. 📤 Upload your Excel file with team member birthdays</p>
            <p>3. ✨ Create monthly design events for the entire year</p>
            <p>
              4. 🤖 System automatically checks for upcoming events every 6
              hours
            </p>
            <p className="ml-6 text-xs">
              📱 WhatsApp reminders sent at perfect times:
            </p>
            <ul className="ml-10 text-xs space-y-1">
              <li>🎂 Birthdays: 7, 3, 1 day(s) before + day of</li>
              <li>🎨 Monthly designs: 3, 1 day(s) before + day of</li>
              <li>📅 Meetings: 24 hours and 1 hour before</li>
              <li>📋 Rosters: 3 days before program</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

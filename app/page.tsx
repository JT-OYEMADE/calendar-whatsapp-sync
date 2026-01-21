"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";

export default function AdminDashboard() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/signin");
    },
  });

  const [activeTab, setActiveTab] = useState("birthdays");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [eventData, setEventData] = useState({
    summary: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    reminder: 60,
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleBirthdayImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const file = (e.target as any).file.files[0];
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/birthdays/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setMessage(
          `✅ Successfully imported ${result.imported} birthdays! Failed: ${result.failed}`,
        );
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "custom",
          data: eventData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage("✅ Event created successfully!");
        setEventData({
          summary: "",
          description: "",
          startDate: "",
          endDate: "",
          startTime: "",
          endTime: "",
          reminder: 60,
        });
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMonthlyEvents = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "new-month-year",
          data: { year: new Date().getFullYear() },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✅ Created ${result.events.length} monthly events!`);
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/notifications/check", {
        method: "POST",
        // No auth header needed for manual testing
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✅ Sent ${result.count} notifications!`);
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div>
              <h1 className="text-xl font-bold">Church Media Team</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session?.user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-8">
        <p className="text-gray-600 mb-8">Notification Management System</p>

        {message && (
          <div
            className={`p-4 rounded mb-6 ${
              message.includes("✅")
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab("birthdays")}
                className={`px-6 py-3 font-medium ${
                  activeTab === "birthdays"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600"
                }`}
              >
                Birthdays
              </button>
              <button
                onClick={() => setActiveTab("events")}
                className={`px-6 py-3 font-medium ${
                  activeTab === "events"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600"
                }`}
              >
                Events
              </button>
              <button
                onClick={() => setActiveTab("test")}
                className={`px-6 py-3 font-medium ${
                  activeTab === "test"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600"
                }`}
              >
                Test
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "birthdays" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Import Birthdays</h2>
                <form onSubmit={handleBirthdayImport} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Upload CSV File
                    </label>
                    <input
                      type="file"
                      name="file"
                      accept=".csv"
                      className="block w-full text-sm border rounded p-2"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      CSV format: Name, Birthday (YYYY-MM-DD)
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Importing..." : "Import Birthdays"}
                  </button>
                </form>
              </div>
            )}

            {activeTab === "events" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                  <button
                    onClick={handleCreateMonthlyEvents}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading
                      ? "Creating..."
                      : "Create Monthly Events for This Year"}
                  </button>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Create Custom Event
                  </h2>
                  <form onSubmit={handleCreateEvent} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={eventData.summary}
                        onChange={(e) =>
                          setEventData({
                            ...eventData,
                            summary: e.target.value,
                          })
                        }
                        className="w-full border rounded p-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Description
                      </label>
                      <textarea
                        value={eventData.description}
                        onChange={(e) =>
                          setEventData({
                            ...eventData,
                            description: e.target.value,
                          })
                        }
                        className="w-full border rounded p-2"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={eventData.startDate}
                          onChange={(e) =>
                            setEventData({
                              ...eventData,
                              startDate: e.target.value,
                            })
                          }
                          className="w-full border rounded p-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={eventData.endDate}
                          onChange={(e) =>
                            setEventData({
                              ...eventData,
                              endDate: e.target.value,
                            })
                          }
                          className="w-full border rounded p-2"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Start Time (optional)
                        </label>
                        <input
                          type="time"
                          value={eventData.startTime}
                          onChange={(e) =>
                            setEventData({
                              ...eventData,
                              startTime: e.target.value,
                            })
                          }
                          className="w-full border rounded p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          End Time (optional)
                        </label>
                        <input
                          type="time"
                          value={eventData.endTime}
                          onChange={(e) =>
                            setEventData({
                              ...eventData,
                              endTime: e.target.value,
                            })
                          }
                          className="w-full border rounded p-2"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? "Creating..." : "Create Event"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "test" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Test Notifications
                </h2>
                <p className="text-gray-600 mb-4">
                  This will check today's events and send test notifications to
                  WhatsApp
                </p>
                <button
                  onClick={handleTestNotification}
                  disabled={loading}
                  className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Test Notifications"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

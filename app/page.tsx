// app/page.tsx

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          <div className="mb-6">
            <span className="text-6xl">⛪</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Church Media Team
          </h1>

          <h2 className="text-2xl md:text-3xl font-semibold text-purple-600 mb-6">
            Automated Reminder System
          </h2>

          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Never miss a birthday, monthly design, meeting, or roster again!
            Automatic WhatsApp reminders for your entire team.
          </p>

          <div className="grid md:grid-cols-4 gap-4 mb-8 text-center">
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
              <span className="text-3xl block mb-2">🎂</span>
              <span className="text-sm font-medium text-gray-700">
                Birthdays
              </span>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <span className="text-3xl block mb-2">🎨</span>
              <span className="text-sm font-medium text-gray-700">
                Monthly Designs
              </span>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <span className="text-3xl block mb-2">📅</span>
              <span className="text-sm font-medium text-gray-700">
                Meetings
              </span>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
              <span className="text-3xl block mb-2">📋</span>
              <span className="text-sm font-medium text-gray-700">Rosters</span>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-semibold px-8 py-4 rounded-full hover:shadow-xl transition-all transform hover:scale-105"
          >
            Go to Dashboard →
          </Link>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Powered by Google Calendar API & Meta WhatsApp Cloud API
            </p>
            <p className="text-xs text-gray-500 mt-2">
              100% Free • Automated • Reliable
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// /*
// ================================================================
// DEPLOYMENT INSTRUCTIONS
// ================================================================

// 1. LOCAL TESTING
//    npm run dev
//    Visit: http://localhost:3000

// 2. VERCEL DEPLOYMENT (Recommended)

//    A. Install Vercel CLI:
//       npm i -g vercel

//    B. Login:
//       vercel login

//    C. Deploy:
//       vercel

//    D. Set Environment Variables:
//       - Go to project settings on vercel.com
//       - Add all variables from .env.local
//       - Update NEXT_PUBLIC_APP_URL to your production URL
//       - Update GOOGLE_REDIRECT_URI to https://your-domain.com/api/auth/callback

//    E. Create vercel.json for cron:
//       {
//         "crons": [{
//           "path": "/api/cron/check-reminders",
//           "schedule": "0 */6 * * *"
//         }]
//       }

//    F. Redeploy:
//       vercel --prod

// 3. ALTERNATIVE: Other Hosting (Netlify, Railway, etc.)

//    Build command: npm run build
//    Output directory: .next

//    For cron jobs, use external service:
//    - https://cron-job.org
//    - URL: https://your-domain.com/api/cron/check-reminders
//    - Schedule: 0 */6 * * *
//    - Add header: Authorization: Bearer YOUR_CRON_SECRET

// 4. POST-DEPLOYMENT

//    A. Re-authenticate with Google:
//       - Visit: https://your-domain.com/api/auth
//       - Grant permissions
//       - Verify connection in dashboard

//    B. Test WhatsApp:
//       - Click "Test WhatsApp Connection" in dashboard
//       - Check if messages are received

//    C. Upload birthdays and create monthly events

//    D. Monitor cron job logs to ensure reminders are sent

// ================================================================
// TROUBLESHOOTING TIPS
// ================================================================

// Issue: "tokens.json not found"
// Solution: Visit /api/auth to authenticate with Google

// Issue: WhatsApp messages not sending
// Solution:
// - Verify all recipient numbers are registered in Meta Developer Console
// - Check ACCESS_TOKEN and PHONE_NUMBER_ID are correct
// - Ensure numbers include country code (e.g., 2348012345678)

// Issue: Cron job not running
// Solution:
// - Verify CRON_SECRET matches in .env and request header
// - Check Vercel cron logs in dashboard
// - Manually test: POST to /api/cron/check-reminders

// Issue: Calendar events not showing
// Solution:
// - Check GOOGLE_CALENDAR_ID is correct
// - Ensure calendar is accessible
// - Re-authenticate if tokens expired

// ================================================================
// EXCEL FILE FORMAT GUIDE
// ================================================================

// Your Excel file should have these columns (case-insensitive):

// | Name        | Birthday   | Phone         | SubUnit  |
// |-------------|------------|---------------|----------|
// | John Doe    | 1990-05-15 | 2348012345678 | Media    |
// | Jane Smith  | 1985-12-20 | 2348098765432 | Design   |

// Supported date formats:
// - YYYY-MM-DD (recommended)
// - MM/DD/YYYY
// - DD/MM/YYYY
// - Excel date numbers (auto-detected)

// Phone and SubUnit columns are optional.

// ================================================================
// */

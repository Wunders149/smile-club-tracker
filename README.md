# Smile Club Mahajanga Tracker 🦷✨

A comprehensive management system for Smile Club Mahajanga, designed to track volunteers, events, and attendance with automated persistence, professional reporting, and advanced analytics.

## 🚀 Features

### 👤 Volunteer Management
- Full CRUD for volunteer profiles (Name, Position, Department, Contact, Photo, Education).
- **Instant Search:** Real-time filtering of volunteers by name, email, or position.
- **Smart Image Upload:** Integration with **Supabase Storage** for cloud-based photo hosting.
- **Auto-Compression:** Photos are automatically compressed (max 100KB) before upload to save space and improve performance.
- **Storage Cleanup:** Old photos are automatically deleted from Supabase when updated or when a volunteer is removed.

### 📅 Event & Attendance Tracking
- Manage club events (Meetings, Training, Social Work, etc.) with a landscape **Annual Calendar** printout.
- Robust attendance recording system with instant search and bulk actions.
- Point-based ranking system:
  - **On-time:** 5 points
  - **Late:** 3 points
  - **Excused:** 1 point
  - **Absent:** 0 points
- **Printable Roster:** Generate professional attendance sheets with signature columns for any event.

### 🏆 Dynamic Rankings
- **Automated Leaderboard:** Points are calculated in real-time based on attendance records.
- **Yearly Reset:** Rankings automatically reset every new year to maintain fresh competition.
- **Historical Data:** Toggle between **Current Year** and **Last Year** to view past volunteer achievements.

### 🕸️ Interactive Organigram
- **Professional Hierarchy:** Clean, modern organizational chart featuring leadership and advisors.
- **Department Management:** Group volunteers into Administration, Education, Fundraising, Finance, and Communications.
- **Assisting Board Members:** Automatically highlighted and prioritized at the top of committee lists.
- **Interactive Editing:** Manage committee members directly through the organigram view.
- **Landscape Print:** High-quality, one-page printable organizational chart.

### 📇 Professional ID Badges
- **Selectable Printing:** Select specific volunteers using checkboxes for targeted bulk printing.
- **Professional Layout:** Vertical badges optimized for A4 (4 per page) featuring:
  - Smile Club Mahajanga Logo & Subtle Watermark
  - Volunteer Photo, Name, and Position
  - Contact Information
  - **"For The Patients!"** branding.

### 📊 Advanced Statistics
- **Demographics:** Gender distribution and medical vs. non-medical study field classifications.
- **Engagement:** Real-time tracking of total volunteers, total events, and club commitment trends.
- **Breakdowns:** Visualization of events by type and organizational distribution.

### 💾 Persistence & Backup System
Designed specifically for **Render.com Free Tier** limitations:
- **GitHub Sync:** The entire database state is automatically backed up to a private GitHub repository (`data.json`).
- **Auto-Restore:** The app automatically restores the latest database state from GitHub on every startup.
- **Write-on-Change:** Every change (Create, Update, Delete) triggers an immediate background sync to GitHub.

---

## 🛠 Tech Stack

- **Frontend:** React (TypeScript), Tailwind CSS, Lucide Icons, Framer Motion, Radix UI.
- **State Management:** TanStack Query (React Query).
- **Backend:** Node.js, Express.js (TypeScript).
- **Database:** PostgreSQL with **Drizzle ORM**.
- **Cloud Storage:** Supabase (for volunteer photos).
- **Image Processing:** browser-image-compression.

---

## ⚙️ Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgres://...

# Supabase (Storage)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# GitHub Backup (Persistence)
GITHUB_TOKEN=ghp_...
GITHUB_REPO=username/repo-name
GITHUB_PATH=data.json
```

---

**Built with ❤️ for Smile Club Mahajanga.**
"For The Patients!!."

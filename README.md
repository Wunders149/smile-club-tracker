# Smile Club Mahajanga Tracker 🦷✨

A comprehensive management system for Smile Club Mahajanga, designed to track volunteers, events, and attendance with automated persistence and professional badge generation.

## 🚀 Features

### 👤 Volunteer Management
- Full CRUD for volunteer profiles (Name, Position, Contact, Photo, Education).
- **Smart Image Upload:** Integration with **Supabase Storage** for cloud-based photo hosting.
- **Auto-Compression:** Photos are automatically compressed (max 100KB) before upload to save space and improve performance.
- **Storage Cleanup:** Old photos are automatically deleted from Supabase when updated or when a volunteer is removed.

### 📅 Event & Attendance Tracking
- Manage club events (Meetings, Training, Social Work, etc.).
- Robust attendance recording system with a point-based ranking:
  - **On-time:** 5 points
  - **Late:** 3 points
  - **Excused:** 1 point
  - **Absent:** 0 points
- Automatic points calculation for the **Global Leaderboard (Rankings)**.

### 📇 Professional ID Badges
- **Selectable Printing:** Select specific volunteers using checkboxes for targeted bulk printing.
- **Professional Layout:** Vertical badges featuring:
  - Smile Club Mahajanga Logo
  - Volunteer Photo
  - Full Name & Position
  - Contact Phone
  - **"For The Patients!"** footer.
  - Subtle **watermark logo** for authenticity.
- High-quality print output optimized for standard badge sizes.

### 📊 Real-time Statistics
- Demographic breakdowns (Gender, Study Fields, Positions).
- Engagement trends and growth metrics.

### 💾 Persistence & Backup System
Designed specifically for **Render.com Free Tier** limitations:
- **GitHub Sync:** The entire database state (Volunteers, Events, Attendance) is automatically backed up to a private GitHub repository (`data.json`).
- **Auto-Restore:** On every application startup (redeploys/restart), the app fetches the latest backup from GitHub and restores the database state.
- **Write-on-Change:** Every Create, Update, or Delete operation triggers an immediate background sync to GitHub.

---

## 🛠 Tech Stack

- **Frontend:** React (TypeScript), Tailwind CSS, Lucide Icons, Framer Motion, Radix UI.
- **State Management:** TanStack Query (React Query).
- **Backend:** Express.js (TypeScript).
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

## 🏗 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd smile-club-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy the example variables to `.env` and fill in your credentials.

4. **Initialize Database:**
   ```bash
   npm run db:push
   ```

5. **Start Development:**
   ```bash
   npm run dev
   ```

---

## 📑 Maintenance
For detailed information on handling the Render.com 90-day database reset and manual syncing, please refer to the [MAINTENANCE.md](./MAINTENANCE.md) guide.

---

**Built with ❤️ for Smile Club Mahajanga.**
"For The Patients!!."

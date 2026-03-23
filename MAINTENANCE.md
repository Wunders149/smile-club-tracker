# Smile Club Mahajanga - Maintenance Guide 🚀

This guide explains how to manage your data persistence and handle the Render.com 90-day PostgreSQL reset.

---

## 1. The Backup System (GitHub API)
Since you are using the **Render Free Tier**, your database expires every 90 days and the local filesystem is deleted on every restart. 

**Our Solution:** Your app automatically syncs all data (Volunteers, Events, Attendance) to a private GitHub repository.

- **Automatic Restore:** Every time the app starts (after a redeploy or sleep), it fetches `data.json` from GitHub and restores it to the database.
- **Automatic Backup:** The app saves its state to GitHub every 1 hour.
- **Manual Sync:** Use the **"Sync to GitHub"** button in the sidebar to save changes immediately.

---

## 2. The 90-Day Database Reset (CRITICAL)
Render.com deletes Free Tier databases after 90 days. To keep your data forever without paying, follow these steps when you receive the 90-day warning email from Render:

### Step-by-Step Reset (Takes 5 Minutes):
1.  **Manual Sync:** Open your app and click the **"Sync to GitHub"** button. Verify that the `data.json` file in your GitHub repo has a "just now" timestamp.
2.  **Create New DB:** In the Render Dashboard, click **New +** > **PostgreSQL**.
    - Name: `smile-club-db-v2` (increment the version).
    - Region: Same as your Web Service.
3.  **Get New URL:** Copy the **Internal Database URL** of the new database.
4.  **Update Web Service:**
    - Go to your **Web Service** > **Environment**.
    - Update the `DATABASE_URL` variable with the new URL.
    - Click **Save Changes**.
5.  **Auto-Restore:** Render will redeploy your app. On startup, the app will:
    - See the new empty database.
    - Fetch the latest `data.json` from your GitHub.
    - **Automatically populate** the new database with all your data.

---

## 3. Required Environment Variables
Ensure these are always set in your Render Web Service:

| Key | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgres://...` | Connection string for Render PostgreSQL. |
| `RESEND_API_KEY` | `re_...` | API Key from Resend.com for sending emails. |
| `FROM_EMAIL` | `...` | (Optional) Verified sender email in Resend. Defaults to onboarding@resend.dev. |
| `GITHUB_TOKEN` | `ghp_...` | Your GitHub Personal Access Token (with `repo` scope). |
| `GITHUB_REPO` | `Wunders149/smile-club-backups` | Your private backup repository. |
| `GITHUB_PATH` | `data.json` | The filename for your backup. |
| `NODE_ENV` | `production` | Ensures the app runs in production mode. |

---

## 4. Troubleshooting
- **Data is missing after redeploy?** 
  - Check the Render logs for `[backup]`. 
  - If you see `GitHub API error: 404`, check if `GITHUB_REPO` or `GITHUB_PATH` is correct.
  - If you see `Bad credentials`, your `GITHUB_TOKEN` has expired or is invalid.
- **"Sync to GitHub" button is grey?**
  - The button disables itself while a sync is in progress. Wait 5 seconds.

---

**Last updated:** March 11, 2026
**Project:** Smile Club Mahajanga Tracker

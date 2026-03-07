# CollectionTracker

A full-stack web application for managing member collections and group expenses for **Biruver Kanthavara Billava Sangha**.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT + bcryptjs

## Setup

1. Install dependencies in root, client, and server:
   ```bash
   npm install
   npm install --prefix server
   npm install --prefix client
   ```

2. Seed the database (creates bootstrap admin):
   ```bash
   npm run seed
   ```

3. Start the development servers:
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## First-Time Setup

1. Open http://localhost:5173
2. Click **Login** → select "Admin" → password: `admin123`
3. Go to **Members** → Add each member (name, phone, and prior contributions if applicable)
4. Go to **Admin Panel** → Promote the appropriate member(s) to admin
5. Optionally delete the bootstrap "Admin" account once real admins are set up

## Features

- **Dashboard**: Balance overview, monthly stats, recent activity feed
- **Members**: Member list with search, flagged members (overdue), member profiles with payment history
- **Collections**: Monthly payment tracking with pivot-style view per member
- **Expenses**: Expense management with month filtering
- **Admin Panel**: Manage admin roles, change password
- **Export**: Download Excel or PDF reports (admin only)

## Notes

- All members can view the site without logging in
- Only admins can add or edit data
- Export Excel/PDF from the **Export** dropdown in the navbar (admin only)
- To change your password: Admin Panel → Change My Password
- If an admin is locked out: another admin can demote and re-promote them with a new password
- "Prior Contributions" captures amounts paid before the app was set up (opening balance)
- Members missing 2+ of the last 3 months' collections are flagged with an ⚠ Overdue badge

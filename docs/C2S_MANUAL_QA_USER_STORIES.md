# C2S Manual QA — User Stories & Test Script

**Purpose:** Manual QA checklist for Connect2Souls (Group Finder + dashboard).  
**App:** COG Studio (Firebase App Hosting)  
**Accounts:** [`PLACEHOLDER_ACCOUNTS.md`](./PLACEHOLDER_ACCOUNTS.md)

---

## 0. Test environment

| Item | Value |
|---|---|
| Login | https://studio--cog-app-studio.asia-southeast1.hosted.app/login |
| Public Group Finder | https://studio--cog-app-studio.asia-southeast1.hosted.app/public/c2s-join |
| Demo group to use | **QA Demo C2S Group** |

### Accounts under test

| Persona | Email | Password | Use for |
|---|---|---|---|
| Public visitor | *(none)* | — | Group Finder / join form |
| C2S Mentor | `qa.c2s.mentor@cogdasma.local` | `QaC2sMentor#2026` | My Group, approve joins, sessions |
| C2S Admin | `qa.c2s.admin@cogdasma.local` | `QaC2sAdmin#2026` | `/c2s` admin Groups / Mentees / Analytics |
| QA Super Admin | `qa.superadmin@cogdasma.local` | `QaSuperAdmin#2026` | Smoke full access (optional) |

**Pass / Fail columns:** mark each step ☐ Pass / ☐ Fail and note bugs with screenshot + URL.

---

## US-01 — Public visitor finds a group

**As a** public visitor  
**I want to** browse C2S groups without logging in  
**So that** I can find a group that fits me  

### Preconditions
- Incognito / logged out browser  
- Open Group Finder URL above  

### Steps

| # | Action | Expected |
|---|---|---|
| 1 | Open `/public/c2s-join` | Page loads; title/branding for COG / Group Finder; **no login required** |
| 2 | Confirm list shows groups | At least **QA Demo C2S Group** appears (or other live groups) |
| 3 | Use **Search** (type part of group name) | List filters to matching groups |
| 4 | Change **Age Group** / **Meetup Day** / **Barangay** / **Demographics** filters | Options appear; list updates (or empty state if no match) |
| 5 | Reset filters / clear search | Full list returns |
| 6 | View a group card | Shows location, schedule, age info, demographics badges when present |
| 7 | Check map (if visible) | Map loads; pins appear for groups with coordinates; selecting a pin highlights / focuses that group |

**Result:** ☐ Pass ☐ Fail  Notes: _________________

---

## US-02 — Public visitor submits a join request

**As a** public visitor  
**I want to** apply to join a C2S group  
**So that** a mentor can review and accept me  

### Preconditions
- Logged out  
- Group Finder open  
- Pick **QA Demo C2S Group** (owned by QA Mentor)

### Steps

| # | Action | Expected |
|---|---|---|
| 1 | Click **Join** on QA Demo C2S Group | Join dialog / form opens |
| 2 | Leave required fields empty and submit | Validation errors; request not sent |
| 3 | Fill required fields with unique test data: first name, last name, email (`qa.join.+timestamp@example.com`), phone, birthday, gender; check privacy | Form accepts input |
| 4 | Optionally fill Facebook/social, first-attended month/year, notes | Optional fields save with request |
| 5 | Submit | Success message; dialog closes or confirms submission |
| 6 | Submit again with same email (optional) | App either allows another pending request or shows a clear error — note actual behavior |

**Record for next stories:**  
Applicant name: _______________ Email: _______________ Phone: _______________

**Result:** ☐ Pass ☐ Fail  Notes: _________________

---

## US-03 — Mentor logs in and opens My Group

**As a** C2S mentor  
**I want to** open my group dashboard  
**So that** I can manage join requests and mentees  

### Preconditions
- Use Mentor account  

### Steps

| # | Action | Expected |
|---|---|---|
| 1 | Open Login URL; sign in with Mentor email/password | Login succeeds; lands in Studio |
| 2 | Find **Connect 2 Souls** in the sidebar | Nav item visible |
| 3 | Open **My Group** (`/c2s/my-group`) | Page loads for mentor |
| 4 | Confirm group **QA Demo C2S Group** is shown | Group profile / cards visible |
| 5 | Confirm sections exist | Profile, Join requests, Mentees, Sessions, Analytics (or equivalent cards) |

**Result:** ☐ Pass ☐ Fail  Notes: _________________

---

## US-04 — Mentor reviews and approves a join request

**As a** C2S mentor  
**I want to** approve a join request  
**So that** the person becomes a mentee in my group  

### Preconditions
- US-02 completed (pending request for QA Demo C2S Group)  
- Logged in as Mentor  

### Steps

| # | Action | Expected |
|---|---|---|
| 1 | Open Join Requests on My Group | Pending request from US-02 appears |
| 2 | Open / inspect request details | Name, email, phone visible; ideally birthday/gender/social/notes if UI shows them |
| 3 | **Approve** the request | Success feedback; request leaves pending (or shows Approved) |
| 4 | Open **Mentees** list | New mentee appears with correct name / contact; status roughly “In Progress” or active |
| 5 | (Optional) Check Studio **Approvals** (`/approvals`) | C2S join item resolved / no longer pending for this request |

**Result:** ☐ Pass ☐ Fail  Notes: _________________

---

## US-05 — Mentor rejects a join request

**As a** C2S mentor  
**I want to** reject a join request with a reason  
**So that** unsuitable applications are closed  

### Preconditions
- Submit a **second** public join request (US-02) with a different email  
- Logged in as Mentor  

### Steps

| # | Action | Expected |
|---|---|---|
| 1 | Find the new pending request | Visible in Join Requests |
| 2 | **Reject** (enter reason if required) | Cannot reject without reason if UI requires it |
| 3 | Confirm rejection | Request no longer pending; status Rejected |
| 4 | Check Mentees | Rejected applicant is **not** added as mentee |

**Result:** ☐ Pass ☐ Fail  Notes: _________________

---

## US-06 — Mentor updates group public profile

**As a** C2S mentor  
**I want to** edit my group’s public profile  
**So that** the Group Finder shows accurate info  

### Preconditions
- Logged in as Mentor → My Group  

### Steps

| # | Action | Expected |
|---|---|---|
| 1 | Edit location / meeting schedule / current module | Save succeeds |
| 2 | Edit age label / age range / meetup day / demographics | Save succeeds |
| 3 | Set or change map lat/lng (if fields exist) | Save succeeds |
| 4 | Open Group Finder (incognito) and find the group | Public card reflects updated fields (refresh if cached) |

**Result:** ☐ Pass ☐ Fail  Notes: _________________

---

## US-07 — Mentor manages mentees

**As a** C2S mentor  
**I want to** add, edit, and remove mentees  
**So that** my roster stays accurate  

### Preconditions
- Logged in as Mentor  
- At least one mentee (from US-04) or add manually  

### Steps

| # | Action | Expected |
|---|---|---|
| 1 | **Add** mentee (name, email, phone, status/notes as available) | Mentee appears in list |
| 2 | **Edit** mentee notes / status | Changes persist after refresh |
| 3 | **Delete** a test mentee (not the only one you need later, if possible) | Removed from list |

**Result:** ☐ Pass ☐ Fail  Notes: _________________

---

## US-08 — Mentor records a session and attendance

**As a** C2S mentor  
**I want to** create a session and mark attendance  
**So that** we track who came  

### Preconditions
- Logged in as Mentor  
- At least one mentee in the group  

### Steps

| # | Action | Expected |
|---|---|---|
| 1 | Create a **session** (date, module/notes if available) | Session appears in list |
| 2 | Mark some mentees present / absent | Attendance saves |
| 3 | Edit session notes or attendance | Updates persist |
| 4 | Check group **Analytics** card | Charts / stats update (attendance rate or status breakdown — note what you see) |
| 5 | (Optional) Delete a test session | Session removed |

**Result:** ☐ Pass ☐ Fail  Notes: _________________

---

## US-09 — C2S Admin manages groups and mentees

**As a** C2S admin  
**I want to** manage all groups and mentees  
**So that** I can support mentors and keep data clean  

### Preconditions
- Log out Mentor  
- Log in as **C2S Admin**  

### Steps

| # | Action | Expected |
|---|---|---|
| 1 | Open **Connect 2 Souls** → main `/c2s` (not only My Group) | Admin Groups / Mentees / Analytics tabs or sections load |
| 2 | View **Groups** list | Includes QA Demo C2S Group (and others) |
| 3 | Create a temporary group (name + mentor if required) **or** edit an existing non-critical field | Create/edit succeeds |
| 4 | Open **Mentees** directory | Can see mentees across groups; find the mentee from US-04 |
| 5 | Try Search/Filter on mentees if controls exist | Filters work **or** note “UI present but not wired” as a bug/known gap |
| 6 | Open **Analytics** | Charts render without error |

**Cleanup:** delete any temporary group you created, if safe.

**Result:** ☐ Pass ☐ Fail  Notes: _________________

---

## US-10 — Role boundaries (negative tests)

**As** QA  
**I want to** confirm permissions  
**So that** users only see what they should  

### Steps

| # | Action | Expected |
|---|---|---|
| 1 | Logged out → open `/c2s` or `/c2s/my-group` | Redirected to login |
| 2 | Logged out → `/public/c2s-join` | Still accessible |
| 3 | Log in as **C2S Admin** → open `/c2s` | Allowed |
| 4 | Log in as **Mentor** → open `/c2s` | Redirected to My Group **or** limited view (note actual behavior) |
| 5 | Mentor cannot manage unrelated admin-only settings (e.g. Roles) if nav hidden | No unintended admin access |

**Result:** ☐ Pass ☐ Fail  Notes: _________________

---

## US-11 — End-to-end smoke (happy path)

Run in one sitting:

1. ☐ Public finds **QA Demo C2S Group** (US-01)  
2. ☐ Public submits join (US-02)  
3. ☐ Mentor approves (US-03 + US-04)  
4. ☐ Mentee appears; mentor creates session + attendance (US-08)  
5. ☐ Admin sees group/mentee/analytics (US-09)  

**Overall E2E:** ☐ Pass ☐ Fail  Build / date: _______________

---

## Bug report template

```
Title:
URL:
Account used:
Steps to reproduce:
Expected:
Actual:
Screenshot / video:
Severity: Blocker / Major / Minor / Cosmetics
```

---

## Out of scope for this sheet

- Custom domain `c2s.cogdasma.app`  
- Standalone `apps/c2s-public` local port `:9004` (unless asked)  
- Non-C2S modules (inventory, schedule, etc.) — use other QA sheets  

---

*Keep this sheet with `PLACEHOLDER_ACCOUNTS.md`. After QA cycle, set `QA_SEED_ON_DEPLOY=false` in `apphosting.yaml` so deploys stop re-seeding.*

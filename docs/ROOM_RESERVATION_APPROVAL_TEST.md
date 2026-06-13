# Testing the New Room Reservation Approval Process

This is a step-by-step guide for trying out the new Room Reservation approval
flow in your browser. No technical knowledge is required — just follow the
steps in order.

## What changed

Submitting a room reservation now goes through **3 approval steps** before
it's confirmed:

1. **Ministry Head** approval
2. **Department Head** approval
3. **Room Reservation Manager** approval (final)

If any step **rejects** the request, the requester must be told why — the
person rejecting will be asked to type a reason, and the booking is marked
**Rejected**.

If all 3 steps approve, the booking becomes **Approved**.

> **Note on this test environment:** Right now, no one has been assigned as a
> Ministry Head, Department Head, or Room Reservation Manager yet. Until those
> people are assigned (a separate setup task), **Super Admin accounts can act
> on all 3 approval steps** as a stand-in. This is expected — it's how the
> system avoids getting "stuck" with no approver. For this test, log in with a
> Super Admin account (e.g. `njcarlo@gmail.com`) to play the role of each
> approver.

## Before you start

1. Make sure the app is running. Open your browser and go to:
   **http://localhost:9002**
2. Log in with your account.

---

## Test 1 — Submit a request and approve it all the way through

### Step 1: Submit a new room reservation
1. Go to **Reservations → New Reservation** (or visit
   `http://localhost:9002/reservations/new`).
2. Fill out the form (pick any room, date, time, and purpose — write
   something like "TEST BOOKING — safe to delete" in the title/purpose so
   it's easy to recognize later).
3. Submit the request.
4. ✅ **Expected result:** You see a confirmation message, and the request
   status is **"Pending Ministry Approval"**.

### Step 2: View the request in Approvals
1. Go to **Approvals** (or visit `http://localhost:9002/approvals`).
2. ✅ **Expected result:** Your test booking appears as a card in the
   **Pending** column, with type **"Room Booking"** and your test title
   showing in the details.

### Step 3: Approve — Stage 1 (Ministry Head)
1. Click the card to open it, or use the approve/reject buttons on the card.
2. Click **Approve**.
3. ✅ **Expected result:**
   - A success message appears ("Forwarded for next approval").
   - The card stays in **Pending**, but its status changes to
     **"Pending Admin Approval"**.

### Step 4: Approve — Stage 2 (Department Head)
1. The same card should still be visible and actionable (since your account
   is standing in as the approver for this stage too).
2. Click **Approve** again.
3. ✅ **Expected result:**
   - Success message appears again.
   - Status remains **"Pending Admin Approval"** (this stage and the next one
     share the same status label).

### Step 5: Approve — Stage 3 (Room Reservation Manager — final)
1. Click **Approve** one more time.
2. ✅ **Expected result:**
   - Success message says the request was **Approved**.
   - The card moves from the **Pending** column to the **Approved** column.
   - If you check the reservation in **Reservations → My Reservations** or the
     room **Calendar**, it should now show as **Approved**.

---

## Test 2 — Submit a request and reject it (with a reason)

### Step 1: Submit another test booking
Repeat **Test 1, Step 1** to create a second test booking (e.g. title
"TEST BOOKING 2 — reject path — safe to delete").

### Step 2: Reject at Stage 1
1. Go to **Approvals**, find the new card in **Pending**.
2. Click **Reject**.
3. ✅ **Expected result:** A dialog box pops up asking for **"Reason for
   rejection"**. You cannot submit without typing something.
4. Type a reason, e.g. "Testing rejection — room unavailable".
5. Click **Reject Request**.
6. ✅ **Expected result:**
   - Success message appears.
   - The card moves from **Pending** to the **Rejected** column.
   - If you open the card again, the reason you typed should be visible.
   - The reservation's status (in My Reservations / Calendar) should show as
     **Rejected**.

---

## Cleanup

The two test bookings created above are real database records. Once you've
confirmed everything works, ask for them to be removed (or note their titles
so they can be cleaned up later) — they shouldn't be left in the system as if
they were real reservations.

## What to report back

For each test, let us know:
- Did the status change exactly as described at each step?
- Did the "Reason for rejection" box appear and require text before
  submitting?
- Did the final Approved/Rejected reservation show correctly outside the
  Approvals page (My Reservations / Calendar)?
- Anything that looked wrong, confusing, or didn't match the steps above.

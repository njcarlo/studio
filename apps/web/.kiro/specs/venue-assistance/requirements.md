# Requirements Document

## Introduction

The Venue Assistance module extends the church management app's room reservation system by coordinating ministry support for booked rooms. When a room is booked, the relevant ministries (e.g. Technology, Audio, Facilities) are automatically notified to provide their pre-configured assistance items (e.g. projector, microphone, chairs). Ministry heads can review, adjust, and approve or decline their assistance commitments. An admin command center provides a unified view of all assistance requests and their statuses. This module is fully Supabase-based and standalone — it manages its own bookings in Supabase and does not bridge with any external reservation system.

---

## Glossary

- **Venue_Assistance_Module**: The Supabase-based system described in this document. It is standalone and does not integrate with any external reservation system.
- **Booking**: A room reservation managed within the Venue_Assistance_Module's Supabase database. Bookings may be one-time or recurring.
- **Recurring_Booking**: A Booking that repeats on a defined schedule (e.g. every Sunday). Each occurrence is treated as an individual Booking instance linked to a parent Recurring_Booking record.
- **Room**: A physical space in the church that can be reserved.
- **Ministry**: An organizational unit (e.g. Technology, Audio, Facilities) that provides assistance for room bookings. Each Ministry has a single designated head identified by the `headId` field on the Ministry record.
- **Ministry_Head**: The user identified by the `headId` field on a Ministry record. This person is the sole designated leader of the Ministry and is the recipient of all Notifications and the responder for all Assistance_Requests belonging to that Ministry.
- **Assistance_Configuration**: The mapping of a Ministry to a Room, including the list of Assistance_Items the Ministry provides for that Room. Can be managed by admins or by the Ministry_Head of the relevant Ministry.
- **Assistance_Item**: A specific resource or service a Ministry provides for a Room (e.g. projector, 2 technicians, microphone).
- **Assistance_Request**: A per-ministry record generated when a Booking is made, representing the Ministry's obligation to provide assistance for that Booking. An Assistance_Request has a request-level status and individual item-level statuses.
- **Assistance_Response**: The Ministry_Head's reply to an Assistance_Request, including item-level approvals or declines, optional item adjustments, and an optional explanation.
- **Command_Center**: An admin-facing dashboard showing all Assistance_Requests and their statuses across all Bookings.
- **SLA**: Service Level Agreement — the maximum time a Ministry has to respond to an Assistance_Request before an escalation Notification is sent.
- **Notification**: An alert sent via email and in-app to inform a user of an event requiring their attention.

---

## Requirements

### Requirement 1: Assistance Configuration

**User Story:** As an admin or ministry head, I want to configure which ministries provide assistance for each room and what items they provide, so that the right ministries are automatically engaged when a room is booked.

#### Acceptance Criteria

1. THE Venue_Assistance_Module SHALL provide a settings interface for managing Assistance_Configurations.
2. WHEN an admin creates an Assistance_Configuration, THE Venue_Assistance_Module SHALL associate one Ministry with one Room and one or more Assistance_Items.
3. WHEN an admin updates an Assistance_Configuration, THE Venue_Assistance_Module SHALL save the updated configuration and record the change in the audit log.
4. THE Venue_Assistance_Module SHALL allow a single Room to have Assistance_Configurations from multiple Ministries.
5. THE Venue_Assistance_Module SHALL allow each Assistance_Item to be marked as optional or required at the time of configuration.
6. WHEN an admin deletes an Assistance_Configuration, THE Venue_Assistance_Module SHALL remove the configuration without affecting existing Assistance_Requests already generated from it.
7. WHERE the `manage_own_ministry_assistance` permission is granted, THE Venue_Assistance_Module SHALL allow the Ministry_Head to create, edit, and delete Assistance_Configurations scoped to Rooms assigned to their own Ministry.

---

### Requirement 2: Permission Control for Assistance Configuration

**User Story:** As an admin, I want to control which roles can manage Assistance_Configurations, so that only authorized users can change ministry assignments.

#### Acceptance Criteria

1. THE Venue_Assistance_Module SHALL enforce a `manage_venue_assistance` permission for creating, editing, and deleting Assistance_Configurations across all Ministries and Rooms.
2. THE Venue_Assistance_Module SHALL enforce a `manage_own_ministry_assistance` permission that allows a Ministry_Head to create, edit, and delete Assistance_Configurations only for Rooms assigned to their own Ministry.
3. WHEN a user without the `manage_venue_assistance` or `manage_own_ministry_assistance` permission attempts to modify an Assistance_Configuration, THE Venue_Assistance_Module SHALL deny the action and display an error message.
4. WHEN a user with only the `manage_own_ministry_assistance` permission attempts to modify an Assistance_Configuration belonging to a different Ministry, THE Venue_Assistance_Module SHALL deny the action and display an error message.
5. THE Venue_Assistance_Module SHALL expose both the `manage_venue_assistance` and `manage_own_ministry_assistance` permissions in the existing Settings > Permissions interface for assignment to roles.

---

### Requirement 3: Assistance Request Generation

**User Story:** As a system, I want to automatically generate Assistance_Requests when a booking is submitted and when it is approved, so that ministries are informed at both stages.

#### Acceptance Criteria

1. WHEN a Booking is submitted, THE Venue_Assistance_Module SHALL generate one Assistance_Request per Ministry that has an Assistance_Configuration for the booked Room.
2. WHEN a Booking is approved, THE Venue_Assistance_Module SHALL send a follow-up Notification to each Ministry_Head associated with the Booking's Assistance_Requests.
3. THE Venue_Assistance_Module SHALL set the initial status of each generated Assistance_Request to `Pending`.
4. IF a Booking is cancelled before any Assistance_Request is responded to, THEN THE Venue_Assistance_Module SHALL update all associated Assistance_Requests to status `Cancelled` and notify the relevant Ministry_Heads.
5. THE Venue_Assistance_Module SHALL include the following data in each Assistance_Request: Room name, event name, event date and time, requester name, and the list of Assistance_Items for that Ministry.
6. WHEN a Recurring_Booking is created, THE Venue_Assistance_Module SHALL generate one set of Assistance_Requests per occurrence of the Recurring_Booking, following the same rules as for a one-time Booking.

---

### Requirement 4: Ministry Notification

**User Story:** As a ministry head, I want to be notified when my ministry's assistance is needed for a booking, so that I can prepare and confirm in time.

#### Acceptance Criteria

1. WHEN an Assistance_Request is generated, THE Venue_Assistance_Module SHALL send a Notification to the Ministry_Head identified by the `headId` field of the associated Ministry, via email and in-app.
2. THE Notification SHALL include a direct link to the Assistance_Request detail page where the Ministry_Head can review and respond.
3. WHEN a Booking is approved and the associated Assistance_Requests are still in `Pending` status, THE Venue_Assistance_Module SHALL send a reminder Notification to the relevant Ministry_Heads.
4. WHEN an Assistance_Request has been in `Pending` status for 3 days without a response, THE Venue_Assistance_Module SHALL send an SLA escalation Notification to the Ministry_Head and to all users with the `manage_venue_assistance` permission.
5. WHEN the event date of a Booking is 3 days away and the associated Assistance_Request is not in `Approved` or `Partial` status, THE Venue_Assistance_Module SHALL send a pre-event reminder Notification to the Ministry_Head.
6. WHEN a Ministry_Head declines an Assistance_Request or declines one or more Assistance_Items within a request, THE Venue_Assistance_Module SHALL send a Notification to the Booking requester informing them of the decline and including the Ministry_Head's explanation if provided.

---

### Requirement 5: Assistance Response by Ministry Head

**User Story:** As a ministry head, I want to review, adjust, and respond to an Assistance_Request at the item level, so that I can confirm exactly what my ministry will and will not provide.

#### Acceptance Criteria

1. WHEN a Ministry_Head opens an Assistance_Request, THE Venue_Assistance_Module SHALL display the Booking details and the list of Assistance_Items configured for their Ministry, each with its current item-level status.
2. THE Venue_Assistance_Module SHALL allow the Ministry_Head to adjust individual Assistance_Items (e.g. change quantity or description) before submitting a response.
3. THE Venue_Assistance_Module SHALL allow the Ministry_Head to set each Assistance_Item to either `Approved` or `Declined` individually.
4. THE Venue_Assistance_Module SHALL allow the Ministry_Head to include an optional explanation text when submitting a response.
5. WHEN a Ministry_Head submits a response, THE Venue_Assistance_Module SHALL derive the Assistance_Request status as follows: `Approved` if all items are approved, `Declined` if all items are declined, and `Partial` if some items are approved and some are declined.
6. WHEN a Ministry_Head submits a response, THE Venue_Assistance_Module SHALL update the Assistance_Request status and record the response details including item-level statuses, any item adjustments, and the explanation.
7. WHEN an Assistance_Request status changes, THE Venue_Assistance_Module SHALL send a Notification to the Booking requester and to users with the `manage_venue_assistance` permission.
8. WHEN a Recurring_Booking has multiple pending Assistance_Requests for the same Ministry, THE Venue_Assistance_Module SHALL allow the Ministry_Head to submit a single response that applies to all occurrences at once, or to respond to each occurrence individually.

---

### Requirement 6: Admin Command Center

**User Story:** As an admin, I want a command center that shows all Assistance_Requests and their statuses, so that I can monitor ministry engagement across all bookings.

#### Acceptance Criteria

1. THE Venue_Assistance_Module SHALL provide a Command_Center page accessible to users with the `manage_venue_assistance` permission.
2. THE Command_Center SHALL display all Assistance_Requests grouped by Booking, showing the Ministry name, status, and last updated timestamp for each.
3. THE Command_Center SHALL allow filtering Assistance_Requests by status (`Pending`, `Approved`, `Partial`, `Declined`, `Cancelled`, `In_Progress`, `Fulfilled`), Ministry, and date range.
4. WHEN an admin selects an Assistance_Request in the Command_Center, THE Venue_Assistance_Module SHALL display the full request detail including Booking information, Assistance_Items with their item-level statuses, and the Ministry_Head's response if available.
5. THE Command_Center SHALL visually distinguish Assistance_Requests that have exceeded the 3-day SLA without a response.
6. THE Command_Center SHALL visually distinguish Assistance_Requests for events occurring within 3 days that are not yet in `Approved` or `Partial` status.

---

### Requirement 7: SLA and Escalation

**User Story:** As an admin, I want unresponded requests to trigger escalation notifications, so that no booking falls through the cracks.

#### Acceptance Criteria

1. THE Venue_Assistance_Module SHALL track the creation timestamp of each Assistance_Request.
2. WHEN 3 days have elapsed since an Assistance_Request was created and its status remains `Pending`, THE Venue_Assistance_Module SHALL trigger an SLA escalation Notification.
3. THE SLA escalation Notification SHALL be sent to the Ministry_Head of the overdue Assistance_Request and to all users with the `manage_venue_assistance` permission.
4. THE Venue_Assistance_Module SHALL allow the SLA duration to be configured globally in the settings by users with the `manage_venue_assistance` permission.
5. IF an Assistance_Request is responded to before the SLA deadline, THEN THE Venue_Assistance_Module SHALL not send the SLA escalation Notification for that request.

---

### Requirement 8: Audit Trail

**User Story:** As an admin, I want all changes to Assistance_Requests and Assistance_Configurations to be logged, so that I have a traceable history of decisions.

#### Acceptance Criteria

1. WHEN an Assistance_Configuration is created, updated, or deleted, THE Venue_Assistance_Module SHALL write an entry to the audit log including the user, timestamp, and the before/after values.
2. WHEN an Assistance_Request status changes, THE Venue_Assistance_Module SHALL write an entry to the audit log including the Ministry_Head, timestamp, new status, item-level statuses, item adjustments, and explanation.
3. THE Venue_Assistance_Module SHALL make audit log entries for Assistance_Requests viewable from the Command_Center detail view.

---

### Requirement 9: Check-In Integration

**User Story:** As a system, I want assistance requests to reflect real-time event status based on check-in and booking end time, so that ministry teams know when to begin and when their work is complete.

#### Acceptance Criteria

1. WHEN the QR code for a Booking is scanned on the room display page, THE Venue_Assistance_Module SHALL update all `Approved` and `Partial` Assistance_Requests associated with that Booking to status `In_Progress`.
2. WHEN the end time of a Booking passes, THE Venue_Assistance_Module SHALL update all `In_Progress` Assistance_Requests associated with that Booking to status `Fulfilled`.
3. THE Venue_Assistance_Module SHALL not update Assistance_Requests in `Declined` or `Cancelled` status when a QR code is scanned or when a Booking end time passes.
4. WHEN an Assistance_Request transitions to `In_Progress`, THE Venue_Assistance_Module SHALL write an entry to the audit log including the Booking, timestamp, and trigger source (QR scan).
5. WHEN an Assistance_Request transitions to `Fulfilled`, THE Venue_Assistance_Module SHALL write an entry to the audit log including the Booking, timestamp, and trigger source (booking end time).

---

### Requirement 10: Recurring Bookings

**User Story:** As a booking requester, I want to create recurring bookings and have assistance requests automatically generated for each occurrence, so that ministry support is coordinated for every instance of a repeating event.

#### Acceptance Criteria

1. THE Venue_Assistance_Module SHALL allow a Booking to be created as a Recurring_Booking with a defined recurrence schedule (e.g. weekly on a specific day).
2. WHEN a Recurring_Booking is created, THE Venue_Assistance_Module SHALL generate individual Booking instances for each occurrence within the defined schedule.
3. WHEN a Recurring_Booking instance is generated, THE Venue_Assistance_Module SHALL generate Assistance_Requests for that instance following the same rules as for a one-time Booking.
4. THE Venue_Assistance_Module SHALL allow a Ministry_Head to respond to all pending Assistance_Requests for a Recurring_Booking's occurrences in a single bulk action.
5. THE Venue_Assistance_Module SHALL allow a Ministry_Head to respond to individual occurrences of a Recurring_Booking independently, overriding any bulk response for that occurrence.
6. WHEN a single occurrence of a Recurring_Booking is cancelled, THE Venue_Assistance_Module SHALL cancel only the Assistance_Requests for that occurrence without affecting other occurrences.
7. WHEN an entire Recurring_Booking is cancelled, THE Venue_Assistance_Module SHALL cancel all pending Assistance_Requests across all occurrences and notify the relevant Ministry_Heads.

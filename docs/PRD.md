# Tasky — Product Requirements Document

## 1. Document Overview

**Purpose:** Define the requirements for the first MVP release of Tasky.

**Product definition:** Tasky is a web-based project and task management platform for small teams that centralizes work, clarifies task ownership, supports collaboration, and helps teams organize projects and responsibilities.

**Stage / release / phase:** New product, MVP.

**Owner / developer:** Omar Saghir.

**Primary delivery goal:** Build a complete MVP that can be presented in a CV, published on GitHub, and made available as a public live demo.

---

## 2. Executive Summary

Tasky is designed for small teams that currently manage work in a manual and decentralized way. The product addresses three main problems: tasks becoming lost or scattered, unclear responsibility for each task, and difficulty organizing work and collaboration between team members.

The MVP will support one workspace per user, one Admin per workspace, multiple Managers, and multiple Members. The Admin controls the workspace and accounts, creates projects, assigns Managers, and has full visibility. Managers operate the projects assigned to them. Members work on assigned tasks while still being able to see all tasks within the projects they belong to.

The MVP will include project management, task assignment and workflow, comments, file attachments, simple search and filters, in-app notifications, user account management, and a simple responsive dashboard. The product will be English-only, responsive on desktop and mobile, and intended for daily use by small teams.

---

## 3. Problem & Opportunity

### Problem statement
Small teams may manage tasks in a manual and decentralized way, which can cause tasks to become scattered or forgotten and can make responsibility for each task unclear.

### Affected users
Small work teams that need a simple way to organize projects, divide tasks, assign responsibility, and collaborate.

### Current state
Work is managed manually and in a decentralized manner.

### Why it matters
Without a shared system, teams may lose track of tasks, struggle to understand ownership, and experience weaker coordination between team members.

### Why now
Tasky is being created as a new portfolio project to demonstrate the ability to define and build a complete full-stack product.

### Consequence of inaction
The team would continue using decentralized task management, with continued risk of lost tasks and unclear responsibilities.

---

## 4. Users & Actors

### 4.1 Admin

The Admin owns and controls a single workspace.

Primary responsibilities:
- Manage the workspace.
- Create and manage Manager and Member accounts.
- Create projects.
- Assign one Manager to each project.
- View and manage all projects, tasks, users, comments, and attachments inside the workspace.
- Change user roles and account status.
- Reset user passwords.
- Delete projects, tasks, comments, and the workspace according to the defined rules.

There is exactly one Admin per workspace.

### 4.2 Manager

A Manager is responsible for one or more projects assigned by the Admin.

Primary responsibilities:
- Manage assigned projects.
- Add or remove project members according to the defined rules.
- Create, edit, assign, reassign, and delete tasks within assigned projects.
- Review submitted tasks.
- Approve completed work by changing reviewed tasks to Done.
- Return reviewed tasks to In Progress when more work is needed.
- Add comments and attachments.
- Change project status between Active, Completed, and Archived, subject to business rules.

A workspace may contain multiple Managers.

### 4.3 Member

A Member participates in projects and performs assigned tasks.

Primary responsibilities:
- View all tasks within projects they belong to.
- Work on assigned tasks.
- Change the status of assigned tasks within allowed transitions.
- Submit completed work for review.
- Add comments to tasks within their projects.
- Upload attachments only to tasks assigned to them.
- Change their own profile picture.
- Change their own password.

A Member may participate in multiple projects within the same workspace and may work with different Managers across those projects.

### 4.4 Usage context

Tasky is intended for daily use during team work.

---

## 5. Goals, Outcomes & Success Metrics

### Goals

1. Reduce the risk of tasks becoming lost or scattered.
2. Make task ownership clear.
3. Make it easier to divide tasks and organize team work.
4. Improve coordination and connection between team members.

### User outcomes

Users can understand:
- Which projects they belong to.
- Which tasks exist in each project.
- Who is responsible for each task.
- What state each task is in.
- Which work is waiting for review.
- Which work has been completed.

### Business / portfolio outcome

The completed MVP demonstrates the ability to define and deliver a structured project-management product with roles, permissions, workflows, business rules, and end-to-end user flows.

### Success metrics

The MVP is considered successful when a team can complete the full core flow without critical errors:

**Create workspace → create team accounts → create project → assign Manager → add project members → create tasks → assign each task → update task state → review work → complete tasks → complete project.**

No numeric usage, adoption, or retention targets are required for the MVP.

### Guardrail metrics

Not applicable for the MVP.

---

## 6. Scope

### In scope

- Admin registration and workspace creation.
- Email and password sign-in.
- User roles: Admin, Manager, Member.
- User account activation and disabling.
- Admin-created Manager and Member accounts.
- Password change and Admin password reset.
- User profile picture.
- Workspace name management.
- Project creation and management.
- Project membership management.
- Task creation, assignment, reassignment, editing, deletion, and status workflow.
- Task priorities.
- Optional task due dates.
- Overdue indicator.
- Comments.
- File attachments.
- In-app notifications.
- Simple dashboard.
- Simple search for Tasks and Projects.
- Simple task filters.
- Responsive desktop and mobile experience.
- Public live demo.
- GitHub repository and README.

### Out of scope / non-goals

- Email invitations.
- Email verification.
- CAPTCHA.
- Email-based password recovery.
- Multiple workspaces per user.
- Multiple Admins per workspace.
- Multiple Managers per project.
- Multiple assignees per task.
- Activity log.
- Import or export of data.
- External integrations.
- AI features.
- Payments, subscriptions, or pricing plans.
- Advanced analytics or usage tracking.
- Automated tests.
- Offline mode.
- Mobile applications.
- Advanced accessibility requirements.
- Advanced content moderation or reporting.
- User support or contact ticketing.
- Advanced backup, disaster recovery, or server monitoring requirements.

### MVP / current release boundary

The MVP includes only the confirmed core functionality required to demonstrate complete project and task management for small teams.

### Later phases

Any functionality listed as out of scope may be considered later, but it is not part of the MVP.

### Platform, geography, language, and customer scope

- Platform: Web application only.
- Devices: Desktop and mobile browsers.
- Language: English only.
- Geographic restrictions: None.
- Data residency restrictions: None.
- Target audience: Small work teams.
- Workspace size: No fixed numeric limit is defined for the MVP.

---

## 7. User Journeys & Flows

### 7.1 Simple Use Case: Create a Workspace

**Primary actor:** Admin

**Trigger:** A new user wants to start using Tasky.

**Preconditions:** The email address is not already used by another Tasky account.

**Main flow:**
1. User opens the registration page.
2. User enters Full Name, Email, Password, and Workspace Name.
3. The account is created as the Admin of a new workspace.
4. The workspace is created.
5. The Admin enters Tasky.

**Success state:** A new Admin account and workspace exist.

**Failure state:** Registration fails when required information is invalid or the email is already in use.

### 7.2 Simple Use Case: Create a Team Account

**Primary actor:** Admin

**Preconditions:** Admin is authenticated.

**Main flow:**
1. Admin opens user management.
2. Admin enters the user's name, email, password, and role.
3. Admin selects Manager or Member.
4. Account is created as Active.
5. The user can sign in with the assigned credentials.

**Success state:** The new user belongs to the same workspace.

### 7.3 Simple Use Case: Create a Project

**Primary actor:** Admin

**Preconditions:** Admin is authenticated and at least one eligible Manager exists.

**Main flow:**
1. Admin creates a new project.
2. Admin provides a project name.
3. Admin selects one Manager.
4. Admin may optionally provide description, start date, and end date.
5. Project is created with status Active.
6. Members may be added immediately or later.

**Success state:** The project exists and has exactly one responsible Manager.

### 7.4 Simple Use Case: Create and Assign a Task

**Primary actors:** Admin, project Manager

**Preconditions:** Project is Active and contains at least one Member.

**Main flow:**
1. Actor opens the project.
2. Actor creates a Task.
3. Actor enters Title and Priority.
4. Actor selects one Member from the project.
5. Actor may optionally add Description and Due Date.
6. Task is created with status Todo.
7. Assigned Member receives an in-app notification.

**Success state:** One Member is clearly responsible for the task.

### 7.5 Simple Use Case: Complete and Review a Task

**Primary actors:** Member, project Manager

**Preconditions:** Task is assigned to the Member and project is Active.

**Main flow:**
1. Member changes task from Todo to In Progress.
2. Member performs the work.
3. Member changes task to Review.
4. Manager receives a notification.
5. Manager reviews the task.
6. Manager either:
   - changes the task to Done, or
   - returns it to In Progress.
7. Member receives a notification about the review result.

**Success state:** Approved work reaches Done.

### 7.6 Simple Use Case: Reassign a Task

**Primary actors:** Admin, project Manager

**Preconditions:** New assignee is a Member of the same project.

**Main flow:**
1. Actor selects another project Member as assignee.
2. Task assignee changes.
3. Task status automatically returns to Todo.
4. New assignee receives a notification.

**Success state:** Responsibility is transferred clearly.

### 7.7 Simple Use Case: Add a Comment

**Primary actors:** Any project Member, project Manager, Admin

**Preconditions:** User can view the project and task.

**Main flow:**
1. User opens a Task.
2. User adds a comment.
3. The task assignee and project Manager receive notifications.

**Success state:** The comment becomes visible to all members of the project.

### 7.8 Simple Use Case: Upload an Attachment

**Primary actors:** Task assignee, project Manager, Admin

**Preconditions:** Project is Active.

**Main flow:**
1. Actor opens the Task.
2. Actor uploads a file of up to 10 MB.
3. The file is attached to the Task.

**Success state:** The attachment is available from the Task.

### 7.9 Simple Use Case: Complete a Project

**Primary actors:** Project Manager, Admin

**Preconditions:** All Tasks in the Project are Done.

**Main flow:**
1. Actor changes project status from Active to Completed.
2. Project becomes Read-only.

**Success state:** Completed project remains visible but cannot be edited.

### 7.10 Simple Use Case: Archive a Project

**Primary actors:** Project Manager, Admin

**Preconditions:** Project is Active.

**Main flow:**
1. Actor changes project status to Archived.
2. Project becomes Read-only.
3. Project is removed from normal active project views.

**Success state:** Project data remains available without remaining part of active work.

### 7.11 Simple Use Case: Reactivate a Project

**Primary actor:** Admin

**Preconditions:** Project is Completed or Archived.

**Main flow:**
1. Admin changes project status to Active.
2. Project becomes editable again.

**Success state:** Work can resume.

### 7.12 Simple Use Case: Disable a User

**Primary actor:** Admin

**Preconditions:** User is a Manager or Member.

**Main flow:**
1. Admin chooses Disable Account.
2. If the user is a Manager responsible for Projects, the Admin must first transfer those Projects to another Manager.
3. Account status becomes Disabled.
4. The user can no longer authenticate or continue using Tasky.
5. If already signed in, the user is blocked on the next request and is logged out.

**Success state:** Account access is removed while historical data remains preserved.

---

## 8. Functional Requirements

| ID | Requirement | Actor | Priority/Release | Notes |
|---|---|---|---|---|
| FR-001 | The system must allow a new user to register as the Admin of a new Workspace using Full Name, Email, Password, and Workspace Name. | New user | MVP | One Admin per Workspace. |
| FR-002 | The system must require each user email to be unique across Tasky. | System | MVP | Workspace names do not need to be unique. |
| FR-003 | The system must allow users to sign in using Email and Password. | All users | MVP | No email verification required. |
| FR-004 | The system must keep a user signed in across page refreshes and browser restarts until logout or account invalidation. | All users | MVP | Persistent sign-in behavior required. |
| FR-005 | The Admin must be able to create Manager and Member accounts manually. | Admin | MVP | No invitation email flow. |
| FR-006 | The Admin must be able to edit a Manager or Member's name, email, role, and account status. | Admin | MVP | Role can switch between Manager and Member. |
| FR-007 | The Admin must be able to reset a Manager or Member password. | Admin | MVP | Used for forgotten-password recovery. |
| FR-008 | Each user must be able to change their own password after signing in. | All users | MVP | Minimum 8 characters. |
| FR-009 | Each user must be able to upload or change their own optional profile picture. | All users | MVP | Other profile fields are not self-editable. |
| FR-010 | The Admin must be able to set a Manager or Member account to Active or Disabled. | Admin | MVP | Disabled accounts retain historical data. |
| FR-011 | A Disabled account must be denied access on the next request and logged out if already signed in. | System | MVP | Immediate enforcement at next request. |
| FR-012 | The Admin must be able to change the Workspace name. | Admin | MVP | Workspace names may duplicate names in other workspaces. |
| FR-013 | Only the Admin may create a new Project. | Admin | MVP | This overrides the earlier draft behavior discussed during discovery. |
| FR-014 | Each Project must have exactly one Manager at creation. | Admin | MVP | Manager is mandatory. |
| FR-015 | The Admin must be able to change the Manager assigned to an existing Project. | Admin | MVP | Replacement Manager must belong to the same Workspace. |
| FR-016 | A Project must support Name, Description, Manager, Members, Start Date, End Date, and Status. | Admin / Manager | MVP | Description and dates are optional. |
| FR-017 | A new Project must start with status Active. | System | MVP | — |
| FR-018 | The Admin and the responsible Manager must be able to add or remove Members from the Project. | Admin / Manager | MVP | Removal rules apply when unfinished Tasks exist. |
| FR-019 | The Admin must be able to delete a Project after an explicit confirmation. | Admin | MVP | Deletion is permanent. |
| FR-020 | Deleting a Project must also delete its Tasks, Comments, Attachments, and associated uploaded files. | System | MVP | Permanent cascade behavior. |
| FR-021 | Project status must support Active, Completed, and Archived. | Admin / Manager | MVP | Completed and Archived are Read-only. |
| FR-022 | The Admin and responsible Manager must be able to change a Project from Active to Completed or Archived. | Admin / Manager | MVP | Completion rule applies. |
| FR-023 | A Project may be marked Completed only when all of its Tasks are Done. | System | MVP | — |
| FR-024 | A Project may be Archived even if unfinished Tasks remain. | Admin / Manager | MVP | Archived Projects become Read-only. |
| FR-025 | Only the Admin may reactivate a Completed or Archived Project. | Admin | MVP | Reactivation returns Project to Active. |
| FR-026 | The Admin and responsible Manager must be able to create Tasks inside an Active Project. | Admin / Manager | MVP | Members cannot create Tasks. |
| FR-027 | A Task must require Title, Priority, and one Assigned Member. | Admin / Manager | MVP | Description and Due Date are optional. |
| FR-028 | A Task must be assigned to exactly one Member who already belongs to the same Project. | Admin / Manager | MVP | One assignee only. |
| FR-029 | A newly created Task must start in Todo. | System | MVP | — |
| FR-030 | Task priority must support Low, Medium, and High. | Admin / Manager | MVP | — |
| FR-031 | Task status must support Todo, In Progress, Review, and Done. | System | MVP | Overdue is not a status. |
| FR-032 | A Member must be able to change the status of Tasks assigned to them, except they must not be able to mark a Task Done. | Member | MVP | Member submits completed work to Review. |
| FR-033 | The Admin and responsible Manager must be able to change the status of any Task in the Project. | Admin / Manager | MVP | Manager review controls Done. |
| FR-034 | When a Member finishes work, they must move the Task to Review. | Member | MVP | — |
| FR-035 | After review, the Admin or Manager must be able to move a Task from Review to Done or back to In Progress. | Admin / Manager | MVP | — |
| FR-036 | The Admin and responsible Manager must be able to edit Task Title, Description, Priority, Due Date, and assignee. | Admin / Manager | MVP | — |
| FR-037 | Reassigning a Task must automatically reset its status to Todo. | System | MVP | New assignee must belong to Project. |
| FR-038 | The Admin and responsible Manager must be able to permanently delete a Task after explicit confirmation. | Admin / Manager | MVP | Members cannot delete Tasks. |
| FR-039 | Deleting a Task must also delete its Comments, Attachments, and associated uploaded files. | System | MVP | — |
| FR-040 | Task Due Date must be optional. | Admin / Manager | MVP | — |
| FR-041 | If a Project Start Date exists, a Task Due Date must not be earlier than it. | System | MVP | Applies only when Start Date exists. |
| FR-042 | If a Project End Date exists, a Task Due Date must not be later than it. | System | MVP | Applies only when End Date exists. |
| FR-043 | A Task with a Due Date in the past and status other than Done must display an Overdue indicator. | System | MVP | Overdue remains a badge, not a workflow state. |
| FR-044 | All Members of a Project must be able to view all Tasks in that Project. | Project users | MVP | Edit permissions remain role-based. |
| FR-045 | A Member must only be able to change Task status for Tasks assigned to them. | Member | MVP | — |
| FR-046 | All Project members must be able to add Comments to any Task in the Project. | Project users | MVP | — |
| FR-047 | A user must be able to edit and delete only their own Comments. | All users | MVP | Manager/Admin moderation exception applies. |
| FR-048 | The responsible Manager must be able to delete any Comment inside their Project. | Manager | MVP | — |
| FR-049 | The Admin must be able to delete any Comment inside the Workspace. | Admin | MVP | — |
| FR-050 | Comments must be visible to all Members of the Project. | Project users | MVP | — |
| FR-051 | Only the Task assignee, responsible Manager, and Admin may upload Attachments to a Task. | Authorized task users | MVP | — |
| FR-052 | Attachments may be any file type up to 10 MB per file. | Authorized task users | MVP | — |
| FR-053 | The uploader of an Attachment, the responsible Manager, and the Admin must be able to delete the Attachment. | Authorized task users | MVP | — |
| FR-054 | The system must create an in-app Notification when a Task is assigned to a Member. | System | MVP | Notification is mandatory. |
| FR-055 | The system must notify the Manager when a Member moves a Task to Review. | System | MVP | — |
| FR-056 | The system must notify the Task assignee when the Manager moves a reviewed Task to Done or back to In Progress. | System | MVP | — |
| FR-057 | When a new Comment is added, the system must notify the Task assignee and responsible Manager. | System | MVP | Notifications are not sent to every Project Member. |
| FR-058 | Notifications must support Read and Unread states. | All users | MVP | Unread count must be visible. |
| FR-059 | Notifications must be mandatory and must not include user opt-out or preference controls in the MVP. | All users | MVP | — |
| FR-060 | Notifications must refresh frequently enough to appear without requiring manual navigation, while exact real-time delivery is not required. | System | MVP | Product behavior only; no implementation mechanism specified. |
| FR-061 | The system must provide a simple Dashboard after login. | All users | MVP | Dashboard includes project/task summary information relevant to the user. |
| FR-062 | The system must provide simple search across Tasks and Projects. | All users | MVP | Search is limited to the user's permitted data. |
| FR-063 | The system must provide Task filters for Status, Priority, and Assigned Member. | All users | MVP | Simple filtering only. |
| FR-064 | The Admin must see all Projects in the Workspace. | Admin | MVP | — |
| FR-065 | A Manager must see only Projects they manage. | Manager | MVP | — |
| FR-066 | A Member must see only Projects they belong to. | Member | MVP | — |
| FR-067 | The system must prevent removing a Member from a Project while they have unfinished assigned Tasks. | Admin / Manager | MVP | Tasks must first be reassigned. |
| FR-068 | Done Tasks must remain historically associated with the previous assignee even after that user is removed from the Project. | System | MVP | Historical ownership is preserved. |
| FR-069 | The system must prevent disabling a Manager while they remain responsible for one or more Projects. | Admin | MVP | Projects must first be transferred. |
| FR-070 | The Admin must be able to delete the entire Workspace after explicit confirmation. | Admin | MVP | Permanent destructive action. |
| FR-071 | Deleting the Workspace must delete its users, Projects, Tasks, Comments, Notifications, Attachments, and uploaded files. | System | MVP | Permanent cascade behavior. |
| FR-072 | When a server or network request fails, the interface must display a clear error message and keep the user on the current page so they can retry. | All users | MVP | — |
| FR-073 | The application must require an internet connection to operate. | All users | MVP | Offline mode is not supported. |

---

## 9. Business Rules & Policies

### Workspace rules

- Each user belongs to exactly one Workspace.
- Each Workspace has exactly one Admin.
- A Workspace may contain multiple Managers and Members.
- Workspace names do not need to be unique.
- Only the Admin may change the Workspace name.

### Account rules

- Email addresses must be unique across Tasky.
- Manager and Member accounts are created manually by the Admin.
- Account states are Active and Disabled.
- Disabled users keep historical associations but cannot use Tasky.
- Users are not permanently deleted individually in the MVP.
- Users may change their own password and profile picture only.
- Admin controls user name, email, role, and status.
- Passwords must contain at least 8 characters.

### Project rules

- Only the Admin can create Projects.
- Each Project has exactly one Manager.
- A Manager may manage multiple Projects.
- A Member may belong to multiple Projects.
- Project states are Active, Completed, and Archived.
- Completed and Archived Projects are Read-only.
- Only the Admin can reactivate Completed or Archived Projects.
- All Tasks must be Done before a Project can become Completed.
- A Project may become Archived even when unfinished Tasks remain.
- Project Start Date and End Date are optional.
- Project dates contain date only, not time.

### Task rules

- Task workflow is Todo → In Progress → Review → Done.
- A Member cannot mark a Task Done.
- The responsible Manager or Admin approves completion.
- One Task has exactly one assignee.
- The assignee must already belong to the Project.
- Task Due Date is optional and contains date only, not time.
- If Project date boundaries exist, Task Due Date must respect them.
- Overdue is a visual indicator, not a Task status.
- Reassigning a Task returns it to Todo.

### Deletion rules

- Project deletion is permanent and Admin-only.
- Task deletion is permanent and available only to Admin and responsible Manager.
- Workspace deletion is permanent and Admin-only.
- Destructive Project, Task, and Workspace deletion must require confirmation.
- Related child records and uploaded files are deleted with their parent object.

### Pricing and financial policy

Tasky MVP is free and contains no billing, payment, subscription, or pricing functionality.

---

## 10. Identity, Roles & Permissions

### Authentication

- Authentication is required for all Workspace functionality.
- Login uses Email and Password.
- Registration is available only for creation of a new Admin and Workspace.
- Manager and Member self-registration is not supported.
- Email verification is not required.
- CAPTCHA is not required.

### Password recovery

- There is no email-based Forgot Password flow.
- A user may change their own password after login.
- The Admin may reset a Manager or Member password.

### Session behavior

- A user remains signed in after page refresh and browser restart until logout or account invalidation.
- A Disabled user is denied access on their next request and logged out.

### Permissions summary

| Capability | Admin | Manager | Member |
|---|---:|---:|---:|
| Create Workspace | Yes | No | No |
| Rename Workspace | Yes | No | No |
| Delete Workspace | Yes | No | No |
| Create user accounts | Yes | No | No |
| Edit user name/email/role/status | Yes | No | No |
| Reset another user's password | Yes | No | No |
| Change own password | Yes | Yes | Yes |
| Change own profile picture | Yes | Yes | Yes |
| Create Project | Yes | No | No |
| Delete Project | Yes | No | No |
| Change Project Manager | Yes | No | No |
| Manage Project Members | Yes | Assigned Projects | No |
| Create Task | Yes | Assigned Projects | No |
| Edit Task details | Yes | Assigned Projects | No |
| Reassign Task | Yes | Assigned Projects | No |
| Delete Task | Yes | Assigned Projects | No |
| View Project Tasks | All Projects | Assigned Projects | Member Projects |
| Change own assigned Task status | Yes | Yes | Yes, except Done |
| Approve Task as Done | Yes | Assigned Projects | No |
| Add Comment | Yes | Assigned Projects | Member Projects |
| Delete any Comment | Yes | Assigned Projects | No |
| Upload Task Attachment | Yes | Assigned Projects | Assigned Tasks only |
| Search/Filter permitted data | Yes | Yes | Yes |

---

## 11. Data Requirements

### Core entities

- Workspace
- User
- Project
- Project Membership
- Task
- Comment
- Attachment
- Notification

### User data

Required product-level user data:
- Full Name
- Email
- Password credential
- Role
- Account status
- Workspace association
- Optional profile picture

### Project data

Required product-level project data:
- Name
- Description (optional)
- Responsible Manager
- Members
- Start Date (optional)
- End Date (optional)
- Status

### Task data

Required product-level task data:
- Title
- Description (optional)
- Priority
- Status
- Assigned Member
- Due Date (optional)
- Project association

### Comments

Comments must retain author and Task association.

### Attachments

Attachments must retain:
- Task association
- Uploader association
- Stored file reference

Each file is limited to 10 MB.

### Notifications

Notifications must retain:
- Recipient
- Triggering event context
- Read / Unread state

### Retention

Data is retained without automatic expiration unless it is explicitly deleted through an authorized destructive action.

### Historical data

Completed Tasks must preserve historical assignee identity even when that person is later removed from the Project.

### Import / export

Not applicable in the MVP.

### Sensitive / personal data

Tasky stores account information, profile images, comments, and uploaded files. No special compliance framework was specified for the MVP.

---

## 12. Integrations & External Dependencies

No external integrations are included in the MVP.

Specifically excluded:
- Email services
- External file providers
- Payment providers
- AI services
- Third-party productivity tools
- External APIs

---

## 13. UX & Interaction Requirements

### Primary surfaces

The MVP must provide simple functional screens for:
- Registration
- Login
- Dashboard
- Workspace / team management
- Projects list
- Project details
- Task details
- Notifications
- Profile

### Dashboard

The post-login Dashboard must provide a simple summary of relevant Projects and Tasks, including assigned work and Task status information.

### Navigation

Navigation must allow users to reach their permitted Projects, Tasks, Notifications, and Profile without requiring unnecessary steps.

### Required UI states

The UI must support at minimum:
- Loading state
- Empty state where no relevant data exists
- Success feedback for completed actions where appropriate
- Error feedback for failed requests
- Read-only presentation for Completed and Archived Projects

### Search and filters

- Search must support Tasks and Projects.
- Task filters must support Status, Priority, and Assigned Member.

### Confirmations

Explicit confirmation is required before permanently deleting:
- Project
- Task
- Workspace

### Responsive behavior

The MVP must be usable on desktop and mobile screen sizes.

The UI is expected to be simple and functional rather than visually polished.

### Language

English only.

### Accessibility

Out of scope for the MVP beyond normal functional usability.

---

## 14. Communications & Notifications

Tasky uses in-app Notifications only.

### Notification events

1. **Task assigned**
   - Recipient: Assigned Member

2. **Task submitted for Review**
   - Recipient: Responsible Manager

3. **Task approved as Done**
   - Recipient: Task assignee

4. **Task returned to In Progress**
   - Recipient: Task assignee

5. **New Comment added**
   - Recipients: Task assignee and responsible Manager

### Notification behavior

- Notifications are mandatory in the MVP.
- Users cannot opt out of individual notification types.
- Notifications support Read and Unread states.
- The interface must show an unread count.
- Notification updates should appear without requiring the user to manually navigate away and back, but exact real-time delivery is not required.

### Email notifications

Not applicable.

---

## 15. Search, Discovery & Recommendations

### Search

Simple search is supported for:
- Tasks
- Projects

Search results must respect user visibility permissions.

### Task filters

Tasks can be filtered by:
- Status
- Priority
- Assigned Member

### Recommendations

Not applicable.

---

## 16. Payments, Billing & Commerce

Not applicable.

Tasky MVP is free and includes no payments, billing, subscriptions, invoices, refunds, or financial flows.

---

## 17. User-Generated Content, Trust & Safety

### User-generated content

The MVP includes:
- Task Comments
- Task Attachments
- Profile pictures

### Visibility

- Comments are visible to all Members of the same Project.
- Content belongs to the Workspace context.

### Moderation

Advanced moderation, reporting, abuse handling, blocking, appeals, and content review systems are out of scope for the MVP.

### Content deletion

Deletion follows the role and parent-object rules defined in this PRD.

---

## 18. AI / ML Requirements

Not applicable.

No AI or machine learning functionality is included in the MVP.

---

## 19. Analytics, Telemetry & Experimentation

Product analytics, usage tracking, funnels, A/B testing, and experimentation are out of scope for the MVP.

Activity logging is also out of scope.

---

## 20. Non-Functional Requirements

| ID | Area | Requirement / Target |
|---|---|---|
| NFR-001 | Performance | The application must feel responsive during normal small-team usage. No numeric latency target or SLA is defined for the MVP. |
| NFR-002 | Reliability | Core user flows must complete without critical errors during normal usage. |
| NFR-003 | Security | Passwords must not be stored as plain text. |
| NFR-004 | Security | Disabled accounts must be prevented from continuing to use protected product functionality. |
| NFR-005 | Security | Role and object permissions defined in this PRD must be enforced consistently. |
| NFR-006 | Data integrity | A Task must always belong to a Project and must have exactly one valid assignee from that Project. |
| NFR-007 | Data integrity | A Project must always have exactly one responsible Manager while Active. |
| NFR-008 | Data integrity | Permanent deletions must also remove dependent records and associated uploaded files as defined. |
| NFR-009 | Compatibility | The MVP must support the latest versions of Chrome, Edge, Firefox, Safari, and Brave. |
| NFR-010 | Responsive design | The application must remain usable on desktop and mobile screen sizes. |
| NFR-011 | Connectivity | The application requires an internet connection; offline usage is not supported. |
| NFR-012 | Language | The MVP must present its interface in English only. |
| NFR-013 | Scale | The MVP is intended for small teams and has no fixed numeric limits for users, Projects, or Tasks. |
| NFR-014 | Availability | No formal uptime SLA is defined for the MVP. |
| NFR-015 | Accessibility | Advanced accessibility requirements are outside MVP scope. |
| NFR-016 | Compliance | No special regulatory or compliance framework is required for the MVP. |
| NFR-017 | Resilience | Advanced backup, disaster recovery, and infrastructure monitoring are outside MVP scope. |
| NFR-018 | Maintainability | The product scope must remain limited to the confirmed MVP features and avoid adding unconfirmed functionality. |

---

## 21. Edge Cases & Failure Handling

1. **Duplicate email during registration or account creation**
   - The system must reject the action and show a clear error.

2. **Disabled user attempts access**
   - The system must reject access.
   - If already signed in, the user must be logged out on the next request.

3. **Manager is about to be disabled while responsible for Projects**
   - The system must block disabling until responsibility is transferred.

4. **Member is about to be removed from a Project while assigned unfinished Tasks**
   - The system must block removal until those Tasks are reassigned.

5. **Member removed after completing Tasks**
   - Done Tasks must keep the historical association with that Member.

6. **Task reassignment**
   - The Task must return to Todo automatically.

7. **Task assignee is not a Project Member**
   - Assignment must be rejected.

8. **Task Due Date outside Project date boundaries**
   - If a Start Date exists, earlier Due Dates must be rejected.
   - If an End Date exists, later Due Dates must be rejected.

9. **Project completion with unfinished Tasks**
   - Completion must be rejected.

10. **Project archival with unfinished Tasks**
    - Archival is allowed.

11. **Editing a Completed or Archived Project**
    - Modification must be blocked because the Project is Read-only.

12. **Reactivation of Completed or Archived Project by non-Admin**
    - Action must be rejected.

13. **Oversized Attachment**
    - Files larger than 10 MB must be rejected.

14. **Failed server or network request**
    - User must remain on the current screen and receive a clear error message with the ability to retry.

15. **Permanent deletion**
    - Project, Task, and Workspace deletion must require confirmation before execution.

---

## 22. Administration, Operations & Support

### Admin capabilities

The Admin has workspace-wide administrative control over:
- Workspace name
- User creation
- User account data
- User role
- User account status
- Password resets
- Project creation
- Project Manager assignment
- Project deletion
- Workspace deletion
- Project reactivation

### Manual overrides

The Admin may:
- Reset another user's password.
- Change Manager/Member role.
- Reassign Project Manager.
- Reactivate Completed or Archived Projects.

### Support tooling

Not applicable for the MVP.

### Activity / audit log

Not applicable for the MVP.

### Operational reporting

Not applicable for the MVP.

---

## 23. Rollout, Migration & Lifecycle

### Launch strategy

Tasky MVP will launch directly as a public live demo.

No private beta, staged rollout, or feature flags are required.

### Public access

Any visitor may create a new Admin account and Workspace to try the system.

### Migration

Not applicable.

Tasky is a new product with no existing users or data requiring migration.

### Backward compatibility

Not applicable for the first release.

### Project lifecycle

Tasky MVP is considered complete when:
- Core end-to-end flows work without critical errors.
- The project is available on GitHub.
- A public live demo is available.
- A clear README explains the product, how to run it locally, and how to access the live demo.

---

## 24. Dependencies, Constraints & Risks

### Dependencies

No external product integrations are required for the MVP.

### Constraints

- Product requirements must remain within the confirmed MVP scope.
- English only.
- Web only.
- Internet connection required.
- No formal delivery deadline.
- No advanced design or UI polish requirement.
- No automated testing requirement.
- No external service requirement as part of product functionality.

### Risks

1. **Permission complexity**
   - Multiple roles and object-specific permissions may create authorization mistakes.

2. **Destructive deletion risk**
   - Permanent Project, Task, or Workspace deletion can remove large amounts of related data.

3. **User reassignment complexity**
   - Removing or disabling users who own active work can create inconsistent responsibility if validation is missing.

4. **Notification noise**
   - Mandatory notifications can become distracting if future scope adds too many events.

5. **Public demo misuse**
   - Public registration without email verification or CAPTCHA may allow unwanted account creation.

### Mitigations / accepted risks

- Permission rules are explicitly defined in this PRD.
- Destructive actions require confirmation.
- Manager and Member removal rules protect active work.
- Notifications are limited to a small set of MVP events.
- Public demo registration without verification or CAPTCHA is an accepted MVP limitation.

---

## 25. Acceptance Criteria & Release Readiness

| ID | Related requirement | Acceptance criterion |
|---|---|---|
| AC-001 | FR-001 | A new visitor can create one Admin account and one Workspace using the required registration fields. |
| AC-002 | FR-002 | Attempting to create another account with an existing email is rejected. |
| AC-003 | FR-003, FR-004 | A valid user can sign in and remain signed in across refreshes and browser restarts until logout or invalidation. |
| AC-004 | FR-005 | Admin can create Manager and Member accounts that can sign in successfully. |
| AC-005 | FR-010, FR-011 | Disabled users cannot continue using Tasky and are logged out on the next protected request. |
| AC-006 | FR-013, FR-014 | Only Admin can create a Project, and every created Project has exactly one Manager. |
| AC-007 | FR-018 | Admin and responsible Manager can add or remove Project Members when removal rules are satisfied. |
| AC-008 | FR-026, FR-027, FR-028, FR-029 | Admin or Manager can create a valid Task with required fields, one valid assignee, and Todo status. |
| AC-009 | FR-031, FR-032, FR-034, FR-035 | A Member can move assigned work through Todo, In Progress, and Review, but cannot mark it Done; Admin or Manager can complete review. |
| AC-010 | FR-037 | Reassigning a Task to another valid Member resets status to Todo. |
| AC-011 | FR-041, FR-042 | Invalid Task Due Dates outside existing Project date boundaries are rejected. |
| AC-012 | FR-043 | A non-Done Task past its Due Date visibly shows Overdue without changing its workflow status. |
| AC-013 | FR-044 | Every Member of a Project can view all Tasks in that Project. |
| AC-014 | FR-046, FR-047, FR-048, FR-049 | Project users can comment, users control their own comments, Manager can delete comments in assigned Projects, and Admin can delete any Workspace comment. |
| AC-015 | FR-051, FR-052, FR-053 | Only permitted users can upload Attachments, files above 10 MB are rejected, and authorized users can delete Attachments. |
| AC-016 | FR-054, FR-055, FR-056, FR-057, FR-058 | Required notifications are created for assignment, review submission, review outcome, and comments, and each supports Read/Unread. |
| AC-017 | FR-062, FR-063 | Users can search permitted Tasks and Projects and filter Tasks by Status, Priority, and Assigned Member. |
| AC-018 | FR-023 | A Project with any non-Done Task cannot be marked Completed. |
| AC-019 | FR-024 | A Project can be Archived even if unfinished Tasks remain. |
| AC-020 | FR-025 | Only Admin can reactivate a Completed or Archived Project. |
| AC-021 | FR-067 | A Member with unfinished assigned Tasks cannot be removed until those Tasks are reassigned. |
| AC-022 | FR-068 | Done Tasks still show their historical assignee after that Member is removed from the Project. |
| AC-023 | FR-069 | A Manager responsible for Projects cannot be disabled until responsibility is transferred. |
| AC-024 | FR-019, FR-020 | Project deletion requires confirmation and removes related Tasks, Comments, Attachments, and uploaded files. |
| AC-025 | FR-038, FR-039 | Task deletion requires confirmation and removes related Comments, Attachments, and uploaded files. |
| AC-026 | FR-070, FR-071 | Workspace deletion requires confirmation and permanently removes Workspace data and uploaded files. |
| AC-027 | FR-072 | A failed request shows a clear error and keeps the user on the same page so they can retry. |
| AC-028 | NFR-009, NFR-010 | Core MVP flows are usable on current Chrome, Edge, Firefox, Safari, and Brave on desktop and mobile screen sizes. |

### Critical end-to-end scenarios

The following scenarios must work before release:

1. **New Admin onboarding**
   - Register → create Workspace → sign in → reach Dashboard.

2. **Team setup**
   - Admin creates Manager and Member accounts → users sign in successfully.

3. **Project setup**
   - Admin creates Project → assigns Manager → adds Members.

4. **Task lifecycle**
   - Admin/Manager creates Task → assigns Member → Member works → submits Review → Manager completes or returns Task.

5. **Collaboration**
   - Project user comments → permitted user uploads Attachment → relevant Notifications appear.

6. **Project lifecycle**
   - Project moves Active → Completed or Archived → becomes Read-only → Admin may reactivate.

7. **Account lifecycle**
   - Admin disables user → access is denied while historical data remains.

8. **Destructive actions**
   - Delete Task / Project / Workspace only after explicit confirmation and remove related data correctly.

### Release blockers

The MVP must not be considered complete if any of the following remain:
- A user can access data outside their permitted Workspace or Project scope.
- A Member can mark a Task Done without Manager/Admin approval.
- Project completion is possible with unfinished Tasks.
- Disabled users can continue using protected functionality.
- Permanent deletion leaves dependent records or uploaded files that should have been removed.
- Core registration, login, Project, Task, review, or notification flows are broken.

### Definition of Done

The MVP is Done when:
- All confirmed core flows are implemented and usable without critical errors.
- Permission rules behave as defined.
- Required edge cases are handled.
- The application is responsive on desktop and mobile.
- The project is available on GitHub.
- A public live demo is available.
- A clear README explains the product, how to run it locally, and how to access the live demo.

### Required sign-offs

Omar Saghir is the sole owner and developer for the MVP and therefore the only required product sign-off.

---

## 26. Open Decisions & Deferred Items

No open product decisions remain for the MVP based on the confirmed requirements.

The following areas are deliberately deferred beyond the MVP:
- Email-based invitations
- Email verification
- CAPTCHA
- Email password recovery
- Multiple workspaces per user
- Multiple Admins per Workspace
- Multiple Managers per Project
- Multiple assignees per Task
- Activity log
- Import / export
- External integrations
- AI features
- Payments / billing
- Advanced analytics
- Automated tests
- Offline mode
- Native mobile apps
- Advanced accessibility
- Advanced moderation / reporting
- User support system
- Advanced backup / disaster recovery / monitoring

---

## 27. Glossary

**Workspace:** The top-level team space owned by one Admin.

**Admin:** The single owner and administrator of a Workspace.

**Manager:** A user responsible for managing one or more Projects assigned by the Admin.

**Member:** A user who participates in Projects and performs assigned Tasks.

**Project:** A collection of team work managed by one Manager.

**Task:** A unit of work assigned to exactly one Project Member.

**Assignee:** The Member responsible for performing a Task.

**Todo:** Task has been created but work has not started.

**In Progress:** Work on the Task is currently being performed.

**Review:** The Member believes the Task is finished and is waiting for Manager/Admin approval.

**Done:** The Task has been reviewed and approved.

**Overdue:** A visual indicator shown when a Task's Due Date has passed and the Task is not Done.

**Active Project:** A Project currently open for work and editing.

**Completed Project:** A Project whose Tasks are all Done and that is now Read-only.

**Archived Project:** A Read-only Project removed from active work, even if some Tasks remain unfinished.

**Notification:** An in-app message generated by specific Task and Comment events.

**MVP:** Minimum Viable Product; the first confirmed release scope of Tasky.

---

## 28. Appendix

### Product constraints confirmed for this MVP

- The product is designed primarily to strengthen Omar Saghir's CV and portfolio.
- The UI should be functional and responsive but does not need advanced visual polish.
- The MVP will be published on GitHub and as a public live demo.
- Any visitor may create a new Admin account and Workspace.
- No formal development deadline exists.
- No special regulatory or geographic restrictions apply.


# III. Design Specifications
## 4. Mentor Sub-system

---

### 4.1 UC24 - Public Mentor Blogs
**a. Screen/Function Name: Public Mentor Blog Management & Repository (`MentorBlogManagement.jsx` - `/mentor/blog-management`)**
*[Provide brief description of the screen/function + related UC here and other details as in the sub-sections]*
> **Function & Use Case Description (UC24):** Manage public knowledge-sharing blog posts authored by Mentors on the ITA platform. This interface empowers Mentors to manage their repository of public articles, monitor interactive community engagement metrics (views count, likes count), and manage article publication statuses.

#### UI Design
*[This is to describe the UI layout (Mockup prototype) & descriptions for screen fields/components]*
**<<Mockup prototype - UI Layout & Component Description>>**
*(Mockup Capture Instruction: Log into the system using Mentor credentials `anhminh792005@gmail.com` -> Navigate to the personal dashboard dropdown -> Select **My Blogs / Blog Management** -> Capture the data table showcasing existing published blog posts along with their views, likes, and publication badges).*

| Field Name | Field Type | Description |
| :--- | :--- | :--- |
| **Blog Search & Filtering Controls** | | |
| `Search Article Input` | Text Input (Search) | Enables Mentors to filter their blog repository dynamically by querying keywords in article titles or associated tags. |
| `Category Filter` | Select Dropdown Control | Allows Mentors to filter articles by professional knowledge domain: *Interview Experience*, *CV Review*, *Technical Deep Dive*, and *Career Advice*. Initialized from `category`. |
| **Blog Inventory Data Table (UC24)** | | |
| `Article Title & Cover Preview` | Table Column / Card View | Displays the high-resolution article poster banner fetched from Supabase Storage alongside the main article headline. Initialized from `title` and `cover_image_url` in the `blogs` table. |
| `Publication Date` | Date Display Label | Displays the standardized date and timestamp of when the article was published to the general candidate community. Initialized from `created_at` (formatted as `DD/MM/YYYY`). |
| `Engagement Statistics` | Numeric Counter Badge | Quantitative metric counters tracking community engagement on the portal, representing total readers and favorites. Initialized from `views_count` and `likes_count`. |
| `Status Indicator Badge` | Colored Status Pill | Visual status badge indicating whether the article is publicly live (`published`, rendered in green) or in private staging (`draft`, rendered in yellow). Initialized from `status`. |

#### Database Access
| Table | CRUD | Description |
| :--- | :--- | :--- |
| `blogs` | R | **Read (R):** Query and retrieve all blog post records belonging to the authenticated Mentor session (`author_id = auth.uid()`) to populate the inventory management table. |
| `profiles` | R | **Read (R):** Retrieve the Mentor's professional identity credentials (`full_name`, `avatar_url`, `specialization`) to render authorship branding consistently across the dashboard. |

#### SQL Commands
```sql
-- Retrieve the inventory of public knowledge-sharing blog posts authored by the active Mentor (UC24)
SELECT b.id, b.title, b.category, b.cover_image_url, b.status, b.views_count, b.likes_count, b.created_at,
       p.full_name AS author_name, p.avatar_url AS author_avatar, p.specialization
FROM public.blogs b
JOIN public.profiles p ON b.author_id = p.id
WHERE b.author_id = auth.uid() AND b.status = 'published'
ORDER BY b.created_at DESC;
```

---

### 4.2 UC25 - Create Blogs
**a. Screen/Function Name: Blog Post Creation & Rich Editor Portal (`MentorPostBlog.jsx` - `/mentor/post-blog`)**
*[Provide brief description of the screen/function + related UC here and other details as in the sub-sections]*
> **Function & Use Case Description (UC25 - `<<extend>> UC24`):** Create new technical and interview guidance blog posts to share practical industry insights with candidates. This screen provides an immersive Rich Text/Markdown authoring editor. *(UX Architectural Improvement: The redundant YouTube video link input has been explicitly completely removed by the frontend team to provide a distraction-free, highly optimized writing experience focused strictly on high-value written advice).*

#### UI Design
**<<Mockup prototype - UI Layout & Component Description>>**
*(Mockup Capture Instruction: Navigate to the navigation bar and click **Post Blog / Create New Article** -> Capture the complete authoring form including Title input, Category dropdown, Cover Image uploader, Markdown text editor, and Publish button).*

| Field Name | Field Type | Description |
| :--- | :--- | :--- |
| **Blog Creation Form Input Fields (UC25)** | | |
| `Article Headline Title` | Text Input (Required) | Headline of the educational article (constrained to a maximum of 150 characters). E.g., *"Mastering System Design Architecture for Senior Engineering Interviews"*. Initialized as blank for new posts. |
| `Knowledge Domain Category` | Select Dropdown Control | Categorizes the post into specialized domains: *Algorithm*, *System Design*, *CV Review*, *Company Culture & STAR*, or *Salary Negotiation*. Initialized to populate the `category` column. |
| `Cover Banner Image Uploader` | Image File Picker & URL Preview | File input component allowing Mentors to upload visual graphics (JPG/PNG). Uploaded binaries are securely routed to the `blog_images` bucket in Supabase Storage. Initialized for `cover_image_url`. |
| `Article Content Body Editor` | Multiline Rich Textarea / Markdown | Primary text authoring interface supporting multi-level headers, bulleted lists, syntax-highlighted code blocks, and blockquotes. Initialized to save raw markdown strings into `content`. |
| `Metadata Search Tags` | Text Input (Comma-separated) | Input field accepting comma-separated search keywords (e.g., `react, javascript, interview, architecture`) to enhance discovery in candidate search queries. Formatted as a string array into `tags`. |
| `Publish Article Button` | Action Submit Button (Primary CTA) | Form submission trigger that validates user inputs and inserts the new article record into the database with `status = 'published'`, making it accessible immediately on the public portal. |

#### Database Access
| Table | CRUD | Description |
| :--- | :--- | :--- |
| `blogs` | C | **Create (C):** Insert a new article entity into the `blogs` database table, automatically associating `author_id` with the active user's UUID, persisting title, content, cover image URL, category, tags, and initializing both `views_count` and `likes_count` to `0`. |

#### SQL Commands
```sql
-- Insert a new educational interview blog post authored by the Mentor (UC25 - <<extend>> UC24)
INSERT INTO public.blogs (author_id, title, category, cover_image_url, content, tags, status, views_count, likes_count, created_at)
VALUES (
  auth.uid(),
  'A Complete 4-Step Formula to Solve Dynamic Programming & LeetCode Hard Questions',
  'Algorithm',
  'https://hitcsegxyxvxpyusfyge.supabase.co/storage/v1/object/public/blog_images/dp-tutorial-cover.png',
  'Detailed instructional guide covering memoization, tabulation, and state machine transitions during technical assessments...',
  ARRAY['algorithm', 'leetcode', 'interview', 'dynamic-programming'],
  'published',
  0, 0,
  NOW()
);
```

---

### 4.3 UC26 - Update Blogs
**a. Screen/Function Name: Existing Blog Post Modification & Removal (`MentorPostBlog.jsx` & `MentorBlogManagement.jsx`)**
*[Provide brief description of the screen/function + related UC here and other details as in the sub-sections]*
> **Function & Use Case Description (UC26 - `<<extend>> UC24`):** Modify existing published blog posts or remove obsolete articles from the platform repository. Upon selecting an existing article from the management inventory, all field properties (title, category, banner, body content, tags) are pre-populated automatically into the editor in Edit Mode, allowing comprehensive updates or complete record removal via secure global confirmation dialogs.

#### UI Design
**<<Mockup prototype - UI Layout & Component Description>>**
*(Mockup Capture Instruction: From the Blog Management Table, click the **Edit (Pencil) Icon Button** on any existing blog row -> Capture the resulting authoring screen showing pre-populated field text and the **Update Article** action button).*

| Field Name | Field Type | Description |
| :--- | :--- | :--- |
| **Edit Mode Controls & Data Modification (UC26)** | | |
| `Pre-populated Title & Category` | Editable Text Input & Dropdown | Automatically hydrates the existing article headline and professional category from database memory into editable input controls. Initialized from existing `title` and `category` values. |
| `Pre-populated Content Body` | Editable Rich Textarea | Renders existing Markdown article text directly within the editing viewport, enabling precise typographical revisions or code additions. Initialized from existing `content`. |
| `Save Modifications Button` | Submit Button (Success Theme) | Action button that validates modified properties and executes a relational UPDATE operation against the target database record, resetting the `updated_at` timestamp. |
| `Delete Article Action Icon` | Action Icon Button (Trash/Danger) | Destructive action button incorporated within the inventory list; triggers a modal confirmation dialog. Upon explicit approval, executes an immutable DELETE query on the record. |

#### Database Access
| Table | CRUD | Description |
| :--- | :--- | :--- |
| `blogs` | R, U, D | **Read (R):** Fetch existing properties of the target blog record by matching `id` and `author_id` to initialize Edit Mode.<br>**Update (U):** Write updated field strings into `title`, `category`, `content`, `tags`, and set `updated_at` timestamp.<br>**Delete (D):** Permanently eradicate the blog entity from database persistence upon explicit Mentor deletion request. |

#### SQL Commands
```sql
-- 1. Query to fetch existing blog details for pre-populating the editing screen
SELECT id, title, category, cover_image_url, content, tags, status
FROM public.blogs
WHERE id = 'c1234567-89ab-cdef-0123-456789abcdef' AND author_id = auth.uid();

-- 2. Update existing blog article properties (UC26 - <<extend>> UC24)
UPDATE public.blogs
SET title = '[Updated 2026] Comprehensive 4-Step Guide to Mastering Dynamic Programming',
    category = 'Algorithm',
    content = 'Updated technical breakdowns featuring advanced knapsack algorithms and recursive graph traversals...',
    tags = ARRAY['algorithm', 'leetcode', 'dp', 'updated'],
    updated_at = NOW()
WHERE id = 'c1234567-89ab-cdef-0123-456789abcdef' AND author_id = auth.uid();

-- 3. Delete obsolete blog article from database memory
DELETE FROM public.blogs
WHERE id = 'c1234567-89ab-cdef-0123-456789abcdef' AND author_id = auth.uid();
```

---

### 4.4 UC27 - Process Booking Requests
**a. Screen/Function Name: Mentoring Booking Request & Schedule Evaluation Center (`MentorSchedule.jsx` - `/mentor/schedule`)**
*[Provide brief description of the screen/function + related UC here and other details as in the sub-sections]*
> **Function & Use Case Description (UC27):** Evaluate 1-on-1 mock interview booking requests submitted by job candidates. This central interface provides Mentors with a clear overview of candidate appointment submissions, allowing rigorous evaluation of interview preferences, scheduling parameters, and candidates waiting in the Pending status queue.

#### UI Design
**<<Mockup prototype - UI Layout & Component Description>>**
*(Mockup Capture Instruction: Navigate to **Mentor Schedule (Lịch Mentor)** via the main menu -> Capture the booking request dashboard displaying status filter tabs (**Pending**, **Confirmed**), candidate profile summaries, and booking slot dates).*

| Field Name | Field Type | Description |
| :--- | :--- | :--- |
| **Booking Queue Filtering & Display (UC27)** | | |
| `Status Filter Navigation Tabs` | Interactive Action Tab Bar | Allows Mentors to toggle viewing filters across distinct booking states: *All*, *Pending*, *Confirmed*, *Completed*, and *Cancelled*. Initialized to control display queues. |
| `Candidate Profile Header` | Display Label & Avatar Badge | Visual component detailing the Candidate's Full Name, Avatar Image, and Contact Email address. Populated dynamically via SQL relational JOIN operations on the `profiles` table. |
| `Target Interview Speciality` | Display Tag & Speciality Pill | Reflects the professional target domain specified during booking (e.g., *Frontend React Engineer*, *Backend Cloud Specialist*). Initialized from candidate account records. |
| `Requested Date & Time Stamp` | Formatted DateTime Label | Explicit chronological schedule requested by the candidate (E.g., `28/07/2026 | 14:00 - 15:00`). Initialized directly from `booking_date` and `time_slot` database columns. |

#### Database Access
| Table | CRUD | Description |
| :--- | :--- | :--- |
| `mentor_bookings` | R, U | **Read (R):** Fetch all interview appointment submissions assigned to the active Mentor session (`mentor_id = auth.uid()`).<br>**Update (U):** Maintain structural references for downstream approval or rejection status mutations. |
| `profiles` | R | **Read (R):** Join candidate account properties (`full_name`, `avatar_url`, `email`, `phone`) to present comprehensive candidate background data rather than abstract UUID strings. |

#### SQL Commands
```sql
-- Retrieve pending 1-on-1 mock interview booking requests submitted to the active Mentor (UC27)
SELECT mb.id, mb.candidate_id, mb.mentor_id, mb.booking_date, mb.time_slot, mb.status, mb.notes, mb.meeting_link, mb.created_at,
       c.full_name AS candidate_name, c.email AS candidate_email, c.avatar_url AS candidate_avatar, c.phone AS candidate_phone
FROM public.mentor_bookings mb
JOIN public.profiles c ON mb.candidate_id = c.id
WHERE mb.mentor_id = auth.uid() AND mb.status = 'pending'
ORDER BY mb.booking_date ASC, mb.time_slot ASC;
```

---

### 4.5 UC28 - View Schedule Availability
**a. Screen/Function Name: Mentor Availability Slot Configuration & Collision Checker (`MentorProfile.jsx` / Schedule Verification Panel)**
*[Provide brief description of the screen/function + related UC here and other details as in the sub-sections]*
> **Function & Use Case Description (UC28 - `<<include>> UC27`):** Mandatory schedule availability inspection required prior to processing any booking request in UC27. This function ensures algorithmic integrity by presenting the Mentor's recurring weekly availability configurations alongside confirmed appointments, preventing scheduling overlaps and time slot collisions.

#### UI Design
**<<Mockup prototype - UI Layout & Component Description>>**
*(Mockup Capture Instruction: Open the Mentor Profile settings or Schedule panel -> Capture the **Availability Schedule** configuration layout illustrating weekly day chips and corresponding time slot badges).*

| Field Name | Field Type | Description |
| :--- | :--- | :--- |
| **Availability Slot Verification Controls (UC28)** | | |
| `Recurring Weekly Availability View` | Interactive Time Slot Chips | Visual layout depicting selected operating days (Monday - Sunday) and active time slot intervals (e.g., `Monday: 09:00-11:00`, `Wednesday: 20:00-21:00`). Initialized from JSONB data in `availability`. |
| `Confirmed Occupancies Overlay` | Calendar Conflict Highlight | Renders existing approved sessions (`confirmed`) on top of availability time blocks, visually flagging busy intervals to prevent double-booking assignments. |
| `Collision Diagnostics Indicator` | System Alert Badge | Automated system warning displayed if two distinct candidate requests target an identical date and timestamp interval. |

#### Database Access
| Table | CRUD | Description |
| :--- | :--- | :--- |
| `profiles` | R | **Read (R):** Read the active Mentor's recurring operating schedule configured inside the structured `availability` JSONB column. |
| `mentor_bookings` | R | **Read (R):** Query all existing booking records bearing `status = 'confirmed'` matching target requested dates to execute scheduling conflict prevention checks. |

#### SQL Commands
```sql
-- 1. Fetch recurring weekly availability schedules from Mentor Profile (UC28 - <<include>> UC27)
SELECT id, full_name, availability
FROM public.profiles
WHERE id = auth.uid();

-- 2. Query existing confirmed appointments on targeted date to prevent time slot collisions
SELECT id, booking_date, time_slot, status, candidate_id
FROM public.mentor_bookings
WHERE mentor_id = auth.uid() 
  AND booking_date = '2026-07-28' 
  AND status = 'confirmed';
```

---

### 4.6 UC29 - Accept Interview Schedule
**a. Screen/Function Name: Booking Request Confirmation & Meeting Link Provision Portal (`MentorSchedule.jsx`)**
*[Provide brief description of the screen/function + related UC here and other details as in the sub-sections]*
> **Function & Use Case Description (UC29 - `<<extend>> UC27`):** Accept and formalize an interview appointment following verification of schedule availability in UC28. Executing this function modifies the booking entity status from `pending` to `confirmed` and prompts the Mentor to input a valid virtual room URL (Google Meet / Zoom / Microsoft Teams). The action simultaneously invokes EmailJS automated routing to transmit schedule confirmations to the Candidate's registered email inbox.

#### UI Design
**<<Mockup prototype - UI Layout & Component Description>>**
*(Mockup Capture Instruction: In the pending schedule table, capture the **Approve / Accept (Chấp nhận)** action button and the inline text input field where the Google Meet room URL (`https://meet.google.com/...`) is entered alongside the **Save Room Link** button).*

| Field Name | Field Type | Description |
| :--- | :--- | :--- |
| **Appointment Approval & Meeting Room Provisioning (UC29)** | | |
| `Approve Request Button` | Action Trigger Button (Green) | Primary confirmation control that initiates state transition from `pending` to `confirmed`. Clicking triggers user confirmation feedback and dispatches notification pipelines. |
| `Virtual Room URL Input` | Hypertext Link Input Field | Text input accepting structured room URLs (E.g., `https://meet.google.com/xyz-mentor-room`). Initialized from and saved into `meeting_link`. |
| `Save Room Link Button` | Mini Submit Button | Persists the provided meeting URL into database storage, rendering an interactive "Join Room" button on both Mentor and Candidate viewports. |
| `Automated Email Dispatch Toast` | System Feedback Message | Confirmation dialog confirming successful email delivery via EmailJS containing interview coordinates and time specifications to the Candidate. |

#### Database Access
| Table | CRUD | Description |
| :--- | :--- | :--- |
| `mentor_bookings` | U | **Update (U):** Execute state mutation updating `status` column to `'confirmed'` and writing valid web meeting URLs into `meeting_link`. |

#### SQL Commands
```sql
-- Accept candidate interview schedule and assign valid online meeting room link (UC29 - <<extend>> UC27)
UPDATE public.mentor_bookings
SET status = 'confirmed',
    meeting_link = 'https://meet.google.com/minhmvp-mentoring-room',
    updated_at = NOW()
WHERE id = 'b4012345-6789-0123-bcde-1234567890bc' AND mentor_id = auth.uid();
```

---

### 4.7 UC30 - Decline Interview Schedule
**a. Screen/Function Name: Booking Request Rejection & Automated Points Refund Center (`MentorSchedule.jsx`)**
*[Provide brief description of the screen/function + related UC here and other details as in the sub-sections]*
> **Function & Use Case Description (UC30 - `<<extend>> UC27`):** Decline candidate booking submissions due to unforeseen schedule conflicts, specialized qualification mismatches, or full capacity. Executing rejection updates the appointment state from `pending` to `cancelled`, immediately initiating an automated transactional refund that returns 100% of the pledged booking points/fee back to the Candidate's balance wallet.

#### UI Design
**<<Mockup prototype - UI Layout & Component Description>>**
*(Mockup Capture Instruction: In the schedule list, capture the red **Decline / Reject (Từ chối)** button alongside the cancellation confirmation modal and optional rejection reasoning textarea).*

| Field Name | Field Type | Description |
| :--- | :--- | :--- |
| **Schedule Rejection & Refund Controls (UC30)** | | |
| `Decline / Reject Button` | Action Trigger Button (Red/Danger) | Destructive action control terminating the appointment request. Transitions booking database status directly from `pending` to `cancelled`. |
| `Rejection Reasoning Field` | Textarea Input & Prompt Dialog | Optional communication box allowing Mentors to explain scheduling conflicts or recommend alternate time slots (E.g., *"Unexpected emergency meeting on Tuesday, please rebook for Wednesday"*). |
| `Automated Refund Notification` | Policy Banner & Alert Text | System prompt informing the Mentor that initiating rejection automatically credits the Candidate's account wallet with the initial 500 booking point deposit. |

#### Database Access
| Table | CRUD | Description |
| :--- | :--- | :--- |
| `mentor_bookings` | U | **Update (U):** Mutate appointment record state inside `status` column directly to `'cancelled'`. |
| `profiles` (Candidate) | U | **Update (U):** Execute transactional refund algebra adding the appointment point value back onto the Candidate's `points` balance column. |

#### SQL Commands
```sql
-- 1. Decline candidate mock interview booking request and record rejection reason (UC30 - <<extend>> UC27)
UPDATE public.mentor_bookings
SET status = 'cancelled',
    notes = 'Sincere apologies, I have a sudden corporate deployment conflict on 28/07. Please kindly reschedule for Wednesday!',
    updated_at = NOW()
WHERE id = 'c5012345-6789-0123-cdef-2345678901cd' AND mentor_id = auth.uid();

-- 2. Execute automated refund restoring 500 booking points to the Candidate account wallet
UPDATE public.profiles
SET points = points + 500,
    updated_at = NOW()
WHERE id = (SELECT candidate_id FROM public.mentor_bookings WHERE id = 'c5012345-6789-0123-cdef-2345678901cd');
```

---

### 4.8 UC31 - Review Candidate Video
**a. Screen/Function Name: Candidate Audio/Video Practice Recording Inspection Player (`MentorReviews.jsx` & `MentorReviewDetail.jsx` - `/mentor/reviews/:id`)**
*[Provide brief description of the screen/function + related UC here and other details as in the sub-sections]*
> **Function & Use Case Description (UC31):** Access and review mock interview audio and video recordings submitted by candidates practicing technical and behavioral STAR scenarios. This interface integrates high-performance media playback controls with synchronized Speech-to-Text transcript displays, granting Mentors thorough diagnostic visibility into candidate vocal clarity, pacing, and architectural accuracy.

#### UI Design
**<<Mockup prototype - UI Layout & Component Description>>**
*(Mockup Capture Instruction: Click the **Reviews (Đánh giá)** tab -> Select an unreviewed candidate practice submission -> Capture the layout displaying the **Embedded Audio/Video Player**, Question Headline, and **Text Transcript Scrollable Box**).*

| Field Name | Field Type | Description |
| :--- | :--- | :--- |
| **Candidate Media Practice Evaluation (UC31)** | | |
| `Assigned Interview Question` | Title Header Display | Presents the exact architectural or STAR interview prompt assigned to the candidate (E.g., *"Describe strategies to resolve database connection pooling bottlenecks in microservice deployments"*). |
| `Embedded Video / Audio Player` | Media Playback Controls | Integrated HTML5 media streaming player featuring play, pause, seek bar, and volume controls for analyzing speech dynamics. Initialized from `audio_url` / `video_url`. |
| `Full Answer Text Transcript` | Scrollable Text Box (Read-only) | Comprehensive Speech-to-Text transcribed output representing verbatim candidate utterances, facilitating rapid text scanning and exact error citation. Initialized from `transcript`. |
| `Candidate Profile Banner` | User Summary Card | Details candidate Full Name, Avatar Image, and technical focus domain to provide conversational context during evaluation. |

#### Database Access
| Table | CRUD | Description |
| :--- | :--- | :--- |
| `practice_submissions` | R | **Read (R):** Fetch candidate submission assets including Supabase Storage URLs (`audio_url`, `video_url`), raw text `transcript`, and associated question metadata. |
| `profiles` (Candidate) | R | **Read (R):** Read candidate account identity parameters to accurately brand the submission evaluation screen. |

#### SQL Commands
```sql
-- Retrieve candidate practice recording media URL, verbatim transcript, and profile info for Mentor review (UC31)
SELECT ps.id, ps.candidate_id, ps.question_title, ps.audio_url, ps.video_url, ps.transcript, ps.created_at, ps.review_status,
       p.full_name AS candidate_name, p.avatar_url AS candidate_avatar, p.email AS candidate_email, p.specialization
FROM public.practice_submissions ps
JOIN public.profiles p ON ps.candidate_id = p.id
WHERE ps.id = 'd6012345-6789-0123-def0-3456789012de';
```

---

### 4.9 UC32 - Submit Video Feedback & Score
**a. Screen/Function Name: Structured Mentor Scoring & Diagnostic Commentary Form (`MentorReviewDetail.jsx` - `/mentor/reviews/:id`)**
*[Provide brief description of the screen/function + related UC here and other details as in the sub-sections]*
> **Function & Use Case Description (UC32 - `<<include>> UC31`):** Mandatory analytical scoring and detailed constructive feedback submission executed directly after completing media inspection in UC31. Mentors evaluate response efficacy across a standardized 1-10 numerical scale, document core strengths and tactical improvement points, and supply verified educational resource URLs (`react.dev`, `w3schools.com`, official docs) to foster continuous candidate growth.

#### UI Design
**<<Mockup prototype - UI Layout & Component Description>>**
*(Mockup Capture Instruction: Directly beneath the media player in the submission review screen, capture the **Evaluation Form** detailing the 1-10 Score Selector, Strengths Textarea, Areas for Improvement Textarea, Recommended Resource URL Input, and **Submit Feedback Button**).*

| Field Name | Field Type | Description |
| :--- | :--- | :--- |
| **Structured Evaluation & Scoring Fields (UC32)** | | |
| `Quantitative Score Selector` | Star Rating / Numeric Input (1-10) | Standardized scoring metric measuring response clarity, technical correctness, and logical structure. Initialized to save integer/float ratings into `rating`. |
| `Strengths & Positive Feedback` | Multiline Textarea Control | Input space allocated for citing successful response traits (E.g., adherence to STAR structured phrasing, confident vocal pacing, accurate indexing algorithms). Initialized for `strengths`. |
| `Areas for Improvement` | Multiline Textarea Control | Actionable diagnostic critique detailing technical discrepancies, filler words ("umm", "uh"), or system design omissions requiring correction. Initialized for `improvements`. |
| `Recommended Study Resources` | URL Input Field (References) | Input field for attaching educational URLs (E.g., `https://react.dev`, `https://w3schools.com`, `mdn.io`) to guide candidate self-correction. Initialized for `recommended_resources`. |
| `Submit Feedback & Score Button` | Action Submit Button (Primary) | Finalization trigger persisting the evaluation entity into the `mentor_reviews` table and updating the corresponding submission status to completed review (`reviewed`). |

#### Database Access
| Table | CRUD | Description |
| :--- | :--- | :--- |
| `mentor_reviews` / `interview_feedback` | C | **Create (C):** Create a new evaluation record binding Mentor UUID, target candidate submission ID, numerical `rating`, qualitative text commentaries, and reference resource URLs. |
| `practice_submissions` | U | **Update (U):** Mutate target submission state column `review_status` from pending/unassigned to completed evaluation (`reviewed`). |

#### SQL Commands
```sql
-- 1. Insert structured diagnostic evaluation and score rating for candidate recording submission (UC32 - <<include>> UC31)
INSERT INTO public.mentor_reviews (
  submission_id, mentor_id, rating, strengths, improvements, recommended_resources, created_at
) VALUES (
  'd6012345-6789-0123-def0-3456789012de',
  auth.uid(),
  9.5,
  'Flawless structural execution! You followed the STAR methodology perfectly when breaking down system scaling challenges, maintaining confident professional tone and precise database partitioning terminology.',
  'During the middle segment discussing caching invalidation strategies, pacing became slightly accelerated. Try to slow your conversational tempo and cite exact percentage improvements to maximize persuasiveness.',
  'https://www.postgresql.org/docs/current/performance-tips.html',
  NOW()
);

-- 2. Update candidate submission record state to mark evaluation as completed
UPDATE public.practice_submissions
SET review_status = 'reviewed',
    updated_at = NOW()
WHERE id = 'd6012345-6789-0123-def0-3456789012de';
```

---

### 4.10 UC33 - Contact Candidate
**a. Screen/Function Name: Direct Candidate Communication Bridge & Messaging Portal (`MentorSession.jsx` & Email Routing Engine)**
*[Provide brief description of the screen/function + related UC here and other details as in the sub-sections]*
> **Function & Use Case Description (UC33):** Facilitate direct communication between Mentors and Candidates before or during scheduled sessions. Mentors gain authorized visibility into registered candidate email addresses and contact phone numbers within confirmed booking details, enabling direct message transmission via session notes or automated EmailJS bridging to resolve pre-interview inquiries or distribute study requirements.

#### UI Design
**<<Mockup prototype - UI Layout & Component Description>>**
*(Mockup Capture Instruction: Inside the booking details or interview session screen, capture the section displaying the **Candidate Email & Contact Details** alongside the **Direct Message / Session Notes Editor** and **Send Notification / Contact** action button).*

| Field Name | Field Type | Description |
| :--- | :--- | :--- |
| **Direct Candidate Communication Controls (UC33)** | | |
| `Candidate Email Address Link` | Interactive Email Text & Link | Displays verified Candidate account email (E.g., `de190975nguyenanhminh@gmail.com`). Clicking triggers standard desktop email client composing windows. |
| `Candidate Contact Telephone` | Phone Display Label | Secure phone number identifier exposed exclusively to authenticated Mentors upon confirmed appointment status to enable rapid contact. |
| `Direct Message / Notes Editor` | Multiline Textarea Control | Text interface enabling Mentors to compose preparatory messages or interview instructions (E.g., *"Please prepare your PDF resume and test microphone 5 minutes prior"*). Initialized for `notes`. |
| `Send Contact Notification Button` | Action Trigger Button | Executes database updates persisting instructional notes and fires automated EmailJS transmission carrying Mentor messaging directly to candidate inboxes. |

#### Database Access
| Table | CRUD | Description |
| :--- | :--- | :--- |
| `profiles` (Candidate) | R | **Read (R):** Fetch specific contact parameters (`email` and `phone` columns) assigned to the Candidate participating in the booked session. |
| `mentor_bookings` | U | **Update (U):** Write instructional messages and conversational updates directly into the session `notes` column for dual-party consultation. |

#### SQL Commands
```sql
-- 1. Fetch authenticated contact telephone and email credentials of target candidate (UC33)
SELECT id, full_name, email, phone, avatar_url, specialization
FROM public.profiles
WHERE id = 'a1012345-6789-0123-ef01-4567890123ef';

-- 2. Update session notes with direct instructional message for targeted candidate communication
UPDATE public.mentor_bookings
SET notes = 'Hello Anh Minh! Tomorrow at 14:00 we will focus heavily on React Frontend architecture and System Design patterns. Please have your development environment ready!',
    updated_at = NOW()
WHERE id = 'b4012345-6789-0123-bcde-1234567890bc' AND mentor_id = auth.uid();
```

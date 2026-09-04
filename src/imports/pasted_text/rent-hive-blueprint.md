You are a senior full-stack software architect, UI/UX designer, React.js developer, Supabase developer, database architect, and security engineer.

Build a FULLY FUNCTIONAL, PRODUCTION-READY web application called:

============================================================
RENT HIVE
A Web-Based Rental Marketplace For Accessible and Secure
Peer-to-Peer Product Transactions
============================================================

RENT HIVE is a peer-to-peer rental marketplace where users can register either as:

1. RENTER
2. LESSOR

The platform allows lessors to publish products for rent and renters to search, request, reserve, pay rental fees/deposits, receive products, use them during the rental period, return them, complete condition verification, resolve disputes, and review each other.

IMPORTANT:
The uploaded RENT HIVE SYSTEM BLUEPRINT is the primary functional reference for the application.

Recreate the workflows, information architecture, transaction flow, renter flow, lessor flow, and administrator functions represented in the blueprint.

Do NOT create only static pages.
Every major feature must be functional and connected to Supabase.

============================================================
1. REQUIRED TECHNOLOGY STACK
============================================================

Frontend:
- React.js
- Vite
- Tailwind CSS
- React Router
- JavaScript or TypeScript
- Lucide React icons
- Recharts for charts and graphs

Backend:
- Supabase
- Supabase PostgreSQL Database
- Supabase Authentication
- Supabase Storage
- Supabase Realtime
- Supabase Edge Functions

IMPORTANT:
Do NOT create a separate Node.js, Express.js, Laravel, PHP, or Firebase backend.

All backend/server-side operations must use:
- Supabase Database
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Supabase Edge Functions

Use Supabase Edge Functions whenever secure server-side logic is required.

============================================================
2. APPLICATION DESIGN
============================================================

Create a modern, professional, responsive marketplace interface.

Design inspiration:
- Airbnb
- Facebook Marketplace
- modern fintech dashboards
- modern SaaS applications
- modern rental platforms

The interface should feel:
- trustworthy
- secure
- modern
- clean
- professional
- accessible
- easy for first-time users

Use:
- rounded cards
- subtle shadows
- clean typography
- modern spacing
- responsive layouts
- clear status badges
- modern navigation
- attractive product cards
- modal dialogs
- confirmation dialogs
- toast notifications
- loading states
- skeleton loaders
- empty states
- error states

Do NOT make the application look like a generic admin template.

Create a unique RENT HIVE visual identity.

Use the RENT HIVE branding throughout:
- logo
- favicon
- navigation
- dashboards
- authentication pages
- transaction pages
- emails/notifications where applicable

============================================================
3. RESPONSIVE DESIGN
============================================================

The application must work properly on:

- Desktop
- Laptop
- Tablet
- Mobile phone

Create responsive layouts using Tailwind CSS.

The renter marketplace should prioritize mobile usability.

Dashboards should support:
- desktop
- tablet
- mobile

On mobile:
- use responsive navigation
- collapsible sidebar
- bottom navigation where appropriate
- responsive tables
- horizontally scrollable data tables when necessary
- responsive charts

============================================================
4. USER ONBOARDING
============================================================

Follow this onboarding flow from the blueprint:

REGISTER
      ↓
VERIFY IDENTITY
      ↓
ACCOUNT REVIEW
      ↓
LOGIN
      ↓
ACCESS APPLICATION

Registration fields:

- Full Name
- Email
- Phone Number
- Password
- Confirm Password
- User Type

User Type:
- Renter
- Lessor

Allow users to select their account type during registration.

However, structure the database so the platform can support users having both renter and lessor capabilities in the future.

============================================================
5. AUTHENTICATION
============================================================

Use Supabase Authentication.

Support:

- Email/password registration
- Email/password login
- Logout
- Password reset
- Email verification
- Session persistence
- Protected routes
- Role-based routing

Optional:
- Phone authentication
- biometric login where supported by the browser/device

Create authentication pages:

- Login
- Register
- Forgot Password
- Reset Password
- Email Verification
- Identity Verification
- Account Pending Review
- Account Approved
- Account Rejected

Never store raw passwords in the database.

Use Supabase Auth.

============================================================
6. IDENTITY VERIFICATION
============================================================

Implement an identity verification workflow.

Users should be able to submit:

- Valid government ID
- ID information
- Selfie/photo for verification
- Phone verification

Create verification statuses:

- Not Started
- Pending
- Under Review
- Verified
- Rejected
- Resubmission Required

Admin must be able to:

- view verification requests
- review verification information
- approve verification
- reject verification
- request resubmission
- suspend accounts

IMPORTANT SECURITY REQUIREMENTS:

Identity documents must NOT be publicly accessible.

Store verification files in private Supabase Storage buckets.

Use Supabase Storage policies and signed URLs.

Never expose identity documents through public URLs.

Do not store unnecessary sensitive identity information.

============================================================
7. RENTER SIDE
============================================================

Create a complete RENTER marketplace.

Main renter navigation:

- Home
- Search
- Categories
- Rentals
- My Rentals
- Messages
- Notifications
- Profile

============================================================
8. RENTER HOME
============================================================

Home page should contain:

- Search bar
- Product categories
- Recommended rentals
- Nearby/popular rentals
- Recently added products
- Featured products
- My active rentals
- Upcoming rentals
- Notifications

Search bar should allow:

- product name
- category
- location
- keywords

============================================================
9. SEARCH AND FILTER
============================================================

Create a powerful search system.

Filters:

- Category
- Location
- Rental dates
- Price range
- Condition
- Rating
- Availability
- Deposit amount
- Product type

Sorting:

- Recommended
- Price low to high
- Price high to low
- Highest rated
- Newest
- Most rented

Search results must update dynamically.

Use Supabase queries efficiently.

============================================================
10. PRODUCT DETAILS PAGE
============================================================

Every rental product must have a detailed product page.

Display:

- Product photos
- Product videos
- Product name
- Description
- Category
- Condition
- Rental price
- Rental pricing unit
- Security deposit
- Availability
- Location
- Lessor profile
- Lessor rating
- Reviews
- Rental rules
- Cancellation policy
- Product specifications
- Previous rental information where appropriate

Actions:

- Select rental dates
- Select pickup/delivery option
- Request rental
- Message lessor
- View lessor profile
- Save/favorite listing

============================================================
11. RENTAL REQUEST
============================================================

The renter must be able to:

1. Select rental dates
2. Choose pickup/delivery option
3. Review rental terms
4. View rental fee
5. View security deposit
6. View incidental fee if applicable
7. Review total estimated amount
8. Submit rental request

Request status:

- Draft
- Pending
- Accepted
- Declined
- Cancelled
- Payment Pending
- Confirmed
- Active
- Returned
- Completed
- Disputed

============================================================
12. TRANSACTION AND ESCROW FLOW
============================================================

Implement the central transaction workflow from the blueprint.

FLOW:

1. REQUEST SENT

Renter sends rental request.

Lessor receives the request.

------------------------------------------------------------

2. REQUEST ACCEPTED

Lessor accepts request.

Rental becomes provisionally confirmed.

Renter receives notification.

------------------------------------------------------------

3. RESERVATION FEE PAYMENT

Renter pays the reservation fee.

The reservation fee is:
- non-refundable according to platform policy
- credited toward the rental total where applicable

Transaction status:
Pending

Reservation must be secured after successful payment.

------------------------------------------------------------

4. INCIDENTAL FEE PAYMENT

Renter pays the incidental/security-related fee.

The amount is held as part of the protected transaction.

Use an escrow transaction abstraction.

Do NOT falsely represent money as being held by Supabase itself.

If an actual payment provider is integrated later, create a payment-provider abstraction and Edge Functions for secure payment operations.

For development/demo mode, provide a mock payment flow that clearly indicates TEST MODE.

------------------------------------------------------------

5. PAYMENT OF BALANCE AND DEPOSIT

Renter pays:

- remaining rental balance
- security deposit

The transaction becomes fully funded.

Status:

Payment Completed
Funds Pending Release

------------------------------------------------------------

6. PRODUCT HANDOVER

Lessor hands over the product.

Both parties can upload condition documentation:

- photos
- videos
- notes
- timestamp
- condition checklist

Create a handover record.

Lessor confirms handover.

Renter confirms receipt.

------------------------------------------------------------

7. RENTAL PERIOD

During rental:

Renter can:

- view rental details
- view dates
- message lessor
- report an issue
- request extension
- view payment information

Lessor can:

- view rental status
- message renter
- view rental information

------------------------------------------------------------

8. PRODUCT RETURN

Renter returns product.

Renter uploads:

- return photos
- return videos
- condition notes

Lessor receives returned product.

Lessor uploads return condition documentation.

------------------------------------------------------------

9. CONDITION CHECK

Lessor compares:

INITIAL CONDITION
versus
RETURN CONDITION

Create a condition comparison interface.

Possible outcomes:

NO ISSUE

or

ISSUE / DISPUTE

If no issue:

Rental is completed.

If damage/loss is reported:

Create a dispute.

============================================================
13. DISPUTE MANAGEMENT
============================================================

Create a complete dispute system.

Dispute reasons:

- Product damage
- Product missing
- Late return
- Incorrect product
- Condition disagreement
- Payment issue
- Cancellation issue
- Other

Dispute fields:

- dispute ID
- rental ID
- reporter
- respondent
- reason
- description
- evidence
- photos
- videos
- timestamps
- status
- admin notes
- resolution
- resolution amount
- created date
- resolved date

Dispute statuses:

- Open
- Under Review
- Waiting for Evidence
- Resolved
- Rejected
- Escalated
- Closed

Admin must be able to:

- review dispute
- view evidence
- communicate with parties
- request additional evidence
- approve refund
- approve deposit deduction
- release deposit
- partially deduct deposit
- close dispute

============================================================
14. DEPOSIT RELEASE
============================================================

After condition verification:

IF NO ISSUE:

Release security deposit according to platform policy.

IF ISSUE:

Hold deposit until dispute resolution.

Admin can determine:

- Full release
- Partial deduction
- Full deduction
- Refund
- Other resolution

Create a complete transaction history.

============================================================
15. LESSOR SIDE
============================================================

Create a dedicated LESSOR dashboard.

Main navigation:

- Dashboard
- Listings
- Requests
- Rentals
- Calendar
- Earnings
- Messages
- Notifications
- Reviews
- Profile
- Settings

============================================================
16. LESSOR DASHBOARD
============================================================

Dashboard must contain REAL-TIME charts.

Use:
- Recharts
- Supabase Realtime
- PostgreSQL aggregation queries

Dashboard cards:

- Total Earnings
- Active Rentals
- Active Listings
- Pending Requests
- Completed Rentals
- Average Rating
- Total Products
- Pending Disputes

Charts:

1. Earnings Over Time
2. Rental Transactions
3. Listing Performance
4. Product Popularity
5. Rental Status Distribution
6. Monthly Revenue
7. Requests Accepted vs Declined

Charts must update when relevant database data changes.

Do not fake real-time behavior.

Use Supabase Realtime subscriptions where appropriate.

============================================================
17. CREATE LISTING
============================================================

Lessor can create rental listings.

Fields:

- Product name
- Category
- Description
- Product condition
- Rental price
- Pricing unit
- Security deposit
- Incidental fee
- Location
- Availability
- Rental rules
- Pickup options
- Delivery options
- Product specifications
- Photos
- Videos

Listing statuses:

- Draft
- Pending Review
- Published
- Unpublished
- Rejected
- Suspended

Allow multiple product images.

Use Supabase Storage.

Create image upload preview.

Allow:
- upload
- remove
- reorder
- set primary image

============================================================
18. LISTING MANAGEMENT
============================================================

Lessor can:

- Create listing
- Edit listing
- Publish listing
- Unpublish listing
- Delete listing
- View listing
- Duplicate listing
- Manage availability
- View performance

Listing performance:

- Views
- Requests
- Accepted rentals
- Completed rentals
- Revenue
- Rating

============================================================
19. LESSOR REQUEST MANAGEMENT
============================================================

Create request management interface.

Display:

- renter profile
- renter rating
- verification status
- requested product
- rental dates
- rental fee
- deposit
- incidental fee
- pickup/delivery
- renter message

Actions:

- Accept
- Decline
- Message renter

Use confirmation dialogs before accepting/declining.

============================================================
20. LESSOR RESERVATION PAYMENT
============================================================

Lessor dashboard must show:

Reservation fee received
Incident fee received
Balance received
Security deposit received

Display transaction status clearly.

Example badges:

PAID
PENDING
HELD
RELEASED
REFUNDED
DISPUTED

============================================================
21. HANDOVER MANAGEMENT
============================================================

Create handover workflow.

Lessor must be able to:

- confirm product handover
- upload photos
- upload videos
- record product condition
- add notes
- confirm date/time
- confirm renter receipt

============================================================
22. DURING RENTAL
============================================================

Lessor can:

- view rental details
- message renter
- view rental dates
- monitor active rental
- see return deadline
- approve rental extension requests

============================================================
23. PRODUCT RETURN
============================================================

Lessor can:

- confirm returned product
- upload return condition
- upload photos
- upload videos
- compare original and returned condition
- report damage
- initiate dispute

============================================================
24. REVIEWS AND RATINGS
============================================================

After successful completion:

Both parties can review each other.

Renter can review:
- lessor
- product
- rental experience

Lessor can review:
- renter
- rental experience

Rating:
1 to 5 stars.

Allow written review.

Create rating aggregation.

Display:

- average rating
- rating count
- rating distribution
- reviews

Prevent duplicate reviews for the same rental.

============================================================
25. MESSAGING
============================================================

Create real-time in-app messaging.

Use:
- Supabase Realtime
- PostgreSQL

Features:

- renter ↔ lessor messaging
- conversation list
- unread message count
- timestamps
- read/unread status
- message notifications

Messages should be associated with the relevant rental/request where possible.

============================================================
26. NOTIFICATION SYSTEM
============================================================

Create notification center.

Notifications for:

- Registration
- Verification
- Account approval
- Rental request
- Request accepted
- Request declined
- Payment received
- Payment pending
- Handover
- Return
- Dispute
- Review
- Message
- Rental reminder
- Deposit release

Use realtime notifications.

============================================================
27. ADMIN PANEL
============================================================

Create a separate ADMIN dashboard.

Admin navigation:

- Dashboard
- Users
- Identity Verification
- Listings
- Rentals
- Transactions
- Payments
- Disputes
- Reviews
- Reports
- Analytics
- System Settings
- Audit Logs

============================================================
28. ADMIN DASHBOARD
============================================================

Create a professional real-time analytics dashboard.

Cards:

- Total Users
- Active Renters
- Active Lessors
- Total Listings
- Active Rentals
- Completed Rentals
- Total Revenue
- Pending Verification
- Pending Disputes
- Total Transactions

REAL-TIME CHARTS:

1. Platform Revenue
2. Rental Transactions
3. User Registration
4. Renter vs Lessor
5. Active Listings
6. Rental Status
7. Category Popularity
8. Transaction Volume
9. Dispute Statistics
10. Monthly Platform Growth

Use Recharts.

Charts should be responsive.

Use Supabase Realtime where real-time updates are useful.

============================================================
29. ADMIN USER MANAGEMENT
============================================================

Admin can:

- view users
- search users
- filter users
- view profile
- verify identity
- suspend account
- reactivate account
- change roles where authorized
- view rental history
- view transaction history
- view disputes

Do not allow normal users to access admin functions.

============================================================
30. ADMIN LISTING MANAGEMENT
============================================================

Admin can:

- review listings
- approve listings
- reject listings
- remove listings
- suspend listings
- inspect product information
- inspect reported listings

============================================================
31. ADMIN TRANSACTION MONITORING
============================================================

Admin can monitor:

- reservation payments
- incidental fees
- rental balances
- security deposits
- refunds
- released deposits
- disputed transactions

Create transaction status timeline.

============================================================
32. ADMIN DISPUTE MANAGEMENT
============================================================

Admin can:

- view all disputes
- filter disputes
- inspect evidence
- communicate with renter/lessor
- request additional evidence
- resolve disputes
- release deposits
- partially deduct deposits
- refund eligible payments
- close disputes

Every administrative decision must create an audit log.

============================================================
33. REPORTS AND ANALYTICS
============================================================

Create reports for:

- Sales
- Rental volume
- Revenue
- Users
- Listings
- Categories
- Lessors
- Renters
- Disputes
- Deposits
- Platform activity

Allow date filtering:

- Today
- 7 days
- 30 days
- 3 months
- 6 months
- 1 year
- Custom range

============================================================
34. DATABASE ARCHITECTURE
============================================================

Use Supabase PostgreSQL.

Create a properly normalized relational schema.

Suggested tables:

profiles
roles
user_roles
identity_verifications
identity_documents
categories
listings
listing_images
listing_videos
listing_availability
favorites
rental_requests
rentals
rental_items
rental_status_history
payments
payment_transactions
escrow_transactions
deposits
handover_records
handover_media
return_records
return_media
condition_reports
disputes
dispute_evidence
dispute_messages
reviews
messages
conversations
notifications
audit_logs
reports

Create proper foreign keys.

Use UUID primary keys.

Include:

created_at
updated_at

where appropriate.

Use database indexes for:

- user_id
- listing_id
- rental_id
- status
- created_at
- category_id
- location
- payment status

============================================================
35. ROW LEVEL SECURITY
============================================================

This is extremely important.

Enable Supabase Row Level Security.

Users must only be able to access information they are authorized to see.

Examples:

RENTER:
- can view public listings
- can manage own profile
- can view own rentals
- can create own rental requests
- can view their own payments
- can message relevant lessors
- can create reviews for eligible rentals

LESSOR:
- can manage own listings
- can view requests for their listings
- can view their rentals
- can view their earnings
- can message relevant renters

ADMIN:
- full authorized management access

Never rely only on frontend role checks.

Authorization must be enforced using Supabase RLS.

============================================================
36. SUPABASE STORAGE
============================================================

Create secure storage buckets.

Suggested buckets:

listing-media
handover-media
return-media
identity-documents
dispute-evidence
profile-images

Identity documents must be private.

Use signed URLs for private files.

Validate:

- file type
- file size
- ownership
- authorization

============================================================
37. SUPABASE EDGE FUNCTIONS
============================================================

Use Supabase Edge Functions for secure backend operations such as:

- payment initialization
- payment verification
- escrow state changes
- deposit release
- dispute resolution actions
- notification processing
- secure administrative operations
- external API integration
- webhook handling
- scheduled cleanup or reminders where applicable

Never expose secret keys in React frontend code.

Never place service-role credentials in the browser.

============================================================
38. PAYMENT ARCHITECTURE
============================================================

Design the application so payment providers can be integrated cleanly.

Create a payment service abstraction.

Support future providers such as:

- GCash
- Maya
- Stripe
- other supported payment gateways

Do not hard-code one provider throughout the application.

Create a payment status system:

- pending
- processing
- paid
- failed
- cancelled
- refunded
- held
- released
- disputed

For development:
Create a clearly labeled TEST PAYMENT MODE if no live gateway credentials are configured.

Never pretend that a real financial transaction occurred during test mode.

============================================================
39. ESCROW ARCHITECTURE
============================================================

Important:

Supabase itself is not a regulated escrow service.

Implement an application-level escrow state machine that tracks transaction states.

Example:

PAYMENT_PENDING
      ↓
PAYMENT_CONFIRMED
      ↓
FUNDS_HELD
      ↓
RENTAL_ACTIVE
      ↓
PRODUCT_RETURNED
      ↓
CONDITION_CHECK
      ↓
NO_ISSUE → DEPOSIT_RELEASED
      ↓
ISSUE → DISPUTE
      ↓
DISPUTE_RESOLVED
      ↓
FUNDS_RELEASED / DEDUCTED / REFUNDED

Actual custody of money must be handled by the integrated payment provider or legally appropriate financial mechanism.

============================================================
40. REAL-TIME FEATURES
============================================================

Use Supabase Realtime for:

- messages
- notifications
- rental status
- payment status
- requests
- dispute updates
- dashboard metrics where appropriate

Do not continuously poll the database unnecessarily.

Use realtime subscriptions efficiently.

Unsubscribe from channels when components unmount.

============================================================
41. ROUTING
============================================================

Create protected routes.

Example:

/
/login
/register
/forgot-password
/verify-account

/renter
/renter/home
/renter/search
/renter/listing/:id
/renter/request/:id
/renter/rentals
/renter/rentals/:id
/renter/messages
/renter/notifications
/renter/profile

/lessor
/lessor/dashboard
/lessor/listings
/lessor/listings/create
/lessor/listings/:id
/lessor/requests
/lessor/rentals
/lessor/calendar
/lessor/earnings
/lessor/messages
/lessor/reviews
/lessor/profile

/admin
/admin/dashboard
/admin/users
/admin/verifications
/admin/listings
/admin/rentals
/admin/transactions
/admin/disputes
/admin/reviews
/admin/reports
/admin/settings
/admin/audit-logs

============================================================
42. UI COMPONENT ARCHITECTURE
============================================================

Create reusable components.

Examples:

Button
Input
Select
Modal
Dialog
Dropdown
Toast
Badge
Card
Table
Pagination
Tabs
Sidebar
Navbar
Breadcrumb
Avatar
Rating
ProductCard
ListingCard
RentalCard
PaymentCard
TransactionTimeline
StatusBadge
FileUploader
ImageUploader
DatePicker
Calendar
ChartCard
EmptyState
LoadingState
ErrorState
ConfirmationDialog

Do not duplicate components unnecessarily.

============================================================
43. PRODUCT CARD
============================================================

Create modern marketplace product cards.

Display:

- image
- product name
- location
- rating
- rental price
- price unit
- condition
- availability
- lessor name
- verification badge

Actions:

- View
- Favorite
- Rent

============================================================
44. TRANSACTION TIMELINE
============================================================

Create a visual transaction timeline.

Example:

✓ Request Sent
      ↓
✓ Request Accepted
      ↓
✓ Reservation Fee Paid
      ↓
✓ Incidental Fee Paid
      ↓
✓ Balance + Deposit Paid
      ↓
✓ Product Handed Over
      ↓
● Rental Active
      ↓
○ Product Returned
      ↓
○ Condition Check
      ↓
○ Deposit Released
      ↓
○ Review Completed

Use different states:

Completed
Active
Pending
Failed
Disputed

============================================================
45. CALENDAR
============================================================

Lessor calendar must display:

- rental reservations
- blocked dates
- pending requests
- active rentals
- return dates

Prevent double-booking.

When a rental is confirmed:

Automatically update listing availability.

============================================================
46. RENTAL CALCULATION ENGINE
============================================================

Create a centralized rental calculation function.

Calculate:

Base rental fee
+
Reservation fee
+
Incidental fee
+
Security deposit
+
Delivery fee if applicable
-
Discounts if applicable
=
Total

Do not duplicate calculations across frontend components.

Important:
Final authoritative calculations must be performed server-side through Supabase Edge Functions or trusted database logic.

Never trust prices submitted directly by the browser.

============================================================
47. SECURITY
============================================================

Implement:

- Supabase Auth
- RLS
- secure storage
- protected routes
- input validation
- server-side validation
- authorization
- secure Edge Functions
- rate limiting where appropriate
- audit logs
- secure payment handling
- XSS protection
- safe rendering of user content
- file validation

Never expose:

- Supabase service role key
- payment secret keys
- private identity documents
- sensitive admin information

Environment variables must be used.

============================================================
48. AUDIT LOG
============================================================

Create audit logs for sensitive actions.

Record:

- user
- action
- entity
- entity ID
- previous value
- new value
- timestamp
- IP/device metadata where legally appropriate

Examples:

- Admin approved verification
- Admin suspended user
- Listing approved
- Payment status changed
- Deposit released
- Dispute resolved

============================================================
49. ERROR HANDLING
============================================================

Every important operation must have:

- loading state
- success state
- error state
- retry option

Show useful messages.

Do not expose raw database errors to users.

Example:

BAD:
"PostgrestError 23505..."

GOOD:
"This rental request could not be submitted because the selected dates are no longer available."

============================================================
50. EMPTY STATES
============================================================

Create polished empty states.

Examples:

"No rentals yet"
"No listings yet"
"No pending requests"
"No notifications"
"No messages"
"No disputes"
"No search results"

Provide useful actions.

============================================================
51. DEMO / SEED DATA
============================================================

Create seed/demo data for development.

Include:

- sample users
- sample renter
- sample lessor
- sample listings
- sample categories
- sample rentals
- sample transactions
- sample reviews
- sample dashboard statistics

Clearly identify demo data.

Do not hard-code dashboard values.

Dashboard data must come from the database.

============================================================
52. DASHBOARD REAL-TIME REQUIREMENT
============================================================

IMPORTANT:

Do NOT create fake animated charts.

Charts must be based on actual Supabase database data.

When data changes, dashboard statistics should update.

For example:

If a new rental is created:

Total rentals updates.

If a payment is recorded:

Revenue chart updates.

If a listing is added:

Listing count updates.

If a user registers:

User statistics update.

Use:

Supabase queries
+
PostgreSQL aggregation
+
Supabase Realtime

where appropriate.

============================================================
53. ACCESS CONTROL
============================================================

Create role-based access.

Roles:

ADMIN
LESSOR
RENTER

Potential future role:

MODERATOR

Create a centralized authorization system.

Frontend route guards are required.

Backend/database RLS is mandatory.

============================================================
54. ACCESSIBILITY
============================================================

Follow modern accessibility practices.

Include:

- keyboard navigation
- accessible labels
- semantic HTML
- sufficient contrast
- focus states
- accessible dialogs
- screen-reader-friendly controls

============================================================
55. PERFORMANCE
============================================================

Optimize:

- image loading
- database queries
- pagination
- lazy loading
- React rendering
- realtime subscriptions
- chart rendering

Use pagination for large tables.

Do not load thousands of records at once.

Use optimized image previews.

============================================================
56. PROJECT STRUCTURE
============================================================

Use a clean architecture such as:

src/
  components/
  pages/
  layouts/
  hooks/
  contexts/
  services/
  lib/
  utils/
  types/
  features/
    auth/
    renter/
    lessor/
    admin/
    listings/
    rentals/
    payments/
    disputes/
    messaging/
    notifications/
  routes/

supabase/
  migrations/
  functions/
  seed.sql
  config.toml

============================================================
57. ENVIRONMENT VARIABLES
============================================================

Create:

.env.example

Include only safe frontend variables such as:

VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

Server-side secrets must only exist in Supabase Edge Function secrets.

Never commit secrets.

============================================================
58. DATABASE MIGRATIONS
============================================================

Generate proper Supabase SQL migrations.

Include:

- tables
- relationships
- indexes
- constraints
- RLS policies
- functions
- triggers
- updated_at triggers
- necessary database views

Make the migration files executable in a new Supabase project.

============================================================
59. BUSINESS RULES
============================================================

Implement important rules.

1. A renter cannot reserve unavailable dates.

2. Two confirmed rentals cannot overlap for the same listing.

3. A lessor cannot approve their own rental request.

4. Users must be authenticated before renting.

5. Users must pass required verification before participating in transactions.

6. Payments must be verified server-side.

7. A renter cannot review a rental before completion.

8. A lessor cannot review a rental before completion.

9. Users cannot review the same rental multiple times.

10. Deposits cannot be released while a dispute is active.

11. Only authorized admins can resolve disputes.

12. Listing owners can only modify their own listings.

13. Private identity documents must never be publicly accessible.

14. Users cannot access another user's private transactions.

15. Payment totals must be calculated using trusted server-side logic.

============================================================
60. LANDING PAGE
============================================================

Create an attractive public landing page.

Hero:

RENT HIVE

"Rent What You Need.
Share What You Own."

Subtitle:

"An accessible and secure peer-to-peer rental marketplace connecting people who need products with people who have products to rent."

CTA:

Browse Rentals
List Your Product

Sections:

- How Rent Hive Works
- For Renters
- For Lessors
- Secure Transactions
- Identity Verification
- Escrow-Protected Process
- Reviews & Ratings
- Popular Categories
- Featured Listings
- Become a Lessor
- FAQ
- Footer

============================================================
61. HOW IT WORKS
============================================================

Show the process visually:

REGISTER
↓
VERIFY
↓
FIND A PRODUCT
↓
REQUEST RENTAL
↓
LESSOR ACCEPTS
↓
PAY
↓
HANDOVER
↓
RENT
↓
RETURN
↓
CONDITION CHECK
↓
DEPOSIT RELEASE
↓
REVIEW

============================================================
62. SECURITY DESIGN
============================================================

Prominently communicate:

- Verified Users
- Secure Transactions
- Protected Deposits
- Condition Documentation
- Dispute Resolution
- Ratings & Reviews

Do not make unsupported legal claims.

Use wording such as:

"Designed for secure transactions"

rather than guaranteeing that every transaction is risk-free.

============================================================
63. ADMIN ANALYTICS DESIGN
============================================================

Admin dashboard should look like a modern SaaS analytics platform.

Top:

Sidebar
Top navigation
Search
Notifications
Admin profile

Main:

Metric cards

Then:

Revenue chart
Rental volume chart
User growth chart

Then:

Recent transactions
Recent users
Pending verification
Pending disputes

Then:

Platform activity

Use responsive charts.

============================================================
64. LESSOR ANALYTICS DESIGN
============================================================

Lessor dashboard:

Revenue
Active Rentals
Pending Requests
Listings
Rating

Charts:

Revenue
Rental Trends
Listing Performance

Tables:

Recent Rentals
Recent Requests
Recent Transactions

============================================================
65. RENTER DASHBOARD
============================================================

Renter dashboard should be simpler and marketplace-focused.

Show:

- Active Rental
- Upcoming Rental
- Pending Requests
- Recent Rentals
- Saved Listings
- Recommended Products

============================================================
66. PROFILE
============================================================

Profile page:

- profile photo
- full name
- email
- phone
- verification badge
- rating
- reviews
- account type
- joined date
- transaction history

Allow users to edit permitted profile information.

============================================================
67. NOTIFICATION BADGES
============================================================

Use notification badges throughout the application.

Example:

Messages 3
Notifications 5
Requests 2

Use Supabase Realtime.

============================================================
68. FINAL USER EXPERIENCE
============================================================

The final application should feel like a real rental marketplace.

The renter experience should be similar to:

Marketplace
→ Search
→ Product
→ Request
→ Payment
→ Rental
→ Return
→ Review

The lessor experience should be:

Dashboard
→ Listing
→ Request
→ Accept
→ Payment
→ Handover
→ Rental
→ Return
→ Deposit
→ Review

The administrator experience should be:

Analytics
→ Users
→ Listings
→ Transactions
→ Disputes
→ Reports
→ Platform Management

============================================================
69. IMPORTANT DEVELOPMENT RULE
============================================================

DO NOT create fake functionality.

Do not make buttons that only display alerts such as:

"Coming soon"

unless the feature genuinely requires an external service that has not been configured.

For unavailable external integrations such as live payments:

Implement a clean TEST MODE.

All other features must be functional.

Forms must submit to Supabase.

Search must query Supabase.

Listings must be stored in Supabase.

Images must be stored in Supabase Storage.

Authentication must use Supabase Auth.

Messages must use Supabase Realtime.

Notifications must use Supabase.

Dashboards must use real database queries.

Transactions must use database state transitions.

============================================================
70. DEVELOPMENT PROCESS
============================================================

Build the application in this order:

PHASE 1
Project setup
React
Vite
Tailwind
Routing
Supabase connection

PHASE 2
Authentication
Registration
Login
Roles
Protected routes

PHASE 3
Database schema
Migrations
RLS
Storage

PHASE 4
Identity verification

PHASE 5
Renter marketplace

PHASE 6
Lessor dashboard

PHASE 7
Listing management

PHASE 8
Rental request system

PHASE 9
Transaction system

PHASE 10
Payment abstraction
Test payment mode
Edge Functions

PHASE 11
Handover and return

PHASE 12
Condition checking

PHASE 13
Disputes

PHASE 14
Messaging and notifications

PHASE 15
Reviews and ratings

PHASE 16
Admin dashboard

PHASE 17
Real-time analytics

PHASE 18
Security audit

PHASE 19
Responsive/mobile optimization

PHASE 20
Testing and final polish

============================================================
71. TESTING
============================================================

Create test scenarios for:

Authentication
Registration
Role assignment
Identity verification
Listing creation
Listing editing
Listing publishing
Search
Filtering
Rental request
Request acceptance
Request rejection
Payment
Rental confirmation
Handover
Rental period
Return
Condition check
Dispute
Deposit release
Review
Messaging
Notifications
Admin management
RLS
Unauthorized access
Double booking
Payment validation

============================================================
72. FINAL DELIVERABLE
============================================================

Deliver a fully functional application.

Include:

1. Complete React source code
2. Tailwind configuration
3. Supabase configuration
4. SQL migrations
5. Database schema
6. RLS policies
7. Storage policies
8. Supabase Edge Functions
9. Seed/demo data
10. Authentication
11. Renter interface
12. Lessor interface
13. Admin interface
14. Real-time messaging
15. Real-time notifications
16. Real-time charts
17. Rental workflow
18. Transaction workflow
19. Dispute workflow
20. Review system
21. Responsive design
22. .env.example
23. README.md
24. Deployment instructions

============================================================
73. README REQUIREMENTS
============================================================

README must explain:

- Project overview
- Features
- Tech stack
- Installation
- Supabase setup
- Environment variables
- Database migration
- Storage setup
- RLS setup
- Edge Functions deployment
- Seed data
- Development commands
- Production build
- Deployment
- Test accounts
- Test payment mode
- Security considerations

============================================================
74. FINAL QUALITY REQUIREMENT
============================================================

Before considering the application complete:

Check every route.

Check every button.

Check every form.

Check every database operation.

Check RLS.

Check authentication.

Check role permissions.

Check mobile responsiveness.

Check charts.

Check realtime subscriptions.

Check image uploads.

Check rental calculations.

Check transaction state transitions.

Check dispute workflow.

Check notifications.

Check error handling.

Fix all console errors.

Fix all broken imports.

Fix all TypeScript/JavaScript errors.

Fix all Supabase errors.

Remove placeholder content.

Remove fake statistics.

Remove unnecessary mock functionality.

The result should be a polished, modern, functional RENT HIVE peer-to-peer rental marketplace based directly on the supplied system blueprint.

============================================================
END OF REQUIREMENTS
============================================================
# Firestore Security Rules Specification

## Overview
This document outlines the security rules and access control policies for LibraryPro Modern Library Management System Firestore database (`linear-attic-jsx65`).

## Collections & Access Policies

### 1. `books`
- **Description**: Library book catalog, editions, authors, ISBNs, and copy counts.
- **Read**: Open to all users (students, faculty, public visitors) to browse the catalog.
- **Write**: Open for catalog management (adding books, updating book information, marking status). In production, can be restricted to authenticated staff (`request.auth != null`).

### 2. `members`
- **Description**: Student, faculty, and patron profiles, membership numbers, and contact details.
- **Read**: Readable by authorized staff and patrons.
- **Write**: Allow updates when registering patrons or modifying member status.

### 3. `loans`
- **Description**: Active and completed circulation checkout and return records.
- **Read**: Visible to circulation desk staff and patrons.
- **Write**: Created when a book is issued, updated when renewed or returned.

### 4. `fines`
- **Description**: Late return penalty records, payment status, and receipts.
- **Read**: Visible to staff and the member charged.
- **Write**: Created upon overdue returns, updated upon payment or waiver.

### 5. `reservations`
- **Description**: Hold queues for checked-out books.
- **Read**: Visible to library staff and requesting members.
- **Write**: Created upon member hold request, updated upon fulfillment or cancellation.

### 6. `users`
- **Description**: Staff profiles and role assignments (`SUPER_ADMIN`, `LIBRARIAN`, `ASSISTANT`).
- **Read**: Readable by library staff.
- **Write**: Managed by administrative users.

### 7. `settings`
- **Description**: Library policies (loan duration, fine rates, max books quota).
- **Read**: Publicly readable for client loan calculation.
- **Write**: Configurable by administrators.

### 8. `activity_logs`
- **Description**: Audit trail of library operations.
- **Read**: Readable by staff for operational auditing.
- **Write**: Appended on system actions.

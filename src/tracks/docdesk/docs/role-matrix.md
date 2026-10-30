# DocDesk Role & Permission Matrix

## Summary Table

| Capability | Student | Faculty | Other Office Staff (Non-SA) | Student Affairs Office Staff | Admin |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Access DocDesk** | Yes | Yes | Yes | Yes | Yes |
| **View Own Requests** | Yes | Yes | Yes | Yes | Yes (all requests) |
| **Submit New Request** | Yes | Yes | Yes | Yes | No (Read-only) |
| **Edit Own Pending Request** | Yes | Yes | Yes | Yes | No |
| **Withdraw Own Pending Request** | Yes | Yes | Yes | Yes | No |
| **View Answers** | Yes (own) | Yes (own) | Yes (own) | Yes (all) | Yes (all) |
| **Download Answer Document** | Yes (own) | Yes (own) | Yes (own) | Yes (all) | Yes (all) |
| **Upload Eligible Filled Form** | Yes (own) | Yes (own) | Yes (own) | Yes (own) | No |
| **Download Filled Form** | Yes (own) | Yes (own) | Yes (own) | Yes (all) | Yes (all) |
| **Delete Filled Form** | Yes (own) | Yes (own) | Yes (own) | Yes (own) | No |
| **Acknowledge Answered Request** | Yes (own) | Yes (own) | Yes (own) | Yes (own) | No |
| **View Document Types** | Yes | Yes | Yes | Yes | Yes |
| **View All Requests** | No | No | No | Yes | Yes |
| **View Request Details** | Yes (own) | Yes (own) | Yes (own) | Yes (all) | Yes (all) |
| **Answer Requests** | No | No | No | Yes | No |
| **Edit Answers** | No | No | No | Yes | No |
| **Withdraw Answers** | No | No | No | Yes | No |
| **Set Turnaround Time (Single)** | No | No | No | Yes | No |
| **Set Turnaround Time (Bulk)** | No | No | No | Yes | No |
| **Manage Document Types** | No | No | No | Yes | No |
| **Admin Route Inspection** | No | No | No | No | Yes |

---

## Detailed Role Specifications

### 1. Student
**Can:**
- View own document requests (`request.read.own`).
- Submit new requests (`request.create`).
- Edit own requests while pending (`request.edit` — requires `isOwner` and status `pending`).
- Withdraw own requests while pending (`request.withdraw` — requires `isOwner` and status `pending`).
- View answers (`request.read.detail` on own requests).
- Download the document sent with an answer (`document.download` — requires `isOwner` and attached document).
- Upload a filled-in form when eligible (`filledForm.upload` — requires `isOwner`, status `answered`, and staff attached a document).
- Download their filled-in form (`filledForm.download` — requires `isOwner` and attached form).
- Acknowledge their own answered requests (`request.acknowledge` — requires `isOwner` and status `answered`).
- View document types (`docType.read`).

### 2. Faculty
- Has identical requester permissions to Student across all DocDesk capabilities.

### 3. Other Office Staff (`role === 'office_staff'`, `dept !== 'Student Affairs'`)
**Can:**
- Submit document requests (`request.create`).
- View own requests (`request.read.own`).
- Edit and withdraw own pending requests (`request.edit`, `request.withdraw`).
- View answers.
- Download their own documents (`document.download`).
- Upload/download eligible filled-in forms (`filledForm.upload`, `filledForm.download`).
- Acknowledge own answered requests (`request.acknowledge`).
- View document types (`docType.read`).

**CANNOT:**
- Answer requests (`answer.create`, `answer.edit`, `answer.withdraw` are forbidden).
- Manage document types (`docType.create`, `docType.edit`, `docType.archive`, `docType.restore`, `docType.delete` are forbidden).
- Set turnaround times (`tat.set.single`, `tat.set.bulk` are forbidden).
- Access Student Affairs operations routes (`/tracks/docdesk/staff/*` guarded by `StudentAffairsGuard`).

### 4. Student Affairs Office Staff (`role === 'office_staff'`, `dept === 'Student Affairs'`)
**Can:**
- Submit and manage their own document requests (`request.create`, `request.read.own`, `request.edit`, `request.withdraw`).
- View everyone else's requests (`request.read.all`).
- View individual request details (`request.read.detail`).
- Answer requests (`answer.create` on pending requests).
- Edit answers (`answer.edit` on answered requests).
- Withdraw answers (`answer.withdraw` on answered requests, reverting them to pending).
- Manage document types (`docType.create`, `docType.edit`, `docType.archive`, `docType.restore`, `docType.delete`).
- Set turnaround time for pending requests (`tat.set.single`).
- Set turnaround time in bulk (`tat.set.bulk`).
- Download documents and filled-in forms across requests (even when not owner).
- Download their own requested documents.
- Acknowledge their own answered requests (`request.acknowledge` — requires `isOwner` and status `answered`).

### 5. Admin (`role === 'admin'`)
**Can:**
- View all DocDesk requests (`request.read.all`).
- View individual request details (`request.read.detail`).
- View document types (`docType.read`).
- Download answer documents (`document.download`).
- Download filled-in forms (`filledForm.download`).

**Admin is strictly READ-ONLY inside DocDesk:**
Admin cannot:
- Create a document request through DocDesk (`request.create` = `false`).
- Answer requests (`answer.create` = `false`).
- Edit or withdraw answers (`answer.edit` = `false`, `answer.withdraw` = `false`).
- Set turnaround time (`tat.set.single` = `false`, `tat.set.bulk` = `false`).
- Manage document types (`docType.create` = `false`, etc.).
- Upload filled-in forms (`filledForm.upload` = `false`).
- Acknowledge requests (`request.acknowledge` = `false`).

*Admin manages campus accounts. Student Affairs processes document requests.*

---

## Profile & Department Resolution

1. **Role Identification**:
   - The login response profile contains `profile.role` (`'admin' | 'student' | 'faculty' | 'office_staff'`).
2. **Department Identification**:
   - Office staff profiles include `profile.dept` (e.g., `'Student Affairs'`, `'Accounts'`, `'Registrar'`).
   - The `useProfile()` hook inspects both the session `user.dept` and the backend `/api/v1/users/me` response.
   - Department comparison is performed using `isStudentAffairs(dept)`:
     - Normalizes whitespace and casing.
     - Strips trailing `"dept"` tokens.
     - Matches strictly to `'student affairs'`.

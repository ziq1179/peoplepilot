# Leave Management System
## User Workflow Guide

---

## 📋 Slide 1: Overview

### What is the Leave Management System?

A complete solution for managing employee leave requests from submission to approval.

**Key Features:**
- ✅ Submit leave requests online
- ✅ Real-time balance tracking
- ✅ Quick approval process
- ✅ Complete request history
- ✅ Automatic balance updates

**Who can use it?**
- 👤 **Employees**: Request and track leave
- 👔 **Managers/HR**: Approve or reject requests
- ⚙️ **Admins**: Configure leave policies

---

## 👤 Slide 2: Employee Workflow - Requesting Leave

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────┐
│  1. CHECK BALANCE                                       │
│  └─> View your available leave days in the sidebar     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  2. SELECT LEAVE TYPE                                   │
│  └─> Choose: Annual, Sick, Personal, etc.              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  3. PICK DATES                                          │
│  └─> Start date and end date                           │
│  └─> System calculates business days automatically     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  4. ADD REASON (Optional)                               │
│  └─> E.g., "Family vacation" or "Medical appointment"  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  5. SUBMIT REQUEST                                      │
│  └─> Request sent to manager/HR for approval           │
│  └─> Status: PENDING                                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  6. TRACK YOUR REQUEST                                  │
│  └─> Go to "My Leave Requests" to see status           │
│  └─> View: Pending | Approved | Rejected               │
└─────────────────────────────────────────────────────────┘
```

**Navigation:**
- Request Leave: Main Menu → "Request Leave"
- My Requests: Employee Self-Service → "My Leave Requests"

---

## 👔 Slide 3: Manager/HR Workflow - Approving Leave

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────┐
│  1. OPEN LEAVE APPROVALS                                │
│  └─> Main Menu → "Leave Approvals"                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  2. REVIEW PENDING REQUESTS                             │
│  └─> See: Employee name, dates, days, reason           │
│  └─> Check team calendar for conflicts                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  3. MAKE DECISION                                       │
│  └─> Click "Approve" or "Reject" button                │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  4. ADD COMMENTS                                        │
│  └─> Required: Provide feedback to employee            │
│  └─> E.g., "Approved - enjoy!" or "Please reschedule"  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  5. CONFIRM ACTION                                      │
│  └─> System automatically updates:                     │
│      • Request status                                   │
│      • Employee leave balance (if approved)             │
│      • Employee notification                            │
└─────────────────────────────────────────────────────────┘
```

**What happens after approval?**
- ✅ Employee sees "Approved" status
- ✅ Leave days deducted from balance
- ✅ Request visible in employee's history
- ✅ Reviewer comments displayed to employee

---

## ⚙️ Slide 4: Admin Workflow - Managing Leave Types

### Setting Up Leave Policies

```
┌─────────────────────────────────────────────────────────┐
│  1. ACCESS LEAVE TYPES                                  │
│  └─> Settings → "Leave Types"                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  2. CREATE NEW LEAVE TYPE                               │
│  └─> Click "Add Leave Type" button                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  3. CONFIGURE POLICY                                    │
│  └─> Name: e.g., "Study Leave"                         │
│  └─> Code: e.g., "SL"                                   │
│  └─> Default Days: e.g., 5 days per year               │
│  └─> Color: Choose a color for visual identification   │
│  └─> Carry Forward: Enable/disable rollover            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  4. SAVE & ACTIVATE                                     │
│  └─> Leave type now available for all employees        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  5. INITIALIZE EMPLOYEE BALANCES                        │
│  └─> New employees get balances automatically          │
│  └─> Existing employees: initialize via API            │
└─────────────────────────────────────────────────────────┘
```

**Default Leave Types Available:**
- 🏖️ Annual Leave: 20 days
- 🏥 Sick Leave: 10 days
- 🏡 Personal Leave: 5 days
- 👶 Maternity Leave: 90 days
- 👨‍👶 Paternity Leave: 14 days
- 💐 Compassionate Leave: 7 days

---

## 🔄 Slide 5: Complete Workflow Diagram

### The Full Journey

```
┌──────────────┐
│   EMPLOYEE   │
│  Requests    │
│    Leave     │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────┐
│   SYSTEM VALIDATES                   │
│   • Sufficient balance?              │
│   • Valid dates?                     │
│   • Employee profile active?         │
└──────┬───────────────────────────────┘
       │
       ↓ YES
┌──────────────────┐
│  Request Saved   │
│  Status: PENDING │
└──────┬───────────┘
       │
       ↓
┌──────────────┐
│  MANAGER/HR  │
│   Reviews    │
│   Request    │
└──────┬───────┘
       │
       ├───────────┐
       │           │
       ↓           ↓
┌──────────┐  ┌──────────┐
│ APPROVE  │  │  REJECT  │
│          │  │          │
└────┬─────┘  └────┬─────┘
     │             │
     │             │
     ↓             ↓
┌────────────┐  ┌────────────┐
│  Balance   │  │  Balance   │
│  DEDUCTED  │  │ UNCHANGED  │
└────┬───────┘  └────┬───────┘
     │             │
     └─────┬───────┘
           │
           ↓
    ┌──────────────┐
    │   EMPLOYEE   │
    │  Notified    │
    │ (via status) │
    └──────────────┘
```

---

## 📊 Slide 6: Balance Tracking

### How Your Leave Balance Works

```
┌─────────────────────────────────────────────┐
│           LEAVE BALANCE CARD                │
├─────────────────────────────────────────────┤
│                                             │
│  Allocated:    20 days  ────────┐          │
│                                  │          │
│  Used:          3 days  ─────┐  │          │
│                               │  │          │
│  Remaining:    17 days  ◄────┴──┘          │
│                                             │
│  Formula: Remaining = Allocated - Used     │
└─────────────────────────────────────────────┘
```

**When does balance update?**
- ➕ **Allocated**: Set when balances initialized (start of year)
- ➖ **Used**: Increases when request is APPROVED
- ⏸️ **Pending**: Requests don't affect balance until approved
- ❌ **Rejected**: No impact on balance

**Where to check balance?**
1. Request Leave page → Sidebar shows all balances
2. My Leave Requests → See used days per request

---

## 🎯 Slide 7: Key Benefits

### Why Use This System?

**For Employees:**
- ✅ Submit requests anytime, anywhere
- ✅ See real-time balance - no guessing
- ✅ Track all requests in one place
- ✅ Get instant status updates
- ✅ No paper forms or emails

**For Managers:**
- ✅ Review all requests in one dashboard
- ✅ Quick approve/reject with one click
- ✅ Add context with comments
- ✅ No manual balance calculations
- ✅ Better team planning visibility

**For HR/Admins:**
- ✅ Centralized leave data
- ✅ Automated balance management
- ✅ Flexible policy configuration
- ✅ Audit trail of all decisions
- ✅ Reduced administrative work

---

## 💡 Slide 8: Quick Tips

### Best Practices

**For Employees:**
1. ✓ Check your balance before requesting
2. ✓ Submit requests in advance (don't wait until last minute)
3. ✓ Add a clear reason to help managers decide
4. ✓ Plan around team schedules when possible

**For Managers:**
1. ✓ Review requests promptly (don't leave pending)
2. ✓ Always add meaningful comments
3. ✓ Consider team coverage before approving
4. ✓ Be consistent and fair in decisions

**For Admins:**
1. ✓ Initialize balances at start of year
2. ✓ Keep leave types updated with current policies
3. ✓ Review and adjust allowances annually
4. ✓ Use color coding for easy identification

---

## 📱 Slide 9: Navigation Guide

### How to Find Everything

```
MAIN MENU (Left Sidebar)
├── 📊 Dashboard
├── 👥 Employee Management
├── 🏢 Departments
├── 📅 Request Leave ◄─────── Submit new request
├── ✅ Leave Approvals ◄────── Manager/HR approvals
├── 💰 Payroll
├── 📈 Performance
└── 📄 Document Management

SETTINGS
└── ⚙️ Leave Types ◄────────── Admin configuration

EMPLOYEE SELF-SERVICE
├── 👤 My Profile
└── 📝 My Leave Requests ◄──── View your request history
```

---

## 🆘 Slide 10: Common Questions

### FAQ

**Q: How long does approval take?**
A: Depends on your manager/HR. Requests appear in their queue immediately. Check "My Leave Requests" for status updates.

**Q: Can I cancel a pending request?**
A: Currently, contact your manager/HR to cancel. They can reject it with a note.

**Q: What if I don't have enough balance?**
A: System won't let you submit. Talk to HR about:
- Using different leave type
- Unpaid leave options
- Advance leave arrangements

**Q: Why can't I see the Approvals page?**
A: Only managers and HR roles have access. Contact admin if you should have this access.

**Q: What are "business days"?**
A: Monday to Friday (excludes weekends). Public holidays are currently counted - this may be updated in future.

**Q: Can I edit a submitted request?**
A: No - submit a new request and ask manager to reject the old one.

---

## 🚀 Slide 11: Get Started

### Ready to Use the System?

**Employees - Request Your First Leave:**
1. Click "Request Leave" in the main menu
2. Follow the form step-by-step
3. Submit and wait for approval notification

**Managers - Start Approving:**
1. Click "Leave Approvals" in the main menu
2. Review each pending request
3. Approve or reject with comments

**Admins - Set Up Policies:**
1. Go to Settings → "Leave Types"
2. Review default leave types
3. Customize to match your company policies

---

## 📞 Slide 12: Need Help?

### Support Resources

**Documentation:**
- 📖 Full Technical Guide: `LEAVE_MANAGEMENT.md`
- 📋 This Workflow Guide: `LEAVE_WORKFLOW_GUIDE.md`
- 🏗️ System Architecture: `replit.md`

**Getting Help:**
1. Check this guide for workflow questions
2. Review technical documentation for details
3. Contact your HR department
4. Contact system administrator

**Remember:**
- 💚 System is designed to be intuitive
- 💚 Most tasks are just a few clicks
- 💚 Balances update automatically
- 💚 No complex processes or paperwork

---

## 🎉 Thank You!

### Start managing leave the modern way

**The Leave Management System makes it easy for everyone:**
- Employees get transparency and control
- Managers get efficiency and oversight  
- HR gets automation and accuracy

**Ready to begin? Navigate to "Request Leave" and try it out!**

---

*For detailed technical information, see LEAVE_MANAGEMENT.md*

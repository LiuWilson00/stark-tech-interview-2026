# Auth Module Test Cases

## Registration Tests

### TC-AUTH-001: Successful User Registration

**Priority:** High
**Preconditions:**
- User is on the registration page
- Email is not already registered

**Test Steps:**
1. Navigate to `/register`
2. Enter valid name: "Test User"
3. Enter valid email: "newuser@example.com"
4. Enter valid password: "password123"
5. Confirm password: "password123"
6. Click "Register" button

**Expected Results:**
- Registration API is called with correct payload
- User receives success message
- User is redirected to dashboard/login
- Access token is stored (if auto-login)

---

### TC-AUTH-002: Registration with Existing Email

**Priority:** High
**Preconditions:**
- User is on the registration page
- Email "existing@example.com" already exists in system

**Test Steps:**
1. Navigate to `/register`
2. Enter name: "Test User"
3. Enter email: "existing@example.com"
4. Enter password: "password123"
5. Confirm password: "password123"
6. Click "Register" button

**Expected Results:**
- Error message: "Email already exists" or similar
- Form remains on registration page
- User can modify input and retry

---

### TC-AUTH-003: Registration with Invalid Email Format

**Priority:** Medium
**Preconditions:** User is on the registration page

**Test Steps:**
1. Navigate to `/register`
2. Enter name: "Test User"
3. Enter invalid email: "not-an-email"
4. Enter password: "password123"
5. Attempt to submit

**Expected Results:**
- Client-side validation error for email field
- Form is not submitted
- Error message indicates email format issue

---

### TC-AUTH-004: Registration with Weak Password

**Priority:** Medium
**Preconditions:** User is on the registration page

**Test Steps:**
1. Navigate to `/register`
2. Enter name: "Test User"
3. Enter valid email: "test@example.com"
4. Enter weak password: "123" (too short)
5. Attempt to submit

**Expected Results:**
- Validation error for password field
- Error indicates minimum password requirements
- Form is not submitted

---

### TC-AUTH-005: Registration with Mismatched Passwords

**Priority:** Medium
**Preconditions:** User is on the registration page

**Test Steps:**
1. Navigate to `/register`
2. Enter name: "Test User"
3. Enter email: "test@example.com"
4. Enter password: "password123"
5. Enter confirm password: "password456"
6. Attempt to submit

**Expected Results:**
- Validation error: "Passwords do not match"
- Form is not submitted

---

### TC-AUTH-006: Registration with Empty Fields

**Priority:** Medium
**Preconditions:** User is on the registration page

**Test Steps:**
1. Navigate to `/register`
2. Leave all fields empty
3. Click "Register" button

**Expected Results:**
- Validation errors shown for all required fields
- Form is not submitted

---

## Login Tests

### TC-AUTH-010: Successful Login

**Priority:** High
**Preconditions:**
- User account exists with email "user@example.com" and password "password123"
- User is on login page

**Test Steps:**
1. Navigate to `/login`
2. Enter email: "user@example.com"
3. Enter password: "password123"
4. Click "Login" button

**Expected Results:**
- Login API is called with correct credentials
- Access token is received and stored
- User state is updated with user info
- User is redirected to dashboard

---

### TC-AUTH-011: Login with Invalid Password

**Priority:** High
**Preconditions:**
- User account exists with email "user@example.com"
- User is on login page

**Test Steps:**
1. Navigate to `/login`
2. Enter email: "user@example.com"
3. Enter wrong password: "wrongpassword"
4. Click "Login" button

**Expected Results:**
- Error message: "Invalid credentials" or similar
- User remains on login page
- No token is stored
- Password field is cleared

---

### TC-AUTH-012: Login with Non-existent User

**Priority:** High
**Preconditions:** User is on login page

**Test Steps:**
1. Navigate to `/login`
2. Enter non-existent email: "nobody@example.com"
3. Enter any password: "password123"
4. Click "Login" button

**Expected Results:**
- Error message: "Invalid credentials" or "User not found"
- User remains on login page
- No token is stored

---

### TC-AUTH-013: Login with Empty Credentials

**Priority:** Medium
**Preconditions:** User is on login page

**Test Steps:**
1. Navigate to `/login`
2. Leave email and password empty
3. Click "Login" button

**Expected Results:**
- Validation errors shown for required fields
- Form is not submitted to API

---

### TC-AUTH-014: Login Form Validation - Invalid Email

**Priority:** Medium
**Preconditions:** User is on login page

**Test Steps:**
1. Navigate to `/login`
2. Enter invalid email format: "not-email"
3. Enter password: "password123"
4. Click "Login" button

**Expected Results:**
- Email validation error displayed
- Form may or may not submit (depends on validation strategy)

---

## Token Management Tests

### TC-AUTH-020: Token Persistence on Page Refresh

**Priority:** High
**Preconditions:** User is logged in

**Test Steps:**
1. Login successfully
2. Note the current page (dashboard)
3. Refresh the browser (F5)

**Expected Results:**
- User remains logged in
- Token is retrieved from storage
- User is not redirected to login

---

### TC-AUTH-021: Token Expiry Handling

**Priority:** High
**Preconditions:** User is logged in with an expired token

**Test Steps:**
1. Login successfully
2. Wait for token to expire (or manually expire it)
3. Attempt to access a protected API

**Expected Results:**
- 401 error is caught
- User is redirected to login page
- Token is cleared from storage
- Appropriate message shown to user

---

### TC-AUTH-022: Invalid Token Handling

**Priority:** High
**Preconditions:** Token in storage is corrupted/invalid

**Test Steps:**
1. Manually set an invalid token in storage
2. Navigate to a protected page
3. Observe application behavior

**Expected Results:**
- Application detects invalid token
- User is redirected to login
- Invalid token is cleared

---

## Logout Tests

### TC-AUTH-030: Successful Logout

**Priority:** High
**Preconditions:** User is logged in

**Test Steps:**
1. Click on user menu/profile
2. Click "Logout" button/link
3. Confirm logout (if confirmation dialog exists)

**Expected Results:**
- Token is removed from storage
- User state is cleared
- User is redirected to login page
- Accessing protected routes redirects to login

---

### TC-AUTH-031: Logout Clears All User Data

**Priority:** Medium
**Preconditions:** User is logged in with cached data

**Test Steps:**
1. Login and navigate around (load teams, tasks, etc.)
2. Logout
3. Check browser storage/memory

**Expected Results:**
- Access token is cleared
- Cached user data is cleared
- Team/Task data is cleared
- Application returns to initial state

---

## Protected Route Tests

### TC-AUTH-040: Access Protected Route Without Login

**Priority:** High
**Preconditions:** User is not logged in (no token)

**Test Steps:**
1. Clear all tokens/session
2. Navigate directly to `/dashboard`

**Expected Results:**
- User is redirected to `/login`
- Original URL may be saved for post-login redirect

---

### TC-AUTH-041: Access Protected Route With Valid Token

**Priority:** High
**Preconditions:** User is logged in with valid token

**Test Steps:**
1. Login successfully
2. Navigate to `/dashboard`

**Expected Results:**
- Dashboard loads successfully
- User data is displayed correctly

---

### TC-AUTH-042: Deep Link After Login

**Priority:** Medium
**Preconditions:** User is not logged in

**Test Steps:**
1. Navigate directly to `/tasks/some-task-id`
2. Observe redirect to login
3. Login successfully

**Expected Results:**
- After login, user is redirected to original URL `/tasks/some-task-id`
- Or user is redirected to default dashboard

---

## Remember Me Tests (if applicable)

### TC-AUTH-050: Remember Me Functionality

**Priority:** Low
**Preconditions:** Login form has "Remember Me" option

**Test Steps:**
1. Navigate to login page
2. Enter valid credentials
3. Check "Remember Me" option
4. Login
5. Close browser completely
6. Reopen browser and navigate to app

**Expected Results:**
- User is still logged in
- Session persists across browser sessions

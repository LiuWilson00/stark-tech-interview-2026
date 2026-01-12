# User Module Test Cases

## Profile View Tests

### TC-USER-001: View Current User Profile

**Priority:** High
**Preconditions:** User is logged in

**Test Steps:**
1. Navigate to profile page or click user menu
2. View profile information

**Expected Results:**
- User's name is displayed
- User's email is displayed
- Avatar is displayed (or placeholder)
- Account creation date shown
- All information matches logged-in user

---

### TC-USER-002: Profile Data Loads on Page Refresh

**Priority:** Medium
**Preconditions:** User is logged in and on profile page

**Test Steps:**
1. Navigate to profile page
2. Refresh the page (F5)

**Expected Results:**
- Profile data reloads correctly
- No errors or blank fields
- Loading state shown during fetch

---

## Profile Update Tests

### TC-USER-010: Update User Name Successfully

**Priority:** High
**Preconditions:** User is logged in and on profile page

**Test Steps:**
1. Navigate to profile edit page/modal
2. Change name from "Old Name" to "New Name"
3. Click "Save" or "Update" button

**Expected Results:**
- API request sent with new name
- Success message displayed
- Name is updated in profile view
- Name updates in header/nav if displayed there

---

### TC-USER-011: Update User Name with Empty Value

**Priority:** Medium
**Preconditions:** User is logged in and on profile edit

**Test Steps:**
1. Navigate to profile edit
2. Clear the name field completely
3. Click "Save" button

**Expected Results:**
- Validation error: "Name is required"
- Form is not submitted
- Original name is preserved

---

### TC-USER-012: Update User Name with Very Long Value

**Priority:** Low
**Preconditions:** User is logged in and on profile edit

**Test Steps:**
1. Navigate to profile edit
2. Enter a very long name (> 255 characters)
3. Click "Save" button

**Expected Results:**
- Either client-side validation prevents submission
- Or server returns validation error
- Appropriate error message shown

---

### TC-USER-013: Update User Avatar

**Priority:** Medium
**Preconditions:**
- User is logged in
- Avatar upload feature exists

**Test Steps:**
1. Navigate to profile edit
2. Click on avatar/upload button
3. Select a valid image file (JPG, PNG)
4. Confirm upload

**Expected Results:**
- Image is uploaded successfully
- New avatar is displayed
- Old avatar is replaced

---

### TC-USER-014: Update Avatar with Invalid File Type

**Priority:** Low
**Preconditions:** Avatar upload feature exists

**Test Steps:**
1. Navigate to profile edit
2. Attempt to upload a non-image file (e.g., .txt, .pdf)

**Expected Results:**
- Error message: "Invalid file type"
- File is not uploaded
- Original avatar preserved

---

### TC-USER-015: Update Avatar with Large File

**Priority:** Low
**Preconditions:** Avatar upload feature exists with size limit

**Test Steps:**
1. Navigate to profile edit
2. Attempt to upload an image larger than limit (e.g., > 5MB)

**Expected Results:**
- Error message about file size
- File is not uploaded

---

## Profile Cancel/Reset Tests

### TC-USER-020: Cancel Profile Edit

**Priority:** Medium
**Preconditions:** User is on profile edit with unsaved changes

**Test Steps:**
1. Navigate to profile edit
2. Change name to "New Name"
3. Click "Cancel" button

**Expected Results:**
- Changes are discarded
- User returns to profile view
- Original name is still displayed

---

### TC-USER-021: Cancel Edit with Confirmation

**Priority:** Low
**Preconditions:** User has unsaved changes

**Test Steps:**
1. Make changes to profile
2. Attempt to navigate away
3. Confirmation dialog appears

**Expected Results:**
- User is warned about unsaved changes
- User can choose to stay or leave
- If stay, changes are preserved
- If leave, changes are discarded

---

## Profile Error Handling

### TC-USER-030: Profile Update Server Error

**Priority:** Medium
**Preconditions:** Server returns 500 error on profile update

**Test Steps:**
1. Navigate to profile edit
2. Make valid changes
3. Submit (server returns error)

**Expected Results:**
- Error message displayed to user
- Form remains with user's input
- User can retry

---

### TC-USER-031: Profile Update Network Error

**Priority:** Medium
**Preconditions:** Network is disconnected

**Test Steps:**
1. Navigate to profile edit
2. Disconnect network
3. Attempt to save changes

**Expected Results:**
- Network error message displayed
- Changes preserved in form
- User can retry when connected

---

## Profile Display Tests

### TC-USER-040: Profile Displays Correctly on Different Screen Sizes

**Priority:** Low
**Preconditions:** User is logged in

**Test Steps:**
1. View profile on desktop (> 1024px)
2. View profile on tablet (768px - 1024px)
3. View profile on mobile (< 768px)

**Expected Results:**
- Profile is readable on all sizes
- Layout adjusts appropriately
- No content is cut off or overlapping

---

### TC-USER-041: Profile Loading State

**Priority:** Low
**Preconditions:** User navigates to profile

**Test Steps:**
1. Navigate to profile page
2. Observe while data is loading

**Expected Results:**
- Loading indicator or skeleton shown
- No flash of empty content
- Smooth transition when data loads

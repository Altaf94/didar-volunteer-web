# Volunteer Management System - Checker Module

## Overview
The Checker Module is a dedicated validation interface within the Volunteer Management System developed for the 2026 Pakistan Deedar. This module facilitates the "Checker" role in reviewing volunteer data submissions, resolving discrepancies, approving valid records, and finalizing data for the Badge Printing and Dispatch phases.

This module enforces strict data governance and validation protocols to prevent duplicate assignments and unauthorized multi-event registrations.

## Architecture & Technology Stack
* **Framework:** React (Functional Components & Hooks)
* **Styling:** Custom CSS (`CheckerReviewPage.css`)
* **Iconography:** Lucide-React
* **Data Management:** JavaScript Mock Database (Designed for future integration with PostgreSQL/Node.js)

## File Structure
The module is organized into four core files:
1. `src/pages/checker/CheckerReviewPage.js`: Main user interface and component logic.
2. `src/pages/checker/CheckerReviewPage.css`: Component-specific styling and layout definitions.
3. `src/pages/checkerHelpers.js`: Utility functions for business logic and UI state management.
4. `src/types/mockDb.js`: Data structure definitions and sample database records for development.

## Core Functionalities & Validation Rules

### 1. Discrepant(1) Resolution: Same Event, Multiple Duties
* **Scenario:** A volunteer's CNIC is registered for multiple, conflicting duties within the same event.
* **Resolution Mechanism:** The system provides a "Keep This & Reject Conflict" function.
* **Logic Execution:** Triggers `handleResolveDiscrepant1()`. This action approves the selected duty and automatically updates the status of the conflicting duty ID to "Rejected".

### 2. Discrepant(2) Resolution: Multiple Events
* **Scenario:** A volunteer's CNIC is registered across multiple distinct events.
* **Resolution Mechanism:** Requires manual review by the Checker. The interface provides individual Approve and Reject controls for each associated record.
* **Logic Execution:** Triggers `handleResolveDiscrepant2()`. Updates the status of the specific record based on the Checker's explicit decision.

### 3. Clean Record Approval
* **Scenario:** Processing records that have successfully passed all initial Maker validations without flags.
* **Resolution Mechanism:** Bulk approval via the "Approve Clean Records" function.
* **Logic Execution:** Triggers `handleBulkApproveNormal()`. Iterates through the current state and updates all `AWAITING_CHECKER` records to `APPROVED`.

### 4. Step 5 Gatekeeper: Submit for Printing
* **Scenario:** Finalizing data and transitioning to the Badge Printing workflow.
* **Resolution Mechanism:** Strict validation check via the "Submit for Printing" function.
* **Logic Execution:** Triggers `canSubmitForPrinting()`. The system verifies that the count of `DISCREPANT` records is exactly `0`. If unresolved records exist, the submission is blocked and an error alert is generated.

# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose

This document describes the software requirements for "Click Click Photo Cafe", a Windows application designed to automate photobooth operations with a touchscreen, mobile-app style interface.

### 1.2 Scope

"Click Click Photo Cafe" enables users to take photos or create flipbooks using an intuitive touchscreen interface. The app automates the process from capturing images/videos to printing, aiming for a seamless user experience in a cafe environment.

### 1.3 Definitions, Acronyms, and Abbreviations

- **Photo Mode**: Mode for taking and printing a set of photos as a collage.
- **Flipbook Mode**: Mode for recording a short video, splitting it into frames, and printing as a flipbook.
- **Collage**: A template where users arrange their photos before printing.

### 1.4 References

- IEEE SRS Template

### 1.5 Overview

This SRS outlines the functional and non-functional requirements for the application.

---

## 2. Overall Description

### 2.1 Product Perspective

The application is a standalone Windows app optimized for touchscreen devices, intended for use in a cafe photobooth.

### 2.2 Product Functions

- Photo Mode: Take multiple photos, arrange them in a collage, and print.
- Flipbook Mode: Record a short video, split into frames, and print as a flipbook.

### 2.3 User Classes and Characteristics

- **End Users**: Cafe customers, no technical expertise required.
- **Operators**: Cafe staff, minimal training needed.

### 2.4 Operating Environment

- Windows OS
- Touchscreen hardware

### 2.5 Design and Implementation Constraints

- Must support touchscreen interaction.
- Must interface with a printer.

### 2.6 User Documentation

- Simple on-screen instructions.
- Quick-start guide for staff.

### 2.7 Assumptions and Dependencies

- Reliable printer connection.
- Sufficient lighting for photos/videos.

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### 3.1.1 Photo Mode

- User selects "Photo Mode".
- User clicks "Start".
- User selects the number of photos to take.
- For each photo:
  - 5-second countdown.
  - Photo is taken.
  - 3-second preview.
  - Prompt for next pose.
- After all photos:
  - User can apply one filter to all photos.
  - Display two cards:
    - Left: taken photos.
    - Right: collage template matching the number of photos.
  - User arranges photos in the collage.
  - User clicks "Done".
  - Final collage is sent to the printer and printed.

#### 3.1.2 Flipbook Mode

- User selects "Flipbook Mode".
- User chooses a filter to apply to the video.
- User clicks "Confirm" to start.
- 3-second countdown.
- Record a 5-second video at 24 frames per second (or as specified), with the selected filter applied.
- Preview the video.
- User can retake once.
- After confirmation:
  - Video is split into frames.
  - Each frame is sent to the printer and printed as a flipbook.

### 3.2 Non-Functional Requirements

- **Usability**: The interface must be user-friendly and intuitive for all ages.
- **Performance**: The app should respond quickly, with minimal waiting times.
- **Reliability**: The app should be stable and free from critical bugs or errors.
- **Maintainability**: The codebase should be organized for easy updates and bug fixes.
- **Security**: User data (photos/videos) should not be stored after printing.

---

## 4. Appendices

- None at this time.

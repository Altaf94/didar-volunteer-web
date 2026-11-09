# Didar Volunteer Web Portal

The web version of the Didar volunteer management system, built in React, for makers, checkers and national admins.

## Context

A companion to the [mobile app](https://github.com/Altaf94/didar-volunteer-app), using the same backend API.

## Features

- Maker home, upload and review pages
- Checker home, import review and print pages
- National admin creation and admin page
- Dashboard with stats cards
- Excel parsing for volunteer uploads (xlsx)
- PDF generation for badges and print lists (jsPDF)
- Role permissions hook, auth and volunteer contexts, loading manager

## Tech stack

- **Frontend:** React (Create React App), React Router
- **Files:** xlsx, jsPDF
- **Server:** Express static server with a proxy for production

## Getting started

```bash
npm install
cp .env.example .env   # set REACT_APP_API_URL
npm start
```

## Screenshots

<!-- Add 2-3 screenshots here: docs/screenshots/*.png -->

## Author

Built by **Altaf Hassan**, Software Engineer (React Native & full-stack). [Portfolio](https://altaf94-portfolio.netlify.app) · [LinkedIn](https://linkedin.com/in/altaf-hassan)

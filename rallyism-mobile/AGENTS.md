# Rallyism Mobile App

A mobile app for viewing personal rally memories: users can login, browse rally events, open albums, view photos and videos, and use simple media filters.

The mobile app implements only the most important end-user gallery functionality. Advanced content management, bulk uploads, admin functionality and storage management remain in the Web app.

# Tech Guidelines

* Technologies: React Native + Expo + Expo Router
* Back-end: Rallyism RESTful API, with "Bearer token" auth
* Back-end API source code: `..\rallyism-web\src\app\api`
* Use the same shared business rules as the Web app through the RESTful API.
* Store the authentication token securely on the mobile side.
* Use modular design:

  * split screens, forms, cards, media grids, API clients and utilities into separate files
  * avoid too much code in a single file
  * reuse repeating UI components such as rally event cards, album cards, media cards, buttons, empty states and loading indicators

# Core Mobile Functionality

* Authentication:

  * login
  * register, if included in the mobile scope
  * logout
* Rally Events:

  * view rally events
  * view rally event details
  * see rally title, championship, year, country, dates and description
* Albums:

  * view albums inside a rally event
  * open album details
  * browse album media
* Media:

  * view photos
  * view YouTube video links
  * filter media by All / Photos / Videos
  * open photo viewer
  * open video links through YouTube or browser
* Profile:

  * view basic account information
  * logout

# Mobile User Interface Guidelines

* Implement user-friendly mobile gallery UI.
* Use Expo Router with stack navigation.
* Use responsive layouts for both smartphones and tablets.
* Design the app mobile-first:

  * clear navigation
  * large touch targets
  * simple screens
  * readable rally event and album cards
  * comfortable photo browsing
  * clear All / Photos / Videos filtering
* Use loading, error and empty states for all API-based screens.
* Use visual handling suitable for different photo formats:

  * thumbnail grid may use cropped previews
  * full photo viewer must show the whole photo
  * support common formats such as 16:9 and 4:3
* Mobile UI Alerts:

  * ensure all native alerts, confirms and other system dialogs have a fallback for Web
  * implement Web fallbacks as modal popups
* Keep the mobile app focused and lightweight. Do not implement complex upload workflows, admin panels or advanced content management in the mobile version.

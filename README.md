<p align="center">
  <img src="https://i.pinimg.com/originals/f6/5d/46/f65d4681649d85bc91c86872a1775919.gif" alt="FYRO Banner" width="100%" />
</p>

<p align="center">
  <img src="https://i.pinimg.com/originals/f6/5d/46/f65d4681649d85bc91c86872a1775919.gif" height="220" width="310" alt="FYRO Demo"/>
</p>

<h1 align="center">FYRO</h1>
<p align="center"><strong>Find Your Right One</strong></p>

<p align="center">
  Full-stack logistics marketplace for real-time transport and labor coordination
</p>

---

<p align="center">
  <a href="https://github.com/karthikeyavelivela/Fyro">
    <img src="https://img.shields.io/badge/Source-GitHub-181717?style=for-the-badge&logo=github" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Frontend-Next.js-000000?style=for-the-badge&logo=next.js" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Backend-Express-000000?style=for-the-badge&logo=express" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Realtime-Socket.IO-010101?style=for-the-badge&logo=socket.io" />
  </a>
</p>

---

## Overview

FYRO is a production-oriented logistics platform that enables seamless interaction between customers, drivers, and hamali workers. It is designed to simulate real-world logistics workflows with real-time coordination, structured APIs, and scalable architecture.

---

## Architecture

**Frontend**
- Next.js (App Router)
- Dynamic rendering with SSR control
- Middleware-based authentication

**Backend**
- Express.js REST API
- MongoDB with retry logic
- JWT-based authentication (HTTP-only cookies)

**Real-Time Layer**
- Socket.IO for live updates
- Booking lifecycle events
- Chat and location tracking

---

## Core Features

### Customer
- Book transport and labor services
- Track jobs in real time
- In-app communication
- Payment simulation
- Complaint management

### Driver
- Availability control
- Job acceptance system
- Active trip tracking
- Earnings overview

### Hamali
- Job handling workflow
- Availability management
- Earnings tracking

### Admin
- User and booking management
- Complaint resolution system
- KYC and analytics dashboard

---

## Project Structure

```text
Fyro/
  client/
  server/
  package.json
  README.md
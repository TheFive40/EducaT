# 🎓 EducaT - Academic Management System (SaaS)

**EducaT** is a scalable and customizable academic management platform designed to automate and optimize institutional processes such as enrollment, grading, attendance, communication, and student wellbeing.

---

## 📌 Project Overview

EducaT provides a centralized digital environment where students, teachers, administrators, and coordinators can interact efficiently.

The platform follows a **modular monolithic architecture**, ensuring scalability while maintaining development simplicity.

It is designed as a **SaaS (Software as a Service)** solution, allowing multiple institutions to customize the system according to their identity and needs.

---

## 🎯 Objectives

* Automate academic processes
* Improve institutional communication
* Provide real-time academic tracking
* Support student wellbeing
* Enable institutional customization

---

## 👥 Actors

* Student
* Teacher
* Administrator
* Coordinator

---

## ⚙️ Functional Requirements

### 🔐 Authentication Module

* Users must be able to register
* Users must be able to log in using credentials
* Users must be able to recover passwords
* Users must be able to log out

---

### 🎓 Enrollment Module

* Students must be able to enroll in courses
* The system must allow schedule selection (configurable)
* Administrators must manage enrollments

---

### 📚 Extended Classroom

#### Personal Area

* View certificates
* View enrollment information
* View schedule
* View grades
* Perform teacher evaluations
* Access guides/instructions
* Update personal data
* View learning outcomes
* Perform self-evaluations
* Access **Student Wellbeing module**

#### 🧠 Student Wellbeing

* Participate in wellbeing forums
* Access emotional support content
* Communicate with institutional support staff (e.g., psychologist)
* Request assistance or guidance

---

#### My Courses

* View enrolled courses
* View scheduled classes
* Track attendance

---

### 🧑‍🏫 Academic Module (Teachers)

* Manage grades
* Create activities
* Create exams
* Register attendance

---

### 💬 Communication Module

* View forums
* View news
* View articles
* View events

---

### 🏫 Institutional Portal

* View mission
* View vision
* View institutional values
* View location
* View contact information

---

### 🎨 Customization Module

* Apply preconfigured themes
* Customize colors, banners, and logos
* Modify texts and titles
* Maintain neutral base design for adaptability
* Allow institutions to define their identity

---

### 🛠️ Administrative Module

* Manage users
* Manage courses
* Manage schedules
* Configure system settings

---

## 🏗️ Architecture

* Backend: Spring Boot (Modular Monolith)
* Frontend: React (planned)
* API: REST + WebSocket
* Authentication: JWT
* Database: PostgreSQL
* Optional: MongoDB (real-time features)
* Cloud: AWS (EC2, RDS, S3)

---

## 🗄️ Database Design

### 📊 Entity Relationship Diagram

![Database Diagram](https://i.imgur.com/3sJIiA2.png)

> 📌 Store images inside a `/docs` folder.

---

## 📁 Project Structure

```
backend/
 ├── auth/
 ├── users/
 ├── academic/
 ├── enrollment/
 ├── wellbeing/
 ├── communication/
 ├── institutional/
 ├── config/
 └── shared/

frontend/ (React - planned)
```

---

## 🚀 Features

* Role-based access control
* Academic tracking (grades, attendance, exams)
* Extended classroom system
* Real-time communication
* Student wellbeing support
* Institutional customization (SaaS-ready)

---

## ☁️ Deployment (Planned)

* AWS EC2 → Backend
* AWS RDS → Database
* AWS S3 → File storage
* CloudFront → CDN

---

## 📌 Status

🚧 EducaT is currently in development
Core architecture and database design completed.

---

## 📷 Screenshots

```
![Home](./docs/home.png)
![Dashboard](./docs/dashboard.png)
```

---

## 🧠 Future Improvements

* Multi-tenant architecture (multi-institution support)
* Microservices migration (long-term)
* Advanced analytics and reporting
* Mobile application
* AI-based recommendations

---

## 🤝 Contributing

Contributions are welcome. Please open an issue or submit a pull request.

---

## 📄 License

License will be defined in future versions.

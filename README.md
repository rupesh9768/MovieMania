MovieMania
Online Movie Ticket Booking System
Final Year Project ·  BSc Computing


Project Description
MovieMania is a full-stack web-based application designed to simplify the movie ticket booking process for users. The system allows users to browse movies, select showtimes, book seats through an interactive layout, and complete payments securely.
In addition to booking features, the platform includes community-based functionalities such as ratings, discussions, and real-time chat. The system also provides comprehensive administrative tools for managing theatres, movies, bookings, and user activities.


Project Objective
The main objective of this project is to develop a user-friendly and efficient movie booking system that enhances the overall user experience. The system aims to provide real-time booking capabilities, secure payment processing, and interactive features while ensuring ease of use for both general users and administrators.


Features
The system provides the following features:
•	User registration and secure login (JWT authentication)
•	Movie browsing and search functionality
•	Dynamic movie data using the TMDB API
•	Interactive seat selection system
•	Real-time seat availability and booking
•	Secure payment integration using Khalti
•	Digital ticket generation and booking history
•	Movie rating and review system
•	Discussion and comment section
•	Real-time chat between users and admin
•	Notification system for updates
•	Admin dashboard for managing movies, theatres, and bookings
•	Analytics and reporting system


Technologies Used
Frontend
•	HTML
•	CSS
•	JavaScript
•	React JS
•	Tailwind CSS
Backend
•	Node.js
•	Express.js
Database
•	MongoDB
External Services
•	TMDB API — movie data and metadata
•	Khalti Payment Gateway — secure payment processing
•	Socket.IO — real-time chat and notifications

System Requirements
Hardware
•	Computer, laptop, or smartphone
•	Stable internet connection
Software
•	Web browser (Google Chrome, Firefox, or Edge)
•	Node.js installed
•	Code editor (VS Code recommended)


Installation and Setup
Follow the steps below to run the project locally on your machine.
1. Clone the Repository
git clone https://github.com/rupesh9768/moviemania.git
2. Navigate to the Project Folder
cd moviemania
3.  Install Dependencies
For the Backend:
cd backend
npm install
For the Frontend:
cd frontend
npm install
4. Run the Application
Start the Backend server:
npm start
Start the Frontend development server:
npm run dev











Project Structure
moviemania/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   └── App.jsx
│   └── index.html
│
├── uploads/
├── documentation/
└── README.md


Screenshots
The following pages and interfaces are included in the system:
•	Login Page

 
•	Registration Page
 

•	Movie Browsing Page
 






•	Seat Selection Interface
 
•	Payment Page
 

•	Admin Dashboard
 


Future Improvements
The system can be enhanced with the following features in future development cycles:
•	Mobile application for Android and iOS
•	Integration of additional payment gateways (eSewa, Stripe)
•	AI-based movie recommendation system
•	Multi-language support
•	Advanced analytics and reporting
•	Performance optimisation for large-scale usage


Authors
Student Name: Rupesh Pudasaini
Programme: BSc Computing
University: Islington College


License
This project has been developed for educational purposes as part of a Final Year Project. All rights are reserved by the author. The system and its contents may not be reproduced or distributed without prior permission.

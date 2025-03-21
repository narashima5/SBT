# Bus Tracking System

A real-time bus tracking system that calculates ETAs for student pickup points and sends WhatsApp notifications. The application tracks a bus driver's location, computes distances to pre-configured student boarding points, and provides estimated arrival times.

## Features

- 🚌 Real-time bus location tracking
- 📍 Student boarding point management
- ⏱️ Dynamic ETA calculations
- 📱 WhatsApp notifications for arrival updates
- 🗺️ Interactive map interface
- 📊 Real-time distance calculations
- 🔄 Automatic updates

## Technologies Used

- Frontend:
  - HTML5
  - Tailwind CSS
  - JavaScript
  - Google Maps API
- Backend:
  - Node.js
  - Express.js
  - Twilio API (for WhatsApp integration)

## Prerequisites

Before running the application, make sure you have:

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Twilio Account (for WhatsApp notifications)
- Google Maps API Key

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd bus-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the following variables in `.env`:
     - `GOOGLE_MAPS_API_KEY`: Your Google Maps API key
     - `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
     - `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token
     - `TWILIO_FROM_NUMBER`: Your Twilio WhatsApp number
     - `WHATSAPP_RECIPIENTS`: Comma-separated list of recipient WhatsApp numbers

4. Update the Google Maps API key in `index.html`:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY"></script>
   ```

## Running the Application

1. Start the server:
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

2. Access the application:
   - Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Update Bus Location
```http
POST /api/updateLocation
```
Request body:
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "timestamp": "2023-05-20T10:30:00Z"
}
```

### Get Current Status
```http
GET /api/status
```
Returns current bus location and ETAs for all students.

### Health Check
```http
GET /health
```
Returns server health status.

## Project Structure

```
bus-tracker/
├── index.html          # Main frontend interface
├── app.js             # Frontend JavaScript
├── server.js          # Backend Node.js server
├── package.json       # Project dependencies
├── .env              # Environment variables
└── README.md         # Project documentation
```

## Configuration

### Student Data
Student boarding points are configured in `server.js`. Each student entry includes:
- ID
- Name
- Location (latitude/longitude)
- Boarding time

Example:
```javascript
{
  id: 1,
  name: "John Doe",
  location: { lat: 12.9716, lng: 77.5946 },
  boardingTime: "08:00"
}
```

### WhatsApp Notifications
- Notifications are sent when the bus is within 5 minutes of a student's boarding point
- Multiple recipients can be configured in the `.env` file
- Messages include ETA information

## Error Handling

The application includes comprehensive error handling for:
- Invalid location data
- Failed WhatsApp notifications
- API errors
- Server issues

## Security Considerations

- Environment variables for sensitive data
- Input validation for all API endpoints
- Secure HTTPS communication (in production)
- Rate limiting for API endpoints (recommended in production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the repository or contact the development team.

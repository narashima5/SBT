const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const twilioNotify = require("twilio").notify;
const path = require("path");
const app = express();

const drivers = {
  driver1: {
    password: "password1",
    route: "Route A",
    longitude: 13.0122,
    latitude: 80.2357,
  },
  driver2: {
    password: "password2",
    route: "Route B",
    longitude: 13.0143,
    latitude: 80.2394,
  },
};

// Load configuration
const config = {
  students: [
    {
      id: 1,
      name: "Narashima",
      location: { lat: 13.0122, lng: 80.2357 },
      boardingTime: "08:00",
      route: "Route A",
    },
    {
      id: 2,
      name: "Rejeeth",
      location: { lat: 13.0128, lng: 80.2367 },
      boardingTime: "08:15",
      route: "Route A",
    },
    {
      id: 3,
      name: "Michal",
      location: { lat: 13.0132, lng: 80.2386 },
      boardingTime: "08:30",
      route: "Route A",
    },
    {
      id: 4,
      name: "Sridhar",
      location: { lat: 13.0134, lng: 80.2396 },
      boardingTime: "08:45",
      route: "Route B",
    },
    {
      id: 5,
      name: "Pushpa",
      location: { lat: 13.0137, lng: 80.2336 },
      boardingTime: "09:00",
      route: "Route B",
    },
  ],
  whatsapp: {
    accountSid: 'AC08fb8b7fd31b386c1d0d9d01da2dfc19',
    authToken: 'c3b8a0810409c1fb48c2fe4c8577e15f',
    fromNumber: '+1 9034379358',
    recipients: '+91 9345769419',
  },
};


// const client = require('twilio')(config.whatsapp.accountSid, config.whatsapp.authToken);

// Initialize Twilio client (if credentials are available)
let twilioClient = null;
if (config.whatsapp.accountSid && config.whatsapp.authToken) {
  twilioClient = twilio(config.whatsapp.accountSid, config.whatsapp.authToken);
    console.log("Voice call and Twilio Notify notifications enabled with updated credentials");

} else {
  console.log("WhatsApp notifications disabled - missing credentials");
}

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Store last known bus location
let currentBusLocation = null;

// Haversine formula to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Calculate ETA based on distance
function calculateETA(distance) {
  const averageSpeed = 30; // km/h
  const timeInHours = distance / averageSpeed;
  return Math.round(timeInHours * 60);
}

//voice call notification

// async function sendVoiceCallNotification(to, message) {
//     if (!twilioClient) {
//         console.log("Voice call notification skipped (no credentials):", message);
//         return;
//     }

//     try {
//         await twilioClient.calls.create({
//             url: 'http://demo.twilio.com/docs/voice.xml', // URL for Twilio to fetch instructions for the call
//             to: to,
//             from: config.whatsapp.fromNumber,
//         });
//         console.log(`Voice call notification sent to ${to}`);
//     } catch (error) {
//         console.error(`Failed to send voice call notification to ${to}: ${error.message}`, error);
//     }
// }

async function sendWhatsAppNotification(message) {
  if (!twilioClient) {
    console.log("WhatsApp notification skipped (no credentials):", message);
    return;
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${config.whatsapp.fromNumber}`,
      to: `whatsapp:${config.whatsapp.recipients}`,
    });
    console.log(`WhatsApp notification sent to ${config.whatsapp.recipients}`);
  } catch (error) {
    console.error(
      `Failed to send WhatsApp notification to ${config.whatsapp.recipients}:`,
      error
    );
  }
}

// API Endpoints

// Update bus location
app.post("/api/updateLocation", (req, res) => {
  try {
    const { latitude, longitude, timestamp } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Invalid location data" });
    }

    currentBusLocation = {
      lat: latitude,
      lng: longitude,
      timestamp: timestamp || new Date().toISOString(),
    };

    // Calculate distances and ETAs for each student
    
    const updates = config.students.map((student) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        student.location.lat,
        student.location.lng
      );

      const eta = calculateETA(distance);
      

      // Send WhatsApp notification if bus is within 10 minutes
      if (eta <= 10) {
        const message = `Bus will arrive at ${student.name}'s stop in approximately ${eta} minutes.`;
        const recipients = config.whatsapp.recipients;
        sendWhatsAppNotification(message);
        // sendVoiceCallNotification(recipients, message);
      }

      return {
        studentId: student.id,
        distance,
        eta,
      };
    });

    res.json({
      success: true,
      location: currentBusLocation,
      updates,
    });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current bus location and ETAs
app.get("/api/status", (req, res) => {
  if (!currentBusLocation) {
    return res.status(404).json({ error: "No bus location available" });
  }

  const updates = config.students.map((student) => {
    const distance = calculateDistance(
      currentBusLocation.lat,
      currentBusLocation.lng,
      student.location.lat,
      student.location.lng
    );

    return {
      student,
      distance,
      eta: calculateETA(distance),
    };
  });

  res.json({
    busLocation: currentBusLocation,
    updates,
  });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const driver = drivers[username];

  if (driver && driver.password === password) {
    
    return res.json({
      success: true,
      driver: {
        name: username,
        route: driver.route,
        latitude: driver.latitude,
        longitude: driver.longitude,
      },
    });
  } else {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

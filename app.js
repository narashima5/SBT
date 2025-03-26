// Initialize map and markers
let map;
let busMarker;
let studentMarkers = [];
let currentPosition = null;

// Sample student data (will be replaced with backend data)
const students = [
    {
      id: 1,
      name: "Narashima",
      location: { lat:  13.2950, lng:79.8971 },
      boardingTime: "08:00",
      route: "Route A",
    },
    {
      id: 2,
      name: "Rejeeth",
      location: { lat: 13.2950, lng: 79.8934 },
      boardingTime: "08:15",
      route: "Route A",
    },
    {
      id: 3,
      name: "Michal",
      location: { lat: 13.2950, lng: 79.8923 },
      boardingTime: "08:30",
      route: "Route A",
    },
    {
      id: 4,
      name: "Sridhar",
      location: { lat: 13.2950, lng: 79.8964 },
      boardingTime: "08:45",
      route: "Route B",
    },
    {
      id: 5,
      name: "Pushpa",
      location: { lat: 13.2950, lng: 79.8954 },
      boardingTime: "09:00",
      route: "Route B",
    },
  ];

let driverData;
let filteredStudents;
// Check for driver data on index.html load
if (window.location.pathname.endsWith('index.html')) {
    driverData = JSON.parse(sessionStorage.getItem('driverData'));
    
    if (!driverData) {
        // Redirect to login if no driver data found
        window.location.href = 'login.html';
    } else {
        // Filter students based on driver's route
        filteredStudents = students.filter(student => student.route === driverData.route);
        // Display filtered students
        displayStudents(filteredStudents);
        document.getElementById("currentRoute").textContent = driverData.route;
        
    }
}

// Login form handler - only on login.html
if (window.location.pathname.endsWith('login.html')) {
    document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const data = await response.json();
            // Store driver data in sessionStorage
            sessionStorage.setItem('driverData', JSON.stringify(data.driver));
            // Redirect to index.html
            window.location.href = 'index.html';
        } else {
            alert('Login failed. Please check your credentials.');
        }
    });
}

// Function to display students
function displayStudents(students) {
    const studentList = document.getElementById('studentList');
    studentList.innerHTML = '';

    students.forEach(student => {
        const studentItem = document.createElement('div');
        studentItem.className = 'p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition';
        studentItem.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-medium text-gray-800">${student.name}</h4>
                    <p class="text-sm text-gray-500">Boarding Time: ${student.boardingTime}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm font-medium text-blue-600">${student.route}</p>
                </div>
            </div>
        `;
        studentList.appendChild(studentItem);
    });
}

// Initialize map when the page loads
function initMap() {
    const defaultLocation = { lat: driverData.latitude, lng: driverData.longitude };
    map = L.map('map').setView([defaultLocation.lat, defaultLocation.lng], 2.5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Create bus marker
    busMarker = L.marker([defaultLocation.lat, defaultLocation.lng], {
        icon: L.divIcon({
            className: 'bus-marker',
            iconSize: [32, 32],
            html: '<div class="marker-container"><div class="marker-icon"><i class="fas fa-bus"></i></div></div>'
        })
    }).bindPopup('Current Bus Location').addTo(map);

    

    // Create markers for each student's boarding location
    filteredStudents.forEach(student => {
        const marker = L.marker([student.location.lat, student.location.lng], {
            icon: L.divIcon({
                className: 'stop-marker',
                iconSize: [24, 24],
                html: '<div class="marker-container"><div class="marker-icon"><i class="fas fa-map-pin"></i></div></div>'
            })
        }).bindPopup(`
            <div class="font-medium">${student.name}'s Stop</div>
            <div class="text-sm text-gray-600">Boarding Time: ${student.boardingTime}</div>
        `).addTo(map);
        studentMarkers.push(marker);
    });
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI/180);
}

// Calculate ETA based on distance
function calculateETA(distance) {
    const averageSpeed = 30; // km/h
    const timeInHours = distance / averageSpeed;
    const timeInMinutes = Math.round(timeInHours * 60);
    return timeInMinutes;
}

// Update student list with distances and ETAs
function updateStudentList() {
    if (!currentPosition) return;

    const studentList = document.getElementById('studentList');
    studentList.innerHTML = '';

    filteredStudents.forEach(student => {
        const distance = calculateDistance(
            currentPosition.lat,
            currentPosition.lng,
            student.location.lat,
            student.location.lng
        );
        
        const eta = calculateETA(distance);
        
        const studentItem = document.createElement('div');
        studentItem.className = 'p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition';
        studentItem.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-medium text-gray-800">${student.name}</h4>
                    <p class="text-sm text-gray-500">Boarding Time: ${student.boardingTime}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm font-medium text-blue-600">${distance.toFixed(1)} km away</p>
                    <p class="text-xs text-gray-500">ETA: ${eta} mins</p>
                </div>
            </div>
        `;
        
        studentList.appendChild(studentItem);
    });
}

function simulateBusMovement() {
    // find location of bus


    
    navigator.geolocation.getCurrentPosition(async (position) => {
        const Lat = position.coords.latitude;
        const Lng = position.coords.longitude;
        driverData.latitude = Lat;
        driverData.longitude = Lng;
        
        currentPosition = { lat: Lat, lng: Lng };
        
        // Update bus marker position
        busMarker.setLatLng([currentPosition.lat, currentPosition.lng]);
        
        // Send updated location to the server
        const response = await fetch('/api/updateLocation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                latitude: currentPosition.lat,
                longitude: currentPosition.lng,
            }),
        });

        if (!response.ok) {
            console.error("Failed to update location on the server");
        }

        // Update last updated time
        document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
        document.getElementById('currentLocation').textContent = 
            `${currentPosition.lat.toFixed(4)}, ${currentPosition.lng.toFixed(4)}`;
        
        // Update student list with new distances and ETAs
        updateStudentList();
    }, (error) => {
        console.error("Error retrieving location: ", error);
    });
    
    
    
    
}

document.addEventListener('DOMContentLoaded', () => {
    if(window.location.pathname.endsWith('/')){
        window.location.href = 'login.html'
    }
    // Check for driver data on index.html load
    if (window.location.pathname.endsWith('index.html')) {
        const driverData = JSON.parse(sessionStorage.getItem('driverData'));
        if (!driverData) {
            // Redirect to login if no driver data found
            window.location.href = 'login.html';
        } else {
            initMap();
            
            // Start simulating bus movement
            setInterval(simulateBusMovement, 5000);
            
            // Add refresh button functionality
            document.querySelector('button').addEventListener('click', () => {
                simulateBusMovement();
            });
        }
    }
});

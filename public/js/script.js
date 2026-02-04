const socket = io();

let username = localStorage.getItem("usernameforsocket");

if (!username) {
    username = prompt("Enter your name:");
    localStorage.setItem("usernameforsocket", username);
}

socket.emit("join-user", username);


// -------------------- MAP SETUP --------------------

const map = L.map("map").setView([0, 0], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Live User Map"
}).addTo(map);

const markers = {};
let isFirstLocation = true; // prevents auto jump every time


// -------------------- GEOLOCATION --------------------

if (navigator.geolocation) {

    // First location fetch
    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;

        socket.emit("send-location", { latitude, longitude });

        // Only first time center map on YOU
        if (isFirstLocation) {
            map.setView([latitude, longitude], 15);
            isFirstLocation = false;
        }

    });

    // Continuous tracking
    navigator.geolocation.watchPosition(
        (position) => {

            const { latitude, longitude } = position.coords;

            socket.emit("send-location", { latitude, longitude });

        },
        (error) => {
            console.error("Geolocation error:", error);

            if (error.code === error.PERMISSION_DENIED) {
                alert("Location permission denied");
            }
            else if (error.code === error.TIMEOUT) {
                console.log("Location request timeout");
            }
        },
        {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 10000
        }
    );
}


// -------------------- LOAD ALL USERS --------------------

socket.on("all-users", (users) => {

    Object.keys(users).forEach((id) => {

        const user = users[id];

        if (user.latitude && user.longitude) {

            if (!markers[id]) {

                markers[id] = L.marker([user.latitude, user.longitude])
                    .addTo(map)
                    .bindTooltip(user.username || "Unknown User", {
                        permanent: true,
                        direction: "top",
                        offset: [0, -10]
                    });

            }

        }

    });

});


// -------------------- RECEIVE LIVE LOCATION --------------------

socket.on("received-location", (location) => {

    const { id, username, latitude, longitude } = location;

    if (markers[id]) {

        markers[id].setLatLng([latitude, longitude]);

    } else {

        markers[id] = L.marker([latitude, longitude])
            .addTo(map)
            .bindTooltip(username || "Unknown User", {
                permanent: true,
                direction: "top",
                offset: [0, -10]
            });

    }

});


// -------------------- USER DISCONNECT --------------------

socket.on("user-disconnected", (id) => {

    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }

});

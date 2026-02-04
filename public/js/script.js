let myLocation = null;
let routingControl = null;

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
let isFirstLocation = true;


// -------------------- SHOW ROUTE --------------------

function showRoute(destination){

    if(!myLocation) return;

    if(routingControl){
        map.removeControl(routingControl);
    }

    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(myLocation[0], myLocation[1]),
            L.latLng(destination[0], destination[1])
        ],
        routeWhileDragging: false
    }).addTo(map);
}


// -------------------- GEOLOCATION --------------------

if (navigator.geolocation) {

    navigator.geolocation.getCurrentPosition((position) => {

        const { latitude, longitude } = position.coords;

        myLocation = [latitude, longitude];   // ✅ FIXED

        socket.emit("send-location", { latitude, longitude });

        if (isFirstLocation) {
            map.setView([latitude, longitude], 15);
            isFirstLocation = false;
        }

    });

    navigator.geolocation.watchPosition(
        (position) => {

            const { latitude, longitude } = position.coords;

            myLocation = [latitude, longitude];   // ✅ FIXED

            socket.emit("send-location", { latitude, longitude });

        },
        (error) => {
            console.error("Geolocation error:", error);
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
                    })
                    .on("click", () => {
                        showRoute([user.latitude, user.longitude]);  // ✅ FIXED
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
            })
            .on("click", () => {
                showRoute([latitude, longitude]);
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

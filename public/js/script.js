const socket = io();

if(navigator.geolocation){
    navigator.geolocation.watchPosition((position)=>{
        const { latitude, longitude } = position.coords;
        socket.emit("send-location",{ latitude, longitude });
    }, (error) => {
        console.error(error);
    }, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
    })
}

let username = localStorage.getItem("usernameforsocket");

if(!username) {
    username = prompt('Enter your name:');
    localStorage.setItem("usernameforsocket", username);
}

socket.emit("join-user", username);

const map = L.map("map").setView([0,0],10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Bahadurgarh City"
}).addTo(map);

const markers = {};

socket.on("received-location",(location)=>{
    const { id, username, latitude, longitude } = location;
    map.setView([latitude, longitude],16);
    if(markers[id]){
        markers[id].setLatLng([latitude,longitude]);
    } else {
        // markers[id] = L.marker([latitude, longitude]).addTo(map);
        markers[id] = L.marker([latitude, longitude]).addTo(map).bindPopup(`User: ${username || "Unknown User"}`).bindTooltip(username || "Unknow User", {
            permanent: true,
            direction: "top",
            offset: [0, -10]
        })

    }
})

socket.on("user-disconnected",(id)=>{
    if(markers[id]){
        map.removeLayer(markers[id]);
    }
})
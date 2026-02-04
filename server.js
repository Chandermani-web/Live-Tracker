import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
const port = process.env.PORT || 8000;

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __dirname = path.resolve();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const users = {};

io.on("connection",(socket)=>{
    console.log("New client connected: ", socket.id);

    socket.on("join-user",(username)=>{
        users[socket.id] = {
            username, latitude: null, longitu: null
        }
        console.log(`${username} joined`);
        socket.emit("all-users",users);
    });

    socket.on("send-location",(location)=>{
        if(users[socket.id]){
            users[socket.id].latitude = location.latitude;
            users[socket.id].longitude = location.longitude;
        }

        io.emit("received-location", { 
            id: socket.id,
            username: users[socket.id]?.username,
            ...location 
        });
    });

    socket.on("disconnect", ()=>{
        console.log("Client disconnected: ", socket.id);

        delete users[socket.id];

        io.emit("user-disconnected", socket.id);
    });
});


app.get("/",(req,res)=>{
    res.render("index");
})

server.listen(port, ()=>{
    console.log(`Server is running on port: http://localhost:${port}`);
})
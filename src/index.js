const express = require("express")
const path = require("path")
const http = require("http")
const socketio = require("socket.io")
const Filter = require("bad-words")
const { generateMessage, generateLocation } = require("./utils/messages")
const { addUser, removeUser, getUser, getUserInRoom} = require("./utils/users")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, "../public")

app.use(express.static(publicDirectoryPath))
app.use(express.json())

io.on("connection", (socket) => {
	console.log("New WebSocket Connection")

    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({ id: socket.id, username, room})
        if (error) {
            return callback(error)
        }
        socket.join(user.room)
	    socket.emit("message", generateMessage(`Welcome ${user.username}!`))
	    socket.broadcast.to(room).emit("message", generateMessage(`${user.username} has joined!`))
        io.to(user.room).emit('activeUsers', {
            room: user.room,
            users: getUserInRoom(user.room)
        })
        callback()
    })

	socket.on("sendMessage", (message, callback) => {
        const user = getUser(socket.id)
		const filter = new Filter()
		if (filter.isProfane(message)) {
			return callback("Profanity is not allowed!")
		}
		io.to(user.room).emit("message", generateMessage(user.username, message))
		callback("Message delivered successfully!")
	})

	socket.on("sendLocation", ({ latitude, longitude }, callback) => {
        const user = getUser(socket.id)
		io.to(user.room).emit(
			"locationMessage",
			generateLocation(
                user.username,
				`https://google.com/maps?q=${latitude},${longitude}`
			)
		)
		callback("Location shared!")
	})

	socket.on("disconnect", () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit("message", generateMessage(`${user.username} has left!`))
            io.to(user.room).emit('activeUsers', {
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
	})
})

server.listen(port, () => {
	console.log("Server is running on port " + port)
})

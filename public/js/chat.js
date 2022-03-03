const socket = io()

// Elements
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")
const $locationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML


// Options
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of Message Container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on("message", (message) => {
	console.log(message)
	const html = Mustache.render(messageTemplate, {
        username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format("h:mm A"),
	})
	$messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on("locationMessage", (location) => {
	console.log(location)
	const html = Mustache.render(locationTemplate, {
        username: location.username,
		location: location.url,
		createdAt: moment(location.createdAt).format("h:mm A"),
	})
	$messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on('activeUsers', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {room, users})
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
	e.preventDefault()
	// disable
	$messageFormButton.setAttribute("disabled", "disabled")
	const message = e.target.elements.message.value
	socket.emit("sendMessage", message, (msg) => {
		// enable
		$messageFormButton.removeAttribute("disabled")
		$messageFormInput.value = ""
		$messageFormInput.focus
		console.log(msg)
	})
})

document.querySelector("#send-location").addEventListener("click", () => {
	if (!navigator.geolocation) {
		return alert("Geolocation is not supported by your browser")
	}
	$locationButton.setAttribute("disabled", "disabled")
	navigator.geolocation.getCurrentPosition((position) => {
		socket.emit(
			"sendLocation",
			{
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
			},
			(msg) => {
				$locationButton.removeAttribute("disabled")
				console.log(msg)
			}
		)
	})
})

socket.emit('join', { username, room}, (error) => {
    if (error) {
        alert(error)
        location.href = "/"
    }
})

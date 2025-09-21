document.addEventListener("DOMContentLoaded", () => {
    const socket = io(); // auto-connect to Flask-SocketIO server
    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatBox = document.getElementById("chatBox");

    // Send message
    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if (msg) {
            socket.emit("send_message", { msg: msg });
            chatInput.value = "";
        }
    });

    // Receive messages
    socket.on("receive_message", (data) => {
        const p = document.createElement("p");
        p.innerHTML = `<strong>${data.user}:</strong> ${data.msg}`;
        chatBox.appendChild(p);
        chatBox.scrollTop = chatBox.scrollHeight; // auto-scroll
    });

    // System messages (join/leave)
    socket.on("message", (data) => {
        const p = document.createElement("p");
        p.classList.add("text-muted", "small");
        p.innerText = data.msg;
        chatBox.appendChild(p);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
});

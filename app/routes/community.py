from flask import Blueprint, render_template
from flask_login import login_required, current_user
from .. import socketio
from flask_socketio import send, emit, join_room, leave_room

community_bp = Blueprint("community", __name__, url_prefix="/community")

# Page route
@community_bp.route("/")
@login_required
def chat():
    return render_template("community.html")


# --- Socket Events ---
@socketio.on("connect")
def handle_connect():
    if current_user.is_authenticated:
        print(f"{current_user.username} connected")
        send({"msg": f"{current_user.username} has joined the chat."}, broadcast=True)


@socketio.on("disconnect")
def handle_disconnect():
    if current_user.is_authenticated:
        print(f"{current_user.username} disconnected")
        send({"msg": f"{current_user.username} has left the chat."}, broadcast=True)


@socketio.on("send_message")
def handle_message(data):
    msg = data["msg"]
    username = current_user.username if current_user.is_authenticated else "Guest"
    print(f"{username}: {msg}")
    emit("receive_message", {"user": username, "msg": msg}, broadcast=True)

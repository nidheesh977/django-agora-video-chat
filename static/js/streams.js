const APP_ID = "0c1d0dae73034ff6a0f5813ccedc13fe"
const CHANNEL = sessionStorage.getItem('room')
const TOKEN = sessionStorage.getItem('token')
let UID = Number(sessionStorage.getItem("UID"))
let NAME = sessionStorage.getItem("username")

const client = AgoraRTC.createClient({mode: 'rtc', codec: 'vp8'})

let localTracks = []
let remoteUsers = {}

let joinAndDisplayLocalStream = async() => {
    document.getElementById('room-name').innerText = CHANNEL
    client.on('user-published', handleUserJoined)
    client.on('user-left', handleUserLeft)

    try{
        await client.join(APP_ID, CHANNEL, TOKEN, UID)
    }catch(err){
        console.error(err)
        alert("Something went wrong. Try again")
        window.open("/", "_self")
    }
    
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()
    let user = await createUser()
    let player = `
        <div class="video-container" id = "user-container-${UID}">
            <div class="username-wrapper"><span class="user-name">${user.username}</span></div>
            <div class="video-player" id="user-${UID}"></div>
        </div>
    `
    document.getElementById("video-streams").insertAdjacentHTML('beforeend', player)

    localTracks[1].play(`user-${UID}`)
    await client.publish([localTracks[0], localTracks[1]])
}

let handleUserJoined = async(user, mediaType) => {
    remoteUsers[user.uid] = user
    await client.subscribe(user, mediaType)
    if (mediaType === "video"){
        let player = document.getElementById(`user-container-${user.uid}`)
        if (player != null){
            player.remove()
        }
        let member = await getUser(user)
        console.log(member)
        player = `
            <div class="video-container" id = "user-container-${user.uid}">
                <div class="username-wrapper"><span class="user-name">${member.username}</span></div>
                <div class="video-player" id="user-${user.uid}"></div>
            </div>
        `
        document.getElementById("video-streams").insertAdjacentHTML('beforeend', player)
        user.videoTrack.play(`user-${user.uid}`)
    }

    if (mediaType === "audio"){
        user.audioTrack.play()
    }
}
let handleUserLeft = async (user) => {
    let member = await getUser(user)
    deleteUser({"username": member.username, "UID": user.uid})
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

let leaveAndRemoveLocalStream = async () => {
    
    for (let i = 0; i < localTracks.length; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }
    deleteUser({"username": NAME, "UID": UID})
    await client.leave()
    window.open("/", "_self")
}

let toggleCamera = async (e) => {
    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        e.target.style.backgroundColor = "#fff"
    }else{
        localTracks[1].setMuted(true)
        e.target.style.backgroundColor = "red"
    }
}

let toggleMic = async (e) => {
    if(localTracks[0].muted){
        await localTracks[0].setMuted(false)
        e.target.style.backgroundColor = "#fff"
    }else{
        localTracks[0].setMuted(true)
        e.target.style.backgroundColor = "red"
    }
}

let createUser = async()=>{
    let response = await fetch('/create_user/', {
        method: "POST",
        headers:{
            'Content-Type': "application/json"
        },
        body: JSON.stringify({
            'username': NAME,
            'room_name': CHANNEL,
            "UID": UID
        })
    })

    let user = await response.json()
    return user
}

let getUser = async (user) => {
    let response = await fetch(`/get_user/?UID=${user.uid}&room_name=${CHANNEL}`)
    let data = await response.json()
    console.log(data)
    return data
}

let deleteUser = async (user) => {
    let response = await fetch('/delete_user/', {
        method: "POST",
        header: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"username": user.username, 'room_name': CHANNEL, 'UID': user.UID})
    })
    let data = await response.json()
}

joinAndDisplayLocalStream()
document.getElementById("quit-btn").addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById("video-btn").addEventListener('click', toggleCamera)
document.getElementById("mic-btn").addEventListener('click', toggleMic)

window.onbeforeunload = function () {
    alert("Do you really want to close?");
};
const webSocket = new WebSocket("ws://192.168.179.51:3000");

webSocket.onmessage = (event) => {
  handleSignallingData(JSON.parse(event.data));
}

const handleSignallingData = (data) => {
  switch (data.type) {
    case "offer":
      peerConnection.setRemoteDescription(data.offer);
      createAndSendAnswer();
      break;
    case "candidate":
      peerConnection.addIceCandidate(data.candidate);
  };
}

const createAndSendAnswer = () => {
  peerConnection.createAnswer((answer) => {
    peerConnection.setLocalDescription(answer);
    sendData({
      type: "send_answer",
      answer: answer
    });
  }, (error) => {
    console.log(error);
  });
}

let userName;
const sendData = (data) => {
  data.userName = userName;
  webSocket.send(JSON.stringify(data));
}

let localStream;
let peerConnection;
const joinCall = () => {
  userName = document.getElementById("userName").value;
  document.getElementById("video-call-div").style.display = "inline";
  navigator.getUserMedia({
    video: {
      frameRate: 24,
      width: {
        min: 480,
        ideal: 720,
        max: 1280
      },
      aspectRatio: 1.33333
    },
    audio: true
  }, (stream) => {
    localStream = stream;
    document.getElementById("local-video").srcObject = localStream;

    let config = {
      iceServers: [
        {
          "urls": ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]
        }
      ]
    };

    peerConnection = new RTCPeerConnection(config);
    peerConnection.addStream(localStream);
    peerConnection.onaddstream = (e) => {
      document.getElementById("remote-video").srcObject = e.stream;
    };

    peerConnection.onicecandidate = (e) => {
      if (e.candidate == null) {
        return;
      }

      sendData({
        type: "send_candidate",
        candidate: e.candidate
      });
    };

    sendData({
      type: "join_call"
    });
  }, (error) => {
    console.log(error);
  });
}

let isAudio = true;
const muteAudio = () => {
  isAudio = !isAudio;
  localStream.getAudioTracks()[0].enabled = isAudio;
}

let isVideo = true;
const muteVideo = () => {
  isVideo = !isVideo;
  localStream.getVideoTracks()[0].enabled = isVideo;
}
const webSocket = new WebSocket("ws://192.168.179.51:3000");

webSocket.onmessage = (event) => {
  handleSignallingData(JSON.parse(event.data));
}

const handleSignallingData = (data) => {
  switch (data.type) {
    case "answer":
      peerConnection.setRemoteDescription(data.answer);
      break;
    case "candidate":
      peerConnection.addIceCandidate(data.candidate);
  };
}

let userName;
const sendUserName = () => {
  userName = document.getElementById("userName").value;
  sendData({
    type: "store_user"
  });
}

const sendData = (data) => {
  data.userName = userName;
  webSocket.send(JSON.stringify(data));
}

let localStream;
let peerConnection;
const startCall = () => {
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
        type: "store_candidate",
        candidate: e.candidate
      });
    };

    createAndSendOffer();
  }, (error) => {
    console.log(error);
  });
}

const createAndSendOffer = () => {
  peerConnection.createOffer((offer) => {
    sendData({
      type: "store_offer",
      offer: offer
    });

    peerConnection.setLocalDescription(offer);
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
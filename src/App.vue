<script setup lang="ts">
import axios from "axios";
import { OpenVidu, Session, StreamManager } from "openvidu-browser";
import { ref } from "vue";
import UserVideo from "./components/UserVideo.vue";
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.headers.common.Authorization =
  "Basic " + btoa("OPENVIDUAPP:MY_SECRET");
// const APPLICATION_SERVER_URL = "http://localhost:4443/";
// const APPLICATION_SERVER_URL = "http://localhost:5000/";
// const APPLICATION_SERVER_URL = "https://volumetric.ru/";
const APPLICATION_SERVER_URL = "/";


const OV = ref<OpenVidu>();
const session = ref<Session>();
const mainStreamManager = ref<StreamManager>();
const publisher = ref();
const subscribers = ref<StreamManager[]>([]);

// Join form
const mySessionId = ref("SessionA");
const myUserName = ref("Participant" + Math.floor(Math.random() * 100));

const joinSession = () => {
  // --- 1) Get an OpenVidu object ---

  // debugger
  OV.value = new OpenVidu();

  // --- 2) Init a session ---
  session.value = OV.value.initSession();

  if (!session.value) return;
  // --- 3) Specify the actions when events take place in the session ---

  // On every new Stream received...
  session.value.on("streamCreated", ({ stream }) => {
    if (!session.value) return;

    //  TODO: check targetElement
    const subscriber = session.value.subscribe(stream, undefined);
    subscribers.value.push(subscriber);
  });

  // On every Stream destroyed...
  session.value.on("streamDestroyed", ({ stream }) => {
    const index = subscribers.value.indexOf(stream.streamManager, 0);
    if (index >= 0) {
      subscribers.value.splice(index, 1);
    }
  });

  // On every asynchronous exception...
  session.value.on("exception", (e) => {
    // console.warn(e.data.exception);

    // @ts-ignore
    console.warn(e.exception);
  });

  // --- 4) Connect to the session with a valid user token ---

  // Get a token from the OpenVidu deployment
  getToken(mySessionId.value).then((token) => {
    // First param is the token. Second param can be retrieved by every user on event
    // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
    session.value
      ?.connect(token, { clientData: myUserName.value })
      .then(() => {
        // --- 5) Get your own camera stream with the desired properties ---

        // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
        // element: we will manage it on our own) and with the desired properties
        const publisher = OV.value?.initPublisher(undefined, {
          audioSource: undefined, // The source of audio. If undefined default microphone
          videoSource: undefined, // The source of video. If undefined default webcam
          publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
          publishVideo: true, // Whether you want to start publishing with your video enabled or not
          resolution: "640x480", // The resolution of your video
          frameRate: 30, // The frame rate of your video
          insertMode: "APPEND", // How the video is inserted in the target element 'video-container'
          mirror: false, // Whether to mirror your local video or not
        });

        // Set the main video in the page to display our webcam and store our Publisher
        mainStreamManager.value = publisher;
        const newPublisher = publisher;
        if (!newPublisher) return;
        // --- 6) Publish your stream ---

        session.value?.publish(newPublisher);
      })
      .catch((error) => {
        console.log(
          "There was an error connecting to the session:",
          error.code,
          error.message
        );
      });
  });

  window.addEventListener("beforeunload", leaveSession);
};

const leaveSession = () => {
  // --- 7) Leave the session by calling 'disconnect' method over the Session object ---
  if (session.value) session.value.disconnect();

  // Empty all properties...
  session.value = undefined;
  mainStreamManager.value = undefined;
  publisher.value = undefined;
  subscribers.value = [];
  OV.value = undefined;

  // Remove beforeunload listener
  window.removeEventListener("beforeunload", leaveSession);
};

const updateMainVideoStreamManager = (stream: StreamManager) => {
  if (mainStreamManager.value === stream) return;
  mainStreamManager.value = stream;
};

/**
 * --------------------------------------------
 * GETTING A TOKEN FROM YOUR APPLICATION SERVER
 * --------------------------------------------
 * The methods below request the creation of a Session and a Token to
 * your application server. This keeps your OpenVidu deployment secure.
 *
 * In this sample code, there is no user control at all. Anybody could
 * access your application server endpoints! In a real production
 * environment, your application server must identify the user to allow
 * access to the endpoints.
 *
 * Visit https://docs.openvidu.io/en/stable/application-server to learn
 * more about the integration of OpenVidu in your application server.
 */
const getToken = async (mySessionId: string) => {
  const session = await createSession(mySessionId);
  return await createToken(session.sessionId);
};

const createSession = async (sessionId: string) => {
  try {
    const response = await axios.post<Session>(
      APPLICATION_SERVER_URL + "openvidu/api/sessions",
      { customSessionId: sessionId }
    );

    console.log(response.data);

    return response.data; // The sessionId
  } catch (e) {
    const response = await axios.get<Session>(
      `${APPLICATION_SERVER_URL}openvidu/api/sessions/${sessionId}`
    );

    console.log(response.data);

    return response.data; // The sessionId
  }
};

const createToken = async (sessionId: string) => {
  const response = await axios.post(
    APPLICATION_SERVER_URL +
      "openvidu/api/sessions/" +
      sessionId +
      "/connection",
    {},
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  console.log(response.data);

  return response.data.token as string; // The token
};
</script>

<template>
  <div id="main-container" class="container">
    <div id="join" v-if="!session">
      <div id="img-div">
        <img src="/resources/images/openvidu_grey_bg_transp_cropped.png" />
      </div>
      <div id="join-dialog" class="jumbotron vertical-center">
        <h1>Join a video session</h1>
        <div class="form-group">
          <p>
            <label>Participant</label>
            <input
              v-model="myUserName"
              class="form-control"
              type="text"
              required
            />
          </p>
          <p>
            <label>Session</label>
            <input
              v-model="mySessionId"
              class="form-control"
              type="text"
              required
            />
          </p>
          <p class="text-center">
            <button class="btn btn-lg btn-success" @click="joinSession()">
              Join!
            </button>
          </p>
        </div>
      </div>
    </div>

    <div id="session" v-if="session">
      <div id="session-header">
        <h1 id="session-title">{{ mySessionId }}</h1>
        <input
          class="btn btn-large btn-danger"
          type="button"
          id="buttonLeaveSession"
          @click="leaveSession"
          value="Leave session"
        />
      </div>
      <div id="main-video" class="col-md-6">
        <UserVideo
          v-if="mainStreamManager"
          :stream-manager="mainStreamManager"
        />
      </div>
      <div id="video-container" class="col-md-6">
        <UserVideo
          :stream-manager="publisher"
          @click.native="updateMainVideoStreamManager(publisher)"
        />
        <!-- @vue-skip -->
        <UserVideo
          v-for="sub in subscribers"
          :key="sub.stream.connection.connectionId"
          :stream-manager="sub"
          @click.native="updateMainVideoStreamManager(sub)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>

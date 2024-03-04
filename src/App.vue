<script setup lang="ts">
import axios from 'axios';
import { OpenVidu, Session, StreamManager } from 'openvidu-browser';
import { ref } from 'vue';
import UserVideo from './components/UserVideo.vue';
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common.Authorization = 'Basic ' + btoa('OPENVIDUAPP:MY_SECRET');
// const APPLICATION_SERVER_URL = "http://localhost:4443/";
// const APPLICATION_SERVER_URL = "http://localhost:5000/";
// const APPLICATION_SERVER_URL = "https://volumetric.ru/";
const APPLICATION_SERVER_URL = '/';

const OV = ref<OpenVidu>();
const session = ref<Session>();
const mainStreamManager = ref<StreamManager>();
const publisher = ref();
const subscribers = ref<StreamManager[]>([]);

const recordingId = ref('');

const mySessionId = ref('SessionA');
const myUserName = ref('Participant' + Math.floor(Math.random() * 100));

const joinSession = async () => {
    OV.value = new OpenVidu();
    session.value = OV.value.initSession();
    if (!session.value) return;

    session.value.on('streamCreated', ({ stream }) => {
        if (!session.value) return;
        const subscriber = session.value.subscribe(stream, undefined);
        subscribers.value.push(subscriber);
    });

    session.value.on('streamDestroyed', ({ stream }) => {
        const index = subscribers.value.indexOf(stream.streamManager, 0);
        if (index >= 0) {
            subscribers.value.splice(index, 1);
        }
    });

    session.value.on('exception', (e) => {
        console.warn((e as any).exception);
    });

    const token = await getToken();

    try {
        await session.value.connect(token, { clientData: myUserName.value });
        const publisher = OV.value.initPublisher(undefined, {
            audioSource: undefined,
            videoSource: undefined,
            publishAudio: true,
            publishVideo: true,
            resolution: '640x480',
            frameRate: 30,
            insertMode: 'APPEND',
            mirror: false,
        });

        mainStreamManager.value = publisher;
        session.value.publish(publisher);
    } catch (e) {
        console.log('There was an error connecting to the session:', (e as any).code, (e as any).message);
    }

    window.addEventListener('beforeunload', leaveSession);
};

const leaveSession = () => {
    if (session.value) session.value.disconnect();
    session.value = undefined;
    mainStreamManager.value = undefined;
    publisher.value = undefined;
    subscribers.value = [];
    OV.value = undefined;
    window.removeEventListener('beforeunload', leaveSession);
};

const updateMainVideoStreamManager = (stream: StreamManager) => {
    if (mainStreamManager.value === stream) return;
    mainStreamManager.value = stream;
};

const getToken = async () => {
    const session = await createSession(mySessionId.value);
    return await createToken(session.sessionId);
};

const createSession = async (sessionId: string) => {
    try {
        const response = await axios.post<Session>(APPLICATION_SERVER_URL + 'openvidu/api/sessions', {
            customSessionId: sessionId,
        });
        return response.data;
    } catch (e) {
        const response = await axios.get<Session>(APPLICATION_SERVER_URL + 'openvidu/api/sessions/' + sessionId);
        return response.data;
    }
};

const createToken = async (sessionId: string) => {
    const response = await axios.post(
        APPLICATION_SERVER_URL + 'openvidu/api/sessions/' + sessionId + '/connection',
        {}
    );

    return response.data.token as string;
};

const startRecording = async () => {
    const response = await axios.post(APPLICATION_SERVER_URL + 'openvidu/api/recordings/start', {
        session: mySessionId.value,
    });

    console.log(response.data);

    recordingId.value = response.data.id as string;
};

const stopRecording = async () => {
    if (!recordingId.value) return;

    const response = await axios.post(APPLICATION_SERVER_URL + 'openvidu/api/recordings/stop/' + recordingId.value, {});

    console.log(response.data);
    recordingId.value = '';
};
</script>

<template>
    <div
        id="main-container"
        class="container"
    >
        <div
            id="join"
            v-if="!session"
        >
            <div
                id="join-dialog"
                class="jumbotron vertical-center"
            >
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
                        <button
                            class="btn btn-lg btn-success"
                            @click="joinSession()"
                        >
                            Join!
                        </button>
                    </p>
                </div>
            </div>
        </div>

        <div
            id="session"
            v-if="session"
        >
            <div id="session-header">
                <h1 id="session-title">{{ mySessionId }}</h1>
                <button
                    class="btn btn-large btn-danger"
                    id="buttonLeaveSession"
                    @click="leaveSession"
                >
                    Leave session
                </button>
                <button
                    v-if="!recordingId"
                    class="btn btn-large btn-danger"
                    id="buttonLeaveSession"
                    @click="startRecording"
                >
                    Start recording
                </button>
                <button
                    v-else
                    class="btn btn-large btn-danger"
                    id="buttonLeaveSession"
                    @click="stopRecording"
                >
                    Stop recording
                </button>
            </div>
            <div
                id="main-video"
                class="col-md-6"
            >
                <UserVideo
                    v-if="mainStreamManager"
                    :stream-manager="mainStreamManager"
                />
            </div>
            <div
                id="video-container"
                class="col-md-6"
            >
                <UserVideo
                    :stream-manager="publisher"
                    @click="updateMainVideoStreamManager(publisher)"
                />
                <!-- @vue-skip -->
                <UserVideo
                    v-for="sub in subscribers"
                    :key="sub.stream.connection.connectionId"
                    :stream-manager="sub"
                    @click="updateMainVideoStreamManager(sub)"
                />
            </div>
        </div>
    </div>
</template>

<style scoped></style>

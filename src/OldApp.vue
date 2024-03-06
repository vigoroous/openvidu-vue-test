<script setup lang="ts">
import { OpenVidu, Publisher, Session, StreamManager } from 'openvidu-browser';
import { ref } from 'vue';
import UserVideo from '@src/components/stream/UserVideo.vue';
import { getToken, startRecording, stopRecording } from './api';

const OVCamera = ref<OpenVidu>();
const sessionCamera = ref<Session>();
const publisherCamera = ref<Publisher>();

const OVScreen = ref<OpenVidu>();
const sessionScreen = ref<Session>();
const publisherScreen = ref<Publisher>();

const mainStreamManager = ref<StreamManager>();
const subscribers = ref<StreamManager[]>([]);

const recordingId = ref('');

type ChatMessage = {
    createdAt: number;
    username: string;
    message: string;
};

const messages = ref<ChatMessage[]>([]);
const messageStr = ref('');
// const shareScreenEl = ref<HTMLVideoElement>();

const mySessionId = ref('SessionA');
const myUserName = ref('Participant' + Math.floor(Math.random() * 100));

const joinSession = async () => {
    OVCamera.value = new OpenVidu();
    sessionCamera.value = OVCamera.value.initSession();
    if (!sessionCamera.value) return;

    sessionCamera.value.on('streamCreated', ({ stream }) => {
        if (!sessionCamera.value) return;
        const subscriber = sessionCamera.value.subscribe(stream, undefined);
        subscribers.value.push(subscriber);
    });

    sessionCamera.value.on('streamDestroyed', ({ stream }) => {
        const index = subscribers.value.indexOf(stream.streamManager, 0);
        if (index >= 0) {
            subscribers.value.splice(index, 1);
        }
    });

    sessionCamera.value.on('signal:chat-message', (event) => {
        console.log(event.data); // Message
        console.log(event.from); // Connection object of the sender
        console.log(event.type); // The type of message ("my-chat")

        if (event.data) {
            messages.value.push(JSON.parse(event.data) as ChatMessage);
        }
    });

    sessionCamera.value.on('exception', (e) => {
        console.warn((e as any).exception);
    });

    const token = await getToken(mySessionId.value);

    try {
        await sessionCamera.value.connect(token, { clientData: myUserName.value });
        const publisher = OVCamera.value.initPublisher(undefined, {
            audioSource: undefined,
            videoSource: undefined,
            publishAudio: true,
            publishVideo: true,
            resolution: '640x480',
            frameRate: 30,
            insertMode: 'APPEND',
            mirror: false,
        });
        publisherCamera.value = publisher;
        // mainStreamManager.value = publisher;
        sessionCamera.value.publish(publisher);
    } catch (e) {
        console.log('There was an error connecting to the session:', (e as any).code, (e as any).message);
    }

    window.addEventListener('beforeunload', leaveSession);
};

async function sendChatMessage() {
    if (!sessionCamera.value) return;
    if (!messageStr.value) return;

    const message: ChatMessage = {
        createdAt: Date.now(),
        message: messageStr.value,
        username: myUserName.value,
    };

    await sessionCamera.value.signal({
        data: JSON.stringify(message),
        to: [],
        type: 'chat-message',
    });
}

async function shareScreen() {
    OVScreen.value = new OpenVidu();
    sessionScreen.value = OVScreen.value.initSession();
    const token = await getToken(mySessionId.value);
    try {
        await sessionScreen.value.connect(token, { clientData: myUserName.value });

        const publisher = OVScreen.value.initPublisher(undefined, {
            videoSource: 'screen',
            audioSource: 'screen',
        });

        publisher.once('accessAllowed', (event) => {
            if (!sessionScreen.value) return;

            publisher.stream
                .getMediaStream()
                .getVideoTracks()[0]
                .addEventListener('ended', () => {
                    console.log('User pressed the "Stop sharing" button');
                    if (!sessionScreen.value || !publisherScreen.value) return;
                    sessionScreen.value.unpublish(publisherScreen.value);
                    publisherScreen.value = undefined;
                });

            sessionScreen.value.publish(publisher);
            publisherScreen.value = publisher;
        });

        publisher.once('accessDenied', (event) => {
            console.warn('ScreenShare: Access Denied');
        });
    } catch (e) {
        console.log('There was an error connecting to the session:', (e as any).code, (e as any).message);
    }
}

const leaveSession = () => {
    if (sessionCamera.value) sessionCamera.value.disconnect();
    sessionCamera.value = undefined;
    mainStreamManager.value = undefined;
    publisherCamera.value = undefined;
    subscribers.value = [];
    OVCamera.value = undefined;

    if (sessionScreen.value) sessionScreen.value.disconnect();
    sessionScreen.value = undefined;
    publisherScreen.value = undefined;
    OVScreen.value = undefined;

    window.removeEventListener('beforeunload', leaveSession);
};

const updateMainVideoStreamManager = (stream: StreamManager) => {
    if (mainStreamManager.value === stream) return;
    mainStreamManager.value = stream;
};

const handleStartRecording = async () => {
    recordingId.value = await startRecording(mySessionId.value);
};

const handleStopRecording = async () => {
    await stopRecording(recordingId.value);
};
</script>

<template>
    <div
        id="main-container"
        class="container"
    >
        <div
            v-if="sessionCamera"
            class="chat"
        >
            <div class="controls">
                <textarea
                    class="input-message"
                    v-model="messageStr"
                    multiple
                />
                <button
                    class="button-send"
                    @click="sendChatMessage"
                >
                    Send message
                </button>
            </div>
            <div
                v-for="(message, idx) in messages"
                :key="idx"
                class="message"
            >
                <div class="header">
                    <div>{{ message.username }}</div>
                    <div>{{ new Date(message.createdAt).toLocaleString('ru-RU') }}</div>
                </div>
                <div class="content">{{ message.message }}</div>
            </div>
        </div>
        <div
            id="join"
            v-if="!sessionCamera"
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

        <div v-if="sessionScreen">
            <UserVideo
                v-if="publisherScreen"
                :stream-manager="publisherScreen"
            />
        </div>
        <div
            id="session"
            v-if="sessionCamera"
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
                    @click="handleStartRecording"
                >
                    Start recording
                </button>
                <button
                    v-else
                    class="btn btn-large btn-danger"
                    id="buttonLeaveSession"
                    @click="handleStopRecording"
                >
                    Stop recording
                </button>
                <button
                    class="btn btn-large btn-danger"
                    id="buttonLeaveSession"
                    @click="shareScreen"
                >
                    Share screen
                </button>
            </div>
            <!-- <div
                id="main-video"
                class="col-md-6"
            >
                <UserVideo
                    v-if="mainStreamManager"
                    :stream-manager="mainStreamManager"
                />
            </div> -->
            <div
                id="video-container"
                class="col-md-6"
            >
                <UserVideo
                    v-if="publisherCamera"
                    :stream-manager="publisherCamera"
                    @click="updateMainVideoStreamManager(publisherCamera)"
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

<style scoped lang="scss">
.chat {
    display: flex;
    flex-direction: column;

    max-width: 500px;

    .controls {
        display: flex;
        flex-direction: column;
    }

    .message {
        display: flex;
        flex-direction: column;

        .header {
            display: flex;
            gap: 16px;
        }

        .content {
            font-size: 16px;
        }
    }
}
</style>
./components/stream/UserVideo.vue
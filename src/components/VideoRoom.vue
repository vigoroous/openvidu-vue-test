<script setup lang="ts">
import { storeToRefs } from 'pinia';
import Toolbar from './toolbar/Toolbar.vue';
import { userStore } from '@src/store';
import UserStream from './stream/UserStream.vue';
import { nextTick, onMounted, ref, watch } from 'vue';
import { User } from '@src/types';
import { Device, OpenVidu, Publisher, Session, Stream } from 'openvidu-browser';
import { getToken } from '@src/api';
import Chat from './chat/Chat.vue';

const { localUser } = storeToRefs(userStore);

const OV = new OpenVidu();
const mySessionId = ref('SessionB');
const myUsername = ref('OpenVidu_User' + Math.floor(Math.random() * 100));
const subscribers = ref<User[]>([]);
const showChat = ref(false);
const session = ref<Session>();
const currentVideoDevice = ref<Device>();

const containerRef = ref<HTMLElement>();

const joinSession = async () => {
    session.value = OV.initSession();

    subscribeToStreamCreated();

    const token = await getToken(mySessionId.value);
    try {
        await session.value.connect(
            token,
            JSON.stringify({
                isAudioActive: localUser.value.isAudioActive,
                isVideoActive: localUser.value.isVideoActive,
                isScreenShareActive: localUser.value.isScreenShareActive,
                nickname: myUsername.value,
            } as User)
        );
    } catch (e) {
        console.log('There was an error connecting to the session:', (e as any).code, (e as any).message);
    }

    await connectWebCam();
};

const connectWebCam = async () => {
    await OV.getUserMedia({ audioSource: undefined, videoSource: undefined });
    var devices = await OV.getDevices();
    var videoDevices = devices.filter((device) => device.kind === 'videoinput');

    let publisher = OV.initPublisher(undefined, {
        audioSource: undefined,
        videoSource: videoDevices[0].deviceId,
        publishAudio: localUser.value.isAudioActive,
        publishVideo: localUser.value.isVideoActive,
        resolution: '640x480',
        frameRate: 30,
        insertMode: 'APPEND',
    });

    if (session.value?.capabilities.publish) {
        publisher.on('accessAllowed', () => {
            session.value?.publish(publisher).then(() => {
                // this.updateSubscribers();
                // this.localUserAccessAllowed = true;
                // if (this.props.joinSession) {
                //     this.props.joinSession();
                // }
                // joinSession();
            });
        });
    }
    localUser.value.nickname = myUsername.value;
    localUser.value.connectionId = session.value?.connection.connectionId ?? '';
    localUser.value.isScreenShareActive = false;
    localUser.value.streamManager = publisher;

    subscribeToUserChanged();
    subscribeToStreamDestroyed();
    sendSignalUserChanged({ isScreenShareActive: localUser.value.isScreenShareActive });

    // this.setState({ currentVideoDevice: videoDevices[0], localUser: localUser }, () => {
    //     this.state.localUser.getStreamManager().on('streamPlaying', (e) => {
    //         this.updateLayout();
    //         publisher.videos[0].video.parentElement.classList.remove('custom-class');
    //     });
    // });

    currentVideoDevice.value = videoDevices[0];
    localUser.value.streamManager?.on('streamPlaying', (e) => {
        // console.log('Need to update layout');
    });
};

const leaveSession = () => {
    const mySession = session.value;

    if (mySession) {
        mySession.disconnect();
    }

    session.value = undefined;
    subscribers.value = [];
    mySessionId.value = 'SessionA';
    myUsername.value = 'OpenVidu_User' + Math.floor(Math.random() * 100);
    localUser.value.streamManager = null;

    window.removeEventListener('beforeunload', leaveSession);
};

const camStatusChanged = async () => {
    localUser.value.isVideoActive = !localUser.value.isVideoActive;
    await nextTick();
    (localUser.value.streamManager as Publisher)?.publishVideo(localUser.value.isVideoActive);
    sendSignalUserChanged({ isVideoActive: localUser.value.isVideoActive });
};

const micStatusChanged = async () => {
    localUser.value.isAudioActive = !localUser.value.isAudioActive;
    await nextTick();
    (localUser.value.streamManager as Publisher)?.publishAudio(localUser.value.isAudioActive);
    sendSignalUserChanged({ isAudioActive: localUser.value.isAudioActive });
};

const subscribeToStreamCreated = () => {
    session.value?.on('streamCreated', (event) => {
        const subscriber = session.value?.subscribe(event.stream, undefined);

        subscriber?.on('streamPlaying', (e) => {
            // this.checkSomeoneShareScreen();
            // subscriber.videos[0].video.parentElement?.classList.remove('custom-class');
        });
        const data = JSON.parse(event.stream.connection.data);

        const newUser: User = {
            connectionId: event.stream.connection.connectionId,
            streamManager: subscriber ?? null,
            nickname: data.nickname,
            type: 'remote',
            isAudioActive: data.isAudioActive,
            isVideoActive: data.isVideoActive,
            isScreenShareActive: data.isScreenShareActive,
        };

        subscribers.value.push(newUser);
    });
};

const subscribeToUserChanged = () => {
    session.value?.on('signal:userChanged', (event) => {
        const remoteUsers = subscribers.value;

        if (!event.data || !event.from) return;

        // const newUsers = compact(
        remoteUsers.forEach((user) => {
            if (!event.data || !event.from) return;

            if (user.connectionId === event.from.connectionId) {
                const data = JSON.parse(event.data);
                console.log('EVENTO REMOTE: ', event.data);

                if (data.isAudioActive !== undefined) {
                    user.isAudioActive = data.isAudioActive;
                }
                if (data.isVideoActive !== undefined) {
                    user.isVideoActive = data.isVideoActive;
                }
                if (data.nickname !== undefined) {
                    user.nickname = data.nickname;
                }
                if (data.isScreenShareActive !== undefined) {
                    user.isScreenShareActive = data.isScreenShareActive;
                }
            }
        });

        subscribers.value = remoteUsers;
    });
};

const deleteSubscriber = (stream: Stream) => {
    const index = subscribers.value.findIndex(
        (user) => user.streamManager?.stream.connection.connectionId === stream.connection.connectionId
    );
    if (index > -1) {
        subscribers.value.splice(index, 1);
    }
};

const subscribeToStreamDestroyed = () => {
    // On every Stream destroyed...
    session.value?.on('streamDestroyed', (event) => {
        // Remove the stream from 'subscribers' array
        deleteSubscriber(event.stream);
        // setTimeout(() => {
        //     this.checkSomeoneShareScreen();
        // }, 20);
        event.preventDefault();
        // this.updateLayout();
    });
};

const sendSignalUserChanged = (data: any) => {
    const signalOptions = {
        data: JSON.stringify(data),
        type: 'userChanged',
    };
    session.value?.signal(signalOptions);
};

const toggleFullscreen = () => {
    const document = window.document;
    if (!containerRef.value) return;

    if (!document.fullscreenElement) {
        containerRef.value.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
};

const toggleChat = () => {
    showChat.value = !showChat.value;
};

const switchCamera = async () => {
    try {
        const devices = await OV.getDevices();
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');

        if (videoDevices && videoDevices.length > 1) {
            const newVideoDevice = videoDevices.filter(
                (device) => device.deviceId !== currentVideoDevice.value?.deviceId
            );

            if (newVideoDevice.length > 0) {
                // Creating a new publisher with specific videoSource
                // In mobile devices the default and first camera is the front one
                const newPublisher = OV.initPublisher(undefined, {
                    audioSource: undefined,
                    videoSource: newVideoDevice[0].deviceId,
                    publishAudio: localUser.value.isAudioActive,
                    publishVideo: localUser.value.isVideoActive,
                    mirror: true,
                });

                //newPublisher.once("accessAllowed", () => {
                await session.value?.unpublish(localUser.value?.streamManager as Publisher);
                await session.value?.publish(newPublisher);
                localUser.value.streamManager = newPublisher;

                localUser.value = { ...localUser.value };
                // this.setState({
                //     currentVideoDevice: newVideoDevice,
                //     localUser: localUser,
                // });
                sendSignalUserChanged({
                    isAudioActive: localUser.value.isAudioActive,
                    isVideoActive: localUser.value.isVideoActive,
                });

                currentVideoDevice.value = newVideoDevice[0];
            }
        }
    } catch (e) {
        console.error(e);
    }
};

const screenShare = () => {
    const videoSource = navigator.userAgent.indexOf('Firefox') !== -1 ? 'window' : 'screen';
    const publisher = OV.initPublisher(
        undefined,
        {
            videoSource: videoSource,
            publishAudio: localUser.value.isAudioActive,
            publishVideo: localUser.value.isVideoActive,
            mirror: false,
        },
        (error) => {
            if (error && error.name === 'SCREEN_EXTENSION_NOT_INSTALLED') {
                // this.setState({ showExtensionDialog: true });
                alert('You need to install screen sharing extension');
            } else if (error && error.name === 'SCREEN_SHARING_NOT_SUPPORTED') {
                alert('Your browser does not support screen sharing');
            } else if (error && error.name === 'SCREEN_EXTENSION_DISABLED') {
                alert('You need to enable screen sharing extension');
            } else if (error && error.name === 'SCREEN_CAPTURE_DENIED') {
                alert('You need to choose a window or application to share');
            }
        }
    );

    publisher.once('accessAllowed', () => {
        session.value?.unpublish(localUser.value?.streamManager as Publisher);
        // localUser.setStreamManager(publisher);
        localUser.value.streamManager = publisher;

        session.value?.publish(localUser.value?.streamManager as Publisher).then(() => {
            // localUser.setScreenShareActive(true);
            localUser.value.isScreenShareActive = true;
            // this.setState({ localUser: localUser }, () => {
            //     this.sendSignalUserChanged({ isScreenShareActive: localUser.isScreenShareActive() });
            // });
            sendSignalUserChanged({ isScreenShareActive: localUser.value.isScreenShareActive });
        });
    });
    publisher.on('streamPlaying', () => {
        // this.updateLayout();
        // publisher.videos[0].video.parentElement.classList.remove('custom-class');
    });
};

const stopScreenShare = () => {
    session.value?.unpublish(localUser.value.streamManager as Publisher);
    connectWebCam();
};

const onMessageRecieved = () => {
    console.log('message recieved');
};

onMounted(async () => {
    await joinSession();
    window.addEventListener('beforeunload', leaveSession);
});
</script>

<template>
    <div
        ref="containerRef"
        class="video-room"
    >
        <div class="layout">
            <div class="streams">
                <UserStream :user="localUser" />
                <UserStream
                    v-for="sub in subscribers"
                    :key="sub.connectionId"
                    :user="sub"
                />
            </div>

            <div class="toolbar-wrap">
                <Toolbar
                    :session-id="mySessionId"
                    @cam-status-changed="camStatusChanged"
                    @mic-status-changed="micStatusChanged"
                    @start-screen-share="screenShare"
                    @stop-screen-share="stopScreenShare"
                    @toggle-fullscreen="toggleFullscreen"
                    @switch-camera="switchCamera"
                    @leave-session="leaveSession"
                    @toggle-chat="toggleChat"
                />
            </div>

            <div class="chat">
                <Chat
                    :show="showChat"
                    @close="showChat = false"
                    @message-received="onMessageRecieved"
                />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.video-room {
    max-height: 100vh;
    height: 100%;
    // overflow: hidden;
    .layout {
        height: 100%;
        position: relative;

        .toolbar-wrap {
            // position: absolute;
            // bottom: 0;
            // left: 0;
            // right: 0;
        }

        .streams {
            height: calc(100% - 70px);
            display: grid;
            // gap: 1rem;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            // grid-template-columns: repeat(auto-fill, minmax(min(10rem, 100%), 1fr));
            .user-stream {
                // height: 200px;

                @media (max-width: 600px) {
                    height: 300px;
                }
            }
        }
    }
}
</style>

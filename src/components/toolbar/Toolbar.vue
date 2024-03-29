<script setup lang="ts">
import {
    ArrowPathIcon,
    ArrowsPointingInIcon,
    ArrowsPointingOutIcon,
    ChatBubbleOvalLeftIcon,
    MicrophoneIcon,
    PhoneXMarkIcon,
    TvIcon,
    VideoCameraIcon,
    VideoCameraSlashIcon,
    ViewfinderCircleIcon,
} from '@heroicons/vue/20/solid';
import openviduLogo from '@src/assets/images/openvidu_logo_short.png';
import { userStore } from '@src/store';
import { NButton } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { ovTheme } from '@src/consts/ov.consts';

const props = defineProps<{
    sessionId: string;
}>();

const fullscreen = ref(false);
const recording = ref(false);
const showChat = ref(false);

const { localUser } = storeToRefs(userStore);

const emits = defineEmits<{
    (e: 'mic-status-changed'): void;
    (e: 'cam-status-changed'): void;
    (e: 'start-screen-share'): void;
    (e: 'stop-screen-share'): void;
    (e: 'toggle-fullscreen'): void;
    (e: 'switch-camera'): void;
    (e: 'leave-session'): void;
    (e: 'toggle-chat'): void;
    // (e: 'start-recording'): void;
    // (e: 'stop-recording'): void;
}>();

const toggleFullscreen = () => {
    emits('toggle-fullscreen');
    fullscreen.value = !fullscreen.value;
};

const toggleScreenShare = () => {
    if (localUser.value.isScreenShareActive) {
        emits('stop-screen-share');
    } else {
        emits('start-screen-share');
    }
};

// const toggleRecording = () => {
//     if (recording.value) {
//         emits('stop-recording');
//     } else {
//         emits('start-recording');
//     }
//     recording.value = !recording.value;
// };

const toggleChat = () => {
    emits('toggle-chat');
    showChat.value = !showChat.value;
};
</script>

<template>
    <div class="toolbar">
        <div class="info">
            <img
                class="logo"
                alt="OpenVidu Logo"
                :src="openviduLogo"
            />

            <div class="session-title">{{ props.sessionId }}</div>
        </div>
        <div class="media-buttons">
            <NButton
                class="button"
                :color="localUser.isAudioActive ? ovTheme.logoBackgroundColor : ovTheme.warnColor"
                @click="emits('mic-status-changed')"
            >
                <MicrophoneIcon />
            </NButton>

            <NButton
                class="button"
                :color="localUser.isVideoActive ? ovTheme.logoBackgroundColor : ovTheme.warnColor"
                @click="emits('cam-status-changed')"
            >
                <VideoCameraIcon v-if="localUser.isVideoActive" />
                <VideoCameraSlashIcon v-else />
            </NButton>

            <NButton
                class="button"
                :color="localUser.isScreenShareActive ? ovTheme.tertiaryColor : ovTheme.logoBackgroundColor"
                @click="toggleScreenShare"
            >
                <TvIcon />
            </NButton>

            <NButton
                class="button"
                :color="ovTheme.logoBackgroundColor"
                @click="emits('switch-camera')"
            >
                <ArrowPathIcon />
            </NButton>

            <NButton
                class="button"
                :color="fullscreen ? ovTheme.tertiaryColor : ovTheme.logoBackgroundColor"
                @click="toggleFullscreen"
            >
                <ArrowsPointingInIcon v-if="fullscreen" />
                <ArrowsPointingOutIcon v-else />
            </NButton>

            <!-- <NButton
                class="button"
                :color="recording ? ovTheme.tertiaryColor : ovTheme.logoBackgroundColor"
                @click="toggleRecording"
            >
                <ViewfinderCircleIcon />
            </NButton> -->

            <NButton
                class="leave-session-button"
                :color="ovTheme.warnColor"
                @click="emits('leave-session')"
            >
                <PhoneXMarkIcon />
            </NButton>
        </div>
        <div class="menu-buttons">
            <NButton
                class="button"
                :color="recording ? ovTheme.tertiaryColor : ovTheme.primaryColor"
                @click="toggleChat"
            >
                <ChatBubbleOvalLeftIcon />
            </NButton>
        </div>
    </div>
</template>

<style scoped lang="scss">
.toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #303030;
    height: 70px;
    padding: 0 16px;

    @media (max-width: 400px) {
        padding: 0 8px;
    }

    .info {
        display: flex;
        align-items: center;
        gap: 16px;

        @media (max-width: 400px) {
            display: none;
        }

        .logo {
            max-width: 35px;
            max-height: 35px;
            padding: 10px;
            border-radius: 5px;
            background-color: #3a3d3d;
        }
    }

    .button {
        border-radius: v-bind('ovTheme.buttonsRadius');
        width: 40px;
        height: 40px;
        padding: 0;

        svg {
            height: 20px;
            width: 20px;
        }
    }

    .leave-session-button {
        border-radius: v-bind('ovTheme.leaveButtonRadius');
        width: 60px;
        height: 40px;
        padding: 0;

        svg {
            height: 20px;
            width: 20px;
        }
    }

    .media-buttons {
        display: flex;
        align-items: center;
        gap: 12px;

        @media (max-width: 400px) {
            gap: 4px;
        }
    }

    .menu-buttons {
    }
}
</style>

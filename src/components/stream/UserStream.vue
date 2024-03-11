<script setup lang="ts">
import { User } from '@src/types';
import OvVideo from './OvVideo.vue';
import { MicrophoneIcon, VideoCameraSlashIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/vue/20/solid';
import { NButton } from 'naive-ui';
import { ref } from 'vue';

const props = defineProps<{
    user: User;
}>();

const mutedSound = ref(false);

const toggleSound = () => {
    mutedSound.value = !mutedSound.value;
};
</script>

<template>
    <div class="user-stream">
        <div class="nickname">{{ props.user.nickname }}</div>
        <div
            v-if="props.user.streamManager"
            class="video-container"
        >
            <OvVideo
                class="ov-video"
                :muted-sound="mutedSound"
                :user="props.user"
            />

            <div class="status-icons">
                <div
                    class="cam-icon"
                    v-if="!props.user.isVideoActive"
                >
                    <VideoCameraSlashIcon />
                </div>
                <div
                    class="mic-icon"
                    v-if="!props.user.isAudioActive"
                >
                    <MicrophoneIcon />
                </div>
            </div>

            <div>
                <NButton
                    class="volume-button"
                    color="#000000c4"
                    @click="toggleSound"
                >
                    <SpeakerXMarkIcon v-if="mutedSound" />
                    <SpeakerWaveIcon v-else />
                </NButton>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.user-stream {
    // width: 100%;
    // height: 100%;
    // position: absolute;
    // overflow: hidden;
    position: relative;

    .nickname {
        background: rgba(58, 64, 74, 0.651);
        padding: 5px !important;
        position: absolute;
        z-index: 999;
        color: #ffffff;
    }

    .video-container {
        height: 100%;

        .ov-video {
            -o-object-fit: cover;
            object-fit: cover;
            width: 100%;
            height: 100%;
            color: #ffffff;
            margin: 0;
            padding: 0;
            border: 0;
            font-size: 100%;
            font-family: Arial, Helvetica, sans-serif;
        }

        .status-icons {
            bottom: 0;
            background: #c71100;
            width: 40px;
            height: fit-content;
            position: absolute;
            color: #ffffff;

            .cam-icon,
            .mic-icon {
                text-align: center;
                padding: 6px;
            }
        }

        .volume-button {
            // background-color: rgba(0, 0, 0, 0.769);
            position: absolute;
            bottom: 45px;
            right: 1px;
            z-index: 1000;
            color: #ffffff;
            padding: 0;

            svg {
                width: 24px;
                height: 24px;
            }
        }
    }
}
</style>

<script setup lang="ts">
import { User } from '@src/types';
import { onMounted, onUpdated, ref } from 'vue';

const props = defineProps<{
    mutedSound?: boolean;
    user: User;
}>();

const videoEl = ref<HTMLVideoElement>();

onMounted(() => {
    // props.streamManager.addVideoElement(videoEl.value);
    if (props.user.streamManager && videoEl.value) {
        props.user.streamManager.addVideoElement(videoEl.value);
    }

    if (props.user.streamManager && videoEl.value) {
        props.user.streamManager.stream.session.on('signal:userChanged', (event) => {
            if (!event.data) return;
            const data = JSON.parse(event.data);
            if (data.isScreenShareActive !== undefined) {
                if(!props.user.streamManager) return;
                if(!videoEl.value) return;
                props.user.streamManager.addVideoElement(videoEl.value);
            }
        });
    }
});

onUpdated(()=>{
    if (props.user.streamManager && videoEl.value) {
        props.user.streamManager.addVideoElement(videoEl.value);
    }
})
</script>

<template>
    <video
        ref="videoEl"
        autoplay
        :muted="props.mutedSound"
    />
</template>

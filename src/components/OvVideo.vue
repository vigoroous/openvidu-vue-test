<script setup lang="ts">
import { StreamManager } from "openvidu-browser";
import { onMounted, ref } from "vue";

const props = defineProps<{
  streamManager: StreamManager;
}>();

const videoEl = ref<HTMLVideoElement>();

onMounted(() => {
  if (!videoEl.value) return;
  props.streamManager.addVideoElement(videoEl.value);
});
</script>

<template>
  <video ref="videoEl" autoplay />
</template>

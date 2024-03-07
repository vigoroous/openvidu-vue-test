<script setup lang="ts">
import OvVideo from "./OvVideo.vue";
import { computed } from "vue";
import { StreamManager } from "openvidu-browser";

const props = defineProps<{
  streamManager: StreamManager;
}>();

const clientData = computed(() => {
  const { clientData } = getConnectionData();
  return clientData;
});
const getConnectionData = () => {
  const { connection } = props.streamManager.stream;
  return JSON.parse(connection.data);
};
</script>

<template>
  <div v-if="streamManager">
    <OvVideo :stream-manager="streamManager" />
    <div>
      <p>{{ clientData }}</p>
    </div>
  </div>
</template>

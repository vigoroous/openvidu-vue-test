<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';

const props = defineProps<{
    connectionId: string;
    nickname: string;
}>();

const avatarColor = ref('');
const firstLetter = ref('');

const getColor = (str: string) => {
    let hash = 0;
    str.split('').forEach((char) => {
        hash = char.charCodeAt(0) + ((hash << 5) - hash);
    });
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
        color += value.toString(16).padStart(2, '0');
    }
    return color;
};

onBeforeMount(() => {
    avatarColor.value = getColor(props.connectionId);
    firstLetter.value = props.nickname[0];
});
</script>

<template>
    <div
        class="user-avatar"
        :style="{ backgroundColor: avatarColor }"
    >
        {{ firstLetter }}
    </div>
</template>

<style scoped lang="scss">
.user-avatar {
    height: 60px;
    width: 60px;
    border-radius: 12px;
    border: 2px solid #ffffff;
    color: #000;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
}
</style>

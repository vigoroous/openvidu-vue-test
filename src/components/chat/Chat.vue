<script setup lang="ts">
import { userStore, themeStore } from '@src/store';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { NButton, NInput, NTooltip } from 'naive-ui';
import { XMarkIcon } from '@heroicons/vue/16/solid';
import { PaperAirplaneIcon } from '@heroicons/vue/24/solid';
import { ChatMessage } from '@src/types';
import UserMessage from './UserMessage.vue';

const props = defineProps<{
    show?: boolean;
}>();

const { user } = storeToRefs(userStore);
const { colors } = storeToRefs(themeStore);

const sessionId = computed(() => user.value.streamManager?.stream.session.sessionId);

const messageList = ref<ChatMessage[]>([]);
const message = ref('');
const emits = defineEmits<{
    (e: 'close'): void;
    (e: 'message-received'): void;
}>();

const close = () => {
    emits('close');
};

const messageReceived = () => {
    emits('message-received');
};
const handlePressKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
};

const sendMessage = async () => {
    if (message.value) {
        const newMessage = message.value.replace(/ +(?= )/g, '');
        if (newMessage && user.value.streamManager) {
            const data = {
                message: newMessage,
                nickname: user.value.nickname,
                streamId: user.value.streamManager.stream.streamId,
            };

            await user.value.streamManager.stream.session.signal({
                data: JSON.stringify(data),
                type: 'chat',
            });
        }
    }

    message.value = '';
};

onMounted(() => {
    if (!user.value.streamManager) return;
    user.value.streamManager.stream.session.on('signal:chat', (event) => {
        if (!event.data || !event.from) return;
        const data = JSON.parse(event.data) as ChatMessage;

        messageList.value.push({
            connectionId: event.from.connectionId,
            nickname: data.nickname,
            message: data.message,
            createdAt: data.createdAt,
            streamId: data.streamId,
        });

        messageReceived();
    });
});
</script>

<template>
    <div class="chat-container">
        <div
            class="chat-component"
            v-show="props.show"
        >
            <div class="chat-toolbar">
                <span v-if="sessionId">{{ sessionId }} - CHAT</span>
                <NButton
                    class="close-button"
                    @click="close"
                >
                    <XMarkIcon
                        class="close-icon"
                        :color="colors.default900"
                    />
                </NButton>
            </div>
            <div class="message-list">
                <UserMessage
                    v-for="(message, idx) in messageList"
                    :key="idx"
                    :message="message"
                />
            </div>

            <div class="message-input">
                <NInput
                    v-model:value="message"
                    placeholder="Send a messge"
                    class="chat-input"
                    @keyup="handlePressKey"
                />
                <NTooltip title="Send message">
                    <NButton
                        class="send-button"
                        @click="sendMessage"
                    >
                        <PaperAirplaneIcon />
                    </NButton>
                </NTooltip>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.chat-container {
    position: absolute;
    z-index: 0;
    width: 100%;
    height: 100%;

    .chat-component {
        background-color: #b8b8b8;
        position: absolute;
        z-index: 99999;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        margin: auto;
        height: calc(100% - 30px);
        width: calc(100% - 30px);
        border-radius: 20px;

        .chat-toolbar {
            height: 30px;
            background-color: #3d3d3d;
            box-sizing: border-box;
            font-weight: bold;
            font-size: 14px;
            text-align: center;
            padding-top: 4px;
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
            color: #ffffff;

            .close-button {
                position: absolute;
                right: 0;
                top: -8px;
            }
        }

        .message-list {
            padding: 0 15px;
            height: calc(100% - 80px);
            overflow: auto;
        }

        .message-input {
            position: absolute;
            bottom: 0px;
            width: 100%;
            background-color: #ffffff;
            text-align: center;
            padding: 10px 0px;
            height: 30px;
            border-bottom-left-radius: 6px;
            border-bottom-right-radius: 6px;
            .chat-input {
                width: 90%;
                height: 100%;
                border: none;
                outline: none;
                font-size: 14px;
                margin-left: -6%;
                color: #000000;
            }

            .send-button {
                background-color: #81e9b0;
                position: absolute;
                right: 10px;
                top: 0;
                bottom: 0;
                margin: auto;
                border: 1px solid #7ae2a9;
                box-shadow: none !important;
                margin-left: 3px !important;
                margin-bottom: 2px !important;
            }
        }


        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-thumb {
            background-color: #6b6b6b;
        }
    }
}
</style>

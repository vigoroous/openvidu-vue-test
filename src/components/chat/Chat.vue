<script setup lang="ts">
import { userStore, themeStore } from '@src/store';
import { storeToRefs } from 'pinia';
import { computed, onMounted, onUpdated, ref } from 'vue';
import { NButton, NInput, NModal, NScrollbar, NTooltip } from 'naive-ui';
import { XMarkIcon } from '@heroicons/vue/20/solid';
import { PaperAirplaneIcon } from '@heroicons/vue/24/solid';
import { ChatMessage } from '@src/types';
import UserMessage from './UserMessage.vue';
import { ovTheme } from '@src/consts/ov.consts';

const props = defineProps<{
    show?: boolean;
}>();

const { localUser } = storeToRefs(userStore);
const { colors } = storeToRefs(themeStore);

const sessionId = computed(() => localUser.value.streamManager?.stream.session.sessionId);

const messageList = ref<ChatMessage[]>([]);
const message = ref('');
const emits = defineEmits<{
    (e: 'close'): void;
    (e: 'message-received'): void;
}>();

const isInit = ref(false);

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
        if (newMessage && localUser.value.streamManager) {
            const data = {
                message: newMessage,
                nickname: localUser.value.nickname,
                streamId: localUser.value.streamManager.stream.streamId,
                createdAt: Date.now(),
            };

            await localUser.value.streamManager.stream.session.signal({
                data: JSON.stringify(data),
                type: 'chat',
            });
        }
    }

    message.value = '';
};

onUpdated(() => {
    if (!isInit.value) {
        if (!localUser.value.streamManager) return;
        localUser.value.streamManager.stream.session.on('signal:chat', (event) => {
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

        isInit.value = true;
    }
});
</script>

<template>
    <NModal
        :show="props.show"
        class="chat-container"
    >
        <div class="chat-component">
            <div class="chat-toolbar">
                <span
                    class="title"
                    v-if="sessionId"
                >
                    {{ sessionId }} - CHAT
                </span>
                <NButton
                    class="close-button"
                    @click="close"
                    text
                    color="#ffffff"
                >
                    <XMarkIcon
                        class="close-icon"
                        :color="colors.default900"
                    />
                </NButton>
            </div>
            <div class="message-list">
                <NScrollbar style="height: 100%; flex: 1">
                    <UserMessage
                        v-for="(message, idx) in messageList"
                        :key="idx"
                        :message="message"
                    />
                </NScrollbar>
            </div>

            <div class="message-input">
                <NInput
                    v-model:value="message"
                    placeholder="Send a messge"
                    class="chat-input"
                    @keyup="handlePressKey"
                    :bordered="false"
                    type="textarea"
                    :autosize="{ minRows: 1, maxRows: 8 }"
                />
                <div class="actions">
                    <div class="button-wrapper">
                        <NTooltip trigger="hover">
                            <template #trigger>
                                <NButton
                                    class="send-button"
                                    @click="sendMessage"
                                    :bordered="false"
                                >
                                    <PaperAirplaneIcon />
                                </NButton>
                            </template>
                            Send Message
                        </NTooltip>
                    </div>
                </div>
            </div>
        </div>
    </NModal>
</template>

<style scoped lang="scss">
.chat-component {
    height: calc(100vh - 80px);
    width: calc(100vw - 80px);
    max-width: 600px;
    max-height: 800px;
    background-color: #b8b8b8;
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .chat-toolbar {
        height: 40px;
        background-color: #3d3d3d;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;

        .title {
            font-weight: bold;
            font-size: 14px;
            text-align: center;
            color: #ffffff;
        }
        .close-button {
            // padding: 0;
            svg {
                width: 24px;
                height: 24px;
            }
        }
    }

    .message-list {
        padding: 0 15px;
        // height: calc(100% - 80px);
        // overflow: auto;
        display: flex;
        flex: 1;
        overflow: hidden;
    }

    .message-input {
        display: flex;
        background-color: #ffffff;
        // height: 40px;
        align-items: center;

        .chat-input {
            height: 100%;
            padding: 8px 0;
        }

        .actions {
            height: 100%;
            display: flex;
            align-items: flex-end;
            .button-wrapper {
                padding: 8px;

                .send-button {
                    svg {
                        color: #598eff;
                        width: 24px;
                        height: 24px;
                    }
                }
            }
        }
    }
}
</style>

<script setup lang="ts">
import UserAvatar from './UserAvatar.vue';
import { ChatMessage } from '@src/types';
import { storeToRefs } from 'pinia';
import { userStore } from '@src/store';

const props = defineProps<{
    message: ChatMessage;
}>();

const { localUser } = storeToRefs(userStore);
</script>

<template>
    <div
        class="user-message"
        :class="{
            left: props.message.connectionId !== localUser.connectionId,
            right: props.message.connectionId === localUser.connectionId,
        }"
    >
        <UserAvatar
            class="user-avatar"
            :connection-id="props.message.connectionId"
            :nickname="props.message.nickname"
        />

        <div class="msg-detail">
            <div class="msg-info">
                <p>{{ props.message.nickname }}</p>
                <p>{{ new Date(props.message.createdAt).toLocaleString('ru-RU') }}</p>
            </div>
            <div class="msg-content">
                <span class="triangle" />
                <p class="text">{{ props.message.message }}</p>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.user-message {
    position: relative;
    padding: 7px 0;

    .user-avatar {
        position: absolute;
        border-radius: 45px;
        width: 40px;
        height: 40px;
        top: 15px;
    }

    .msg-detail {
        width: calc(100% - 65px);
        display: inline-block;

        p {
            margin: 0;
            font-size: 15px;
        }

        .msg-info p {
            font-size: 0.8em;
            color: #000000;
            font-style: italic;
        }

        .msg-content {
            position: relative;
            margin-top: 5px;
            border-radius: 5px;
            padding: 8px;
            color: #000000;
            width: auto;
            max-width: 80%;

            .triangle {
                border-radius: 2px;
                height: 8px;
                width: 8px;
                top: 12px;
                display: block;
                -webkit-transform: rotate(45deg);
                transform: rotate(45deg);
                position: absolute;
            }

            .text {
                word-break: break-all;
                color: #000000;
            }
        }
    }

    &.left {
        .msg-detail .msg-info {
            text-align: left;
        }

        .msg-detail {
            padding-left: 65px;
        }

        .user-avatar {
            // left: -5px;
            // border: 1px solid #f0f0f094;
        }

        .msg-detail .msg-content {
            background-color: #f0f0f0;
            float: left;
        }
        .msg-detail .msg-content .triangle {
            background-color: #f0f0f0;
            border-bottom-width: 0;
            border-left-width: 0;
            left: -5px;
        }
    }

    &.right {
        .msg-detail .msg-info {
            text-align: right;
        }
        .user-img {
            right: -5px;
            border: 1px solid #c8ffe8ab;
        }

        .msg-detail .msg-content {
            background-color: #c8ffe8;
            float: right;
        }
        .msg-detail .msg-content span.triangle {
            background-color: #c8ffe8;
            border-bottom-width: 0;
            border-left-width: 0;
            right: -5px;
        }
    }
}
</style>

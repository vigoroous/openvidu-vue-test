import { defineStore } from 'pinia';
import { ref } from 'vue';
import { User } from '../../types';

export const useUserStore = defineStore('user', () => {
    const localUser = ref<User>({
        connectionId: '',
        isAudioActive: true,
        isVideoActive: true,
        isScreenShareActive: false,
        nickname: '',
        streamManager: null,
        type: 'local',
    });

    return {
        localUser,
    };
});

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { User } from '../../types';

export const useUserStore = defineStore('user', () => {
    const user = ref<User>({
        connectionId: '',
        audioActive: true,
        videoActive: true,
        screenShareActive: false,
        nickname: '',
        streamManager: null,
        type: 'local',
    });

    return {
        user,
    };
});

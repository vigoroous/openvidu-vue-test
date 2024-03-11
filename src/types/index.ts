import { StreamManager } from 'openvidu-browser';

export type User = {
    connectionId: string;
    isAudioActive: boolean;
    isVideoActive: boolean;
    isScreenShareActive: boolean;
    nickname: string;
    streamManager: StreamManager | null;
    type: 'remote' | 'local';
};


export type ChatMessage = {
    connectionId: string;
    streamId: string;
    createdAt: number;
    nickname: string;
    message: string;
};
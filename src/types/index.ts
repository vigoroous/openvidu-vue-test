import { StreamManager } from 'openvidu-browser';

export type User = {
    connectionId: string;
    audioActive: boolean;
    videoActive: boolean;
    screenShareActive: boolean;
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
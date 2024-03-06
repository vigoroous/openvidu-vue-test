import axios from 'axios';
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common.Authorization = 'Basic ' + btoa('OPENVIDUAPP:MY_SECRET');

const APPLICATION_SERVER_URL = '/';

export const getToken = async (sessionId: string) => {
    await createSession(sessionId);
    return await createToken(sessionId);
};

const createSession = async (sessionId: string) => {
    try {
        const response = await axios.post(APPLICATION_SERVER_URL + 'openvidu/api/sessions', {
            customSessionId: sessionId,
        });
        return response.data;
    } catch (e) {
        const response = await axios.get(APPLICATION_SERVER_URL + 'openvidu/api/sessions/' + sessionId);
        return response.data;
    }
};

const createToken = async (sessionId: string) => {
    const response = await axios.post(
        APPLICATION_SERVER_URL + 'openvidu/api/sessions/' + sessionId + '/connection',
        {}
    );

    return response.data.token as string;
};

export const startRecording = async (sessionId: string) => {
    const response = await axios.post(APPLICATION_SERVER_URL + 'openvidu/api/recordings/start', {
        session: sessionId,
    });
    return response.data.id as string;
};

export const stopRecording = async (recordingId: string) => {
    await axios.post(APPLICATION_SERVER_URL + 'openvidu/api/recordings/stop/' + recordingId, {});
};

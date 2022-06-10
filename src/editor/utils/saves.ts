import Axios from 'axios';

const api = Axios.create({baseURL: '/saves'});

export const saves = {
    async dir(path: string): Promise<string[]> {
        return (await api.get<string[]>(path)).data;
    },
    async read(path: string): Promise<ArrayBuffer> {
        return (await api.get(path, {responseType: 'arraybuffer'})).data;
    },
    async write(path: string, content: Blob) {
        const formData = new FormData();
        formData.append('file', content);
        await api.post(path, formData, {headers: {'Content-Type': 'multipart/form-data'}});
    }
};
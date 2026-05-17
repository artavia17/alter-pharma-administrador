import api from '../api';

interface SystemSettingResponse {
    status: number;
    message: string;
    data: {
        key: string;
        value: number;
    };
}

const getSystemSetting = async (key: string) => {
    const response = await api.get<SystemSettingResponse>(`/administrator/system-settings/${key}`);
    return response.data;
};

const updateSystemSetting = async (key: string, value: number) => {
    const response = await api.put<SystemSettingResponse>(`/administrator/system-settings/${key}`, { value });
    return response.data;
};

export { getSystemSetting, updateSystemSetting };

import { ApiResponse } from "../../types/services/api.types";
import { MyAccountResponse, VerifyEmailResponse } from "../../types/services/protected/my-account.types";
import api from "../api";

const myAccount = async () => {
    const response = await api.get<MyAccountResponse>("/administrator/my-account");
    return response.data;
};

const getProfileImage = async (): Promise<string> => {
    const response = await api.get("/administrator/my-account/profile-image", {
        responseType: 'blob'
    });
    return URL.createObjectURL(response.data);
};

const sendVerificationEmail = async () => {
    const response = await api.post<ApiResponse<void>>("/administrator/my-account/send-verification-email");
    return response.data;
}

const verifyEmail = async (email: string, token: string) => {
    const response = await api.post<VerifyEmailResponse>(`/administrator/my-account/verify-email/${email}/${token}`);
    return response.data;
}

const updateMyAccount = async (formData: FormData) => {
    const response = await api.post<MyAccountResponse>("/administrator/my-account/", formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
}

export {
    myAccount,
    getProfileImage,
    sendVerificationEmail,
    verifyEmail,
    updateMyAccount
}
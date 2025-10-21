import { MyAccountResponse } from "../../types/services/protected/my-account.types";
import api from "../api";

const myAccount = async () => {
    const response = await api.get<MyAccountResponse>("/administrator/my-account");
    return response.data;
};

export {
    myAccount,  
}
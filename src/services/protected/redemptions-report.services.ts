import api from "../api";
import { RedemptionsDetailResponse } from "../../types/services/protected/redemptions-report.types";

interface GetRedemptionDetailsParams {
    is_chain?: boolean;
    pharmacy_id?: number;
    sub_pharmacy_id?: number;
    sub_pharmacy_name?: string;
    start_date?: string;
    end_date?: string;
    per_page?: number;
    page?: number;
}

const getRedemptionDetails = async (params: GetRedemptionDetailsParams = {}) => {
    const query = new URLSearchParams();
    if (params.is_chain !== undefined) query.append("is_chain", params.is_chain ? "true" : "false");
    if (params.pharmacy_id) query.append("pharmacy_id", params.pharmacy_id.toString());
    if (params.sub_pharmacy_id) query.append("sub_pharmacy_id", params.sub_pharmacy_id.toString());
    if (params.sub_pharmacy_name) query.append("sub_pharmacy_name", params.sub_pharmacy_name);
    if (params.start_date) query.append("start_date", params.start_date);
    if (params.end_date) query.append("end_date", params.end_date);
    if (params.per_page) query.append("per_page", params.per_page.toString());
    if (params.page) query.append("page", params.page.toString());

    const response = await api.get<RedemptionsDetailResponse>(
        `/administrator/reports/redemptions/details?${query.toString()}`
    );
    return response.data;
};

const exportRedemptionDetails = async (params: Omit<GetRedemptionDetailsParams, "page" | "per_page">) => {
    const query = new URLSearchParams();
    if (params.is_chain !== undefined) query.append("is_chain", params.is_chain ? "true" : "false");
    if (params.pharmacy_id) query.append("pharmacy_id", params.pharmacy_id.toString());
    if (params.sub_pharmacy_id) query.append("sub_pharmacy_id", params.sub_pharmacy_id.toString());
    if (params.sub_pharmacy_name) query.append("sub_pharmacy_name", params.sub_pharmacy_name);
    if (params.start_date) query.append("start_date", params.start_date);
    if (params.end_date) query.append("end_date", params.end_date);
    query.append("per_page", "10000");

    const response = await api.get<RedemptionsDetailResponse>(
        `/administrator/reports/redemptions/details?${query.toString()}`
    );
    return response.data;
};

export { getRedemptionDetails, exportRedemptionDetails };

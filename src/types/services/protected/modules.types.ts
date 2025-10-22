import { ApiResponse } from "../api.types";

export interface ModulePermission {
    id: number;
    module_id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface ModuleData {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
    permissions?: ModulePermission[];
}

export interface ModulesSuccessData {
    modules: ModuleData[];
}

export interface ModulesErrorData {
    message?: string;
}

export type ModulesResponse =
    | ApiResponse<ModuleData[]>
    | ApiResponse<ModulesErrorData>;

export type SingleModuleResponse =
    | ApiResponse<ModuleData>
    | ApiResponse<ModulesErrorData>;

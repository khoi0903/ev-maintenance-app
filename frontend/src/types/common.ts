export type ApiSuccess<T> = { success: true; data: T };
export type ApiError   = {
  message: string; success: false; error: { code: number; message: string; details?: any } 
};
export type ApiResp<T> = ApiSuccess<T> | ApiError;

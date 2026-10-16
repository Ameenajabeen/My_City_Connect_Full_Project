export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message: string;
  errorCode?: string;
  timestamp?: string;
}

export function createSuccessResponse<T>(data: T, message = 'Operation successful'): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(message: string, errorCode = 'INTERNAL_ERROR', data: any = null): ApiResponse {
  return {
    success: false,
    data,
    message,
    errorCode,
    timestamp: new Date().toISOString(),
  };
}

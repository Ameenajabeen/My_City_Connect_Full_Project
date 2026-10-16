import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../utils/response.util';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        // If already formatted, return as-is
        if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
          return res;
        }

        return {
          success: true,
          data: res ?? null,
          message: 'Operation completed successfully',
          timestamp: new Date().toISOString(),
        };
      })
    );
  }
}

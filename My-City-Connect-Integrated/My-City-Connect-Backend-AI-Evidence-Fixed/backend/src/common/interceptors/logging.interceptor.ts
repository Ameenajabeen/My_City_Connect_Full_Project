import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || 'anonymous';
    const userId = request.user?.id || 'unauthenticated';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const delay = Date.now() - now;
          this.logger.log(
            `[${method}] ${url} -> ${statusCode} [${delay}ms] (user: ${userId}, ip: ${ip})`
          );
        },
        error: (error) => {
          const delay = Date.now() - now;
          this.logger.warn(
            `[${method}] ${url} -> FAILED [${delay}ms] (user: ${userId}) - ${error.message}`
          );
        },
      })
    );
  }
}

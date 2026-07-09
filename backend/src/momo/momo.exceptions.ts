import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Raised whenever the MTN MoMo API rejects a request or is unreachable.
 * Mapped to 502 (Bad Gateway) since the failure originates upstream, not
 * from the caller of our API.
 */
export class MomoApiException extends HttpException {
  constructor(message: string, public readonly upstreamStatus?: number) {
    super(
      {
        message,
        upstreamStatus,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}

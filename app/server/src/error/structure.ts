import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class ApplicationError extends Error {
    asHttpException(code: ContentfulStatusCode) {
        return new HTTPException(code, { cause: this.message });
    }
}

export type NoError<T> = Exclude<T, ApplicationError>;

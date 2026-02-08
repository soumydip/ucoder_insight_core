
import { IMinimizedPayload } from "./loger";

export const logBuffer: Record<string, { payload: IMinimizedPayload; count: number }> = {};
import { Request } from "express";

export interface RequestWithUser extends Request {
    user: {
        sub: number;
        username: string;
    };
}

export interface RequestWithOptionalUser extends Request {
    user?: {
        sub: number;
        username: string;
    };
}

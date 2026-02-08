import {
    Body,
    Controller,
    Post,
    Req,
    Res,
    UnauthorizedException,
} from "@nestjs/common";
import { CookieOptions, Request, Response } from "express";
import { LoginDto, RegisterDto } from "./auth.dto";
import { AuthService } from "./auth.service";

const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
} satisfies CookieOptions;

@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post("register")
    async register(
        @Res({ passthrough: true }) response: Response,
        @Body() registerDto: RegisterDto,
    ) {
        const token = await this.authService.register(
            registerDto.username,
            registerDto.email,
            registerDto.password,
        );
        response.cookie("auth_token", token, COOKIE_OPTIONS);
    }

    @Post("login")
    async login(
        @Res({ passthrough: true }) response: Response,
        @Body() loginDto: LoginDto,
    ) {
        const token = await this.authService.login(
            loginDto.username,
            loginDto.password,
        );
        response.cookie("auth_token", token, COOKIE_OPTIONS);
    }

    @Post("refresh")
    async refresh(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const currentToken = request.cookies?.["auth_token"] as
            | string
            | undefined;
        if (!currentToken) throw new UnauthorizedException();

        const token = await this.authService.refreshToken(currentToken);
        response.cookie("auth_token", token, COOKIE_OPTIONS);
    }

    @Post("logout")
    logout(@Res({ passthrough: true }) response: Response) {
        response.clearCookie("auth_token", COOKIE_OPTIONS);
    }
}

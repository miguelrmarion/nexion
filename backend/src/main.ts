import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import * as cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ["error", "warn", "log"],
    });
    app.enableCors({
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        credentials: true,
    });
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());
    await app.listen(process.env.PORT ?? 3001);
}

bootstrap();

import { Global, Module } from "@nestjs/common";
import { CloudinaryService } from "./services/cloudinary.service";
import { PrismaService } from "./services/prisma.service";
import { RatingCalculatorService } from "./services/rating-calculator.service";

@Global()
@Module({
    providers: [PrismaService, CloudinaryService, RatingCalculatorService],
    exports: [PrismaService, CloudinaryService, RatingCalculatorService],
})
export class CommonModule {}

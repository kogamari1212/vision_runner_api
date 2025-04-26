-- CreateTable
CREATE TABLE "Future" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Future_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "text" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_tenantId_userId_key" ON "Post"("tenantId", "userId");

-- CreateTable
CREATE TABLE "classroom" (
    "classId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "section" TEXT,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "classroom_pkey" PRIMARY KEY ("classId")
);

-- CreateTable
CREATE TABLE "enrolled" (
    "enrollId" TEXT NOT NULL,
    "studId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "enrolled_pkey" PRIMARY KEY ("enrollId")
);

-- CreateTable
CREATE TABLE "chapter" (
    "chapterId" TEXT NOT NULL,
    "chapterName" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "chapter_pkey" PRIMARY KEY ("chapterId")
);

-- CreateTable
CREATE TABLE "content" (
    "fileId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,

    CONSTRAINT "content_pkey" PRIMARY KEY ("fileId")
);

-- AddForeignKey
ALTER TABLE "classroom" ADD CONSTRAINT "classroom_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrolled" ADD CONSTRAINT "enrolled_studId_fkey" FOREIGN KEY ("studId") REFERENCES "user"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrolled" ADD CONSTRAINT "enrolled_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classroom"("classId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter" ADD CONSTRAINT "chapter_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classroom"("classId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter" ADD CONSTRAINT "chapter_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "user"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapter"("chapterId") ON DELETE RESTRICT ON UPDATE CASCADE;

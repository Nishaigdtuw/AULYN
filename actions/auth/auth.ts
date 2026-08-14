'use server'

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()


export async function loginUser(email: string, password: string, type: string){
    const res = await prisma.user.findFirst({
        where: {
            email,
            password,
            type
        }
    })
    return res;

}
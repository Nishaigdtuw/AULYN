'use server'

import { prisma } from "@/lib/prisma"


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
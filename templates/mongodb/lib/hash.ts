import bcrypt from "bcrypt"

const salt = 12

export async function hashedPassword(password: string){
    return bcrypt.hash(password,salt)
}

export async function comparePassword(plainPassword: string, hashedPassword: string){
    return bcrypt.compare(plainPassword,hashedPassword)
}
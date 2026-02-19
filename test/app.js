import bcrypt, { hash } from 'bcrypt'

const pass = "Prakash_Budha_Magar"
const encPass = await bcrypt.hash(pass, 10)

console.log(pass, encPass)
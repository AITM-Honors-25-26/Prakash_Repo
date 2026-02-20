import bcrypt from 'bcrypt'

const pass = "Prakash_Budha_Magar"


const start = performance.now()

 
const encPass = await bcrypt.hash(pass,10)
const end = performance.now()

const timeTaken = (end - start).toFixed(2)

console.log(`Password: ${pass}`)
console.log(`Hash: ${encPass}`)
console.log(`Time taken to generate salt and hash: ${timeTaken} ms`)
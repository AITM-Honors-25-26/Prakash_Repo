import bcrypt from 'bcrypt'

const pass = "Prakash_Budha_Magar"
const start = performance.now()
const salt = await bcrypt.genSalt(10)

const encPass = await bcrypt.hash(pass, salt)

const end = performance.now()

const timeTaken = (end - start).toFixed(2)

console.log(`Salt: ${salt}`)
console.log(`Password: ${pass}`)
console.log(`Hash: ${encPass}`)
console.log(`Time taken to generate hash: ${timeTaken} ms`)
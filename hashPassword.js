const bcrypt = require('bcrypt');

async function hashPassword() {
  const password = "userpassword";  // Use the user's actual password here
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("Hashed Password:", hashedPassword);
}

hashPassword();

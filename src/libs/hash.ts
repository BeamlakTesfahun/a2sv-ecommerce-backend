import bcrypt from "bcryptjs";
export const hash = async (plain: string) => bcrypt.hash(plain, 10);
export const compare = async (plain: string, hashed: string) =>
  bcrypt.compare(plain, hashed);

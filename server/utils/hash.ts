import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export const bcryptHash = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const bcryptVerify = async (hash: string, password: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

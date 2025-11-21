import { genSaltSync, hashSync, compare } from 'bcrypt';

const saltRounds = process.env.SALT_ROUNDS
  ? parseInt(process.env.SALT_ROUNDS, 10)
  : 10;

export const hashPassword = async (password: string) => {
  const salt = genSaltSync(saltRounds);
  return hashSync(password, salt);
};

export const isMatchPassword = async (password: string, hash: string): Promise<boolean> => {
  return await compare(password, hash);
};
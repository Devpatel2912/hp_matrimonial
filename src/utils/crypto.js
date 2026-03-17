import bcrypt from "bcryptjs";

export const hashValue = async (value) => bcrypt.hash(value, 10);
export const compareValue = async (value, hash) => bcrypt.compare(value, hash);


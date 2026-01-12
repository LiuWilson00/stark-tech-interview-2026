import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
}));
